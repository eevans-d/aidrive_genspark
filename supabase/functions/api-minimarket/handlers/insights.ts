// ============================================================================
// HANDLER: Insights — Arbitraje de Precios
// ============================================================================
// GET /insights/arbitraje  — productos con riesgo de pérdida o margen bajo
// GET /insights/compras    — oportunidades de compra (stock bajo + caída costo)
// GET /insights/producto/:id — payload unificado para un producto
// ============================================================================

import { ok, fail } from '../../_shared/response.ts';
import { createLogger } from '../../_shared/logger.ts';
import { queryTable, fetchWithParams } from '../helpers/supabase.ts';
import { isUuid } from '../helpers/validation.ts';

const logger = createLogger('api-insights');

type ApiHeaders = Record<string, string>;

// ============================================================================
// Types
// ============================================================================

interface ArbitrajeRow {
	producto_id: string;
	nombre_producto: string;
	sku: string | null;
	costo_proveedor_actual: number;
	costo_proveedor_prev: number | null;
	delta_costo_pct: number | null;
	precio_venta_actual: number | null;
	margen_vs_reposicion: number | null;
	riesgo_perdida: boolean;
	margen_bajo: boolean;
	fecha_ultima_comparacion: string;
}

interface OportunidadCompraRow extends ArbitrajeRow {
	cantidad_actual: number;
	stock_minimo: number;
	nivel_stock: string;
}

// ============================================================================
// GET /insights/arbitraje
// ============================================================================

export async function handleInsightsArbitraje(
	supabaseUrl: string,
	headers: ApiHeaders,
	responseHeaders: Record<string, string>,
	requestId: string
): Promise<Response> {
	try {
		// Query vista_arbitraje_producto for products with risk or low margin
		const params = new URLSearchParams();
		params.set(
			'select',
			'producto_id,nombre_producto,sku,costo_proveedor_actual,costo_proveedor_prev,delta_costo_pct,precio_venta_actual,margen_vs_reposicion,riesgo_perdida,margen_bajo,fecha_ultima_comparacion'
		);
		params.set('or', '(riesgo_perdida.eq.true,margen_bajo.eq.true)');
		params.set('order', 'riesgo_perdida.desc,margen_vs_reposicion.asc');
		params.set('limit', '50');

		const { data } = await fetchWithParams(
			supabaseUrl,
			'vista_arbitraje_producto',
			params,
			headers,
		);

		const rows = data as ArbitrajeRow[];

		logger.info('INSIGHTS_ARBITRAJE', {
			requestId,
			total: rows.length,
			riesgo: rows.filter(r => r.riesgo_perdida).length,
			margen_bajo: rows.filter(r => r.margen_bajo && !r.riesgo_perdida).length,
		});

		return ok(rows, 200, responseHeaders, {
			requestId,
			message: 'Productos con riesgo de pérdida o margen bajo',
			extra: { count: rows.length },
		});
	} catch (error) {
		logger.error('INSIGHTS_ARBITRAJE_ERROR', { requestId, error });
		throw error;
	}
}

// ============================================================================
// GET /insights/compras
// ============================================================================

export async function handleInsightsCompras(
	supabaseUrl: string,
	headers: ApiHeaders,
	responseHeaders: Record<string, string>,
	requestId: string
): Promise<Response> {
	try {
		// Query vista_oportunidades_compra (stock bajo + caída costo >= 10%)
		const params = new URLSearchParams();
		params.set(
			'select',
			'producto_id,nombre_producto,sku,costo_proveedor_actual,costo_proveedor_prev,delta_costo_pct,precio_venta_actual,margen_vs_reposicion,cantidad_actual,stock_minimo,nivel_stock,fecha_ultima_comparacion'
		);
		params.set('order', 'delta_costo_pct.asc,nivel_stock.asc');
		params.set('limit', '50');

		const { data } = await fetchWithParams(
			supabaseUrl,
			'vista_oportunidades_compra',
			params,
			headers,
		);

		const rows = data as OportunidadCompraRow[];

		logger.info('INSIGHTS_COMPRAS', {
			requestId,
			total: rows.length,
		});

		return ok(rows, 200, responseHeaders, {
			requestId,
			message: 'Oportunidades de compra: stock bajo con caída de costo',
			extra: { count: rows.length },
		});
	} catch (error) {
		logger.error('INSIGHTS_COMPRAS_ERROR', { requestId, error });
		throw error;
	}
}

// ============================================================================
// GET /insights/producto/:id
// ============================================================================

export async function handleInsightsProducto(
	supabaseUrl: string,
	headers: ApiHeaders,
	responseHeaders: Record<string, string>,
	requestId: string,
	productoId: string
): Promise<Response> {
	try {
		if (!isUuid(productoId)) {
			return fail(
				'VALIDATION_ERROR',
				'id de producto invalido',
				400,
				responseHeaders,
				{ requestId }
			);
		}

		// Fetch arbitraje data for specific product
		const params = new URLSearchParams();
		params.set(
			'select',
			'producto_id,nombre_producto,sku,costo_proveedor_actual,costo_proveedor_prev,delta_costo_pct,precio_venta_actual,margen_vs_reposicion,riesgo_perdida,margen_bajo,fecha_ultima_comparacion'
		);
		params.set('producto_id', `eq.${productoId}`);
		params.set('limit', '1');

		const { data } = await fetchWithParams(
			supabaseUrl,
			'vista_arbitraje_producto',
			params,
			headers,
		);

		const rows = data as ArbitrajeRow[];

		if (rows.length === 0) {
			return fail(
				'NOT_FOUND',
				'Sin datos de arbitraje para este producto',
				404,
				responseHeaders,
				{ requestId }
			);
		}

		logger.info('INSIGHTS_PRODUCTO', { requestId, productoId });

		return ok(rows[0], 200, responseHeaders, { requestId });
	} catch (error) {
		logger.error('INSIGHTS_PRODUCTO_ERROR', { requestId, productoId, error });
		throw error;
	}
}

// ============================================================================
// HANDLER: Search
// ============================================================================
// Global search across productos, proveedores, tareas, pedidos, and clientes
// ============================================================================

import { ok, fail } from '../../_shared/response.ts';
import { createLogger } from '../../_shared/logger.ts';
import { fetchWithParams } from '../helpers/supabase.ts';
import { sanitizeTextParam } from '../helpers/validation.ts';

const logger = createLogger('api-search');

type ApiHeaders = Record<string, string>;

interface SearchResult {
	productos: unknown[];
	proveedores: unknown[];
	tareas: unknown[];
	pedidos: unknown[];
	clientes: unknown[];
}

// ============================================================================
// GLOBAL SEARCH
// ============================================================================

export async function handleGlobalSearch(
	supabaseUrl: string,
	headers: ApiHeaders,
	responseHeaders: Record<string, string>,
	requestId: string,
	query: string,
	limit: number
): Promise<Response> {
	try {
		const sanitized = sanitizeTextParam(query);
		if (!sanitized || sanitized.length < 2) {
			return fail(
				'VALIDATION_ERROR',
				'El termino de busqueda debe tener al menos 2 caracteres',
				400,
				responseHeaders,
				{ requestId }
			);
		}

		const perEntityLimit = Math.min(limit, 10);

		// Search in parallel across all entities
		const [productosResult, proveedoresResult, tareasResult, pedidosResult, clientesResult] = await Promise.all([
			searchProductos(supabaseUrl, headers, sanitized, perEntityLimit),
			searchProveedores(supabaseUrl, headers, sanitized, perEntityLimit),
			searchTareas(supabaseUrl, headers, sanitized, perEntityLimit),
			searchPedidos(supabaseUrl, headers, sanitized, perEntityLimit),
			searchClientes(supabaseUrl, headers, sanitized, perEntityLimit),
		]);

		const result: SearchResult = {
			productos: productosResult,
			proveedores: proveedoresResult,
			tareas: tareasResult,
			pedidos: pedidosResult,
			clientes: clientesResult,
		};

		logger.info('GLOBAL_SEARCH', {
			requestId,
			query: sanitized,
			counts: {
				productos: productosResult.length,
				proveedores: proveedoresResult.length,
				tareas: tareasResult.length,
				pedidos: pedidosResult.length,
				clientes: clientesResult.length,
			},
		});

		return ok(result, 200, responseHeaders, { requestId });
	} catch (error) {
		logger.error('GLOBAL_SEARCH_ERROR', { requestId, query, error });
		throw error;
	}
}

// ============================================================================
// ENTITY SEARCHES (private)
// ============================================================================

async function searchProductos(
	supabaseUrl: string,
	headers: ApiHeaders,
	query: string,
	limit: number
): Promise<unknown[]> {
	const params = new URLSearchParams();
	params.set('select', 'id,sku,nombre,marca,precio_actual,codigo_barras,activo');
	params.set('or', `(nombre.ilike.*${query}*,sku.ilike.*${query}*,marca.ilike.*${query}*,codigo_barras.ilike.*${query}*)`);
	params.set('activo', 'eq.true');
	params.set('order', 'nombre');
	params.set('limit', String(limit));

	const { data } = await fetchWithParams(supabaseUrl, 'productos', params, headers);
	return data;
}

async function searchProveedores(
	supabaseUrl: string,
	headers: ApiHeaders,
	query: string,
	limit: number
): Promise<unknown[]> {
	const params = new URLSearchParams();
	params.set('select', 'id,nombre,contacto,email,telefono');
	params.set('or', `(nombre.ilike.*${query}*,contacto.ilike.*${query}*,email.ilike.*${query}*)`);
	params.set('activo', 'eq.true');
	params.set('order', 'nombre');
	params.set('limit', String(limit));

	const { data } = await fetchWithParams(supabaseUrl, 'proveedores', params, headers);
	return data;
}

async function searchTareas(
	supabaseUrl: string,
	headers: ApiHeaders,
	query: string,
	limit: number
): Promise<unknown[]> {
	const params = new URLSearchParams();
	params.set('select', 'id,titulo,estado,prioridad,asignada_a_nombre,fecha_vencimiento');
	params.set('or', `(titulo.ilike.*${query}*,descripcion.ilike.*${query}*)`);
	params.set('estado', 'eq.pendiente');
	params.set('order', 'created_at.desc');
	params.set('limit', String(limit));

	const { data } = await fetchWithParams(supabaseUrl, 'tareas_pendientes', params, headers);
	return data;
}

async function searchPedidos(
	supabaseUrl: string,
	headers: ApiHeaders,
	query: string,
	limit: number
): Promise<unknown[]> {
	const params = new URLSearchParams();
	params.set('select', 'id,numero_pedido,cliente_nombre,cliente_telefono,estado,estado_pago,monto_total,fecha_pedido');

	// If query looks like a number, also search by numero_pedido
	const isNumeric = /^\d+$/.test(query);
	if (isNumeric) {
		params.set('or', `(cliente_nombre.ilike.*${query}*,numero_pedido.eq.${query})`);
	} else {
		params.set('or', `(cliente_nombre.ilike.*${query}*,cliente_telefono.ilike.*${query}*)`);
	}

	params.set('order', 'fecha_pedido.desc');
	params.set('limit', String(limit));

	const { data } = await fetchWithParams(supabaseUrl, 'pedidos', params, headers);
	return data;
}

async function searchClientes(
	supabaseUrl: string,
	headers: ApiHeaders,
	query: string,
	limit: number
): Promise<unknown[]> {
	const params = new URLSearchParams();
	params.set('select', 'id,nombre,telefono,email,direccion_default');
	params.set('or', `(nombre.ilike.*${query}*,telefono.ilike.*${query}*,email.ilike.*${query}*)`);
	params.set('activo', 'eq.true');
	params.set('order', 'nombre');
	params.set('limit', String(limit));

	const { data } = await fetchWithParams(supabaseUrl, 'clientes', params, headers);
	return data;
}

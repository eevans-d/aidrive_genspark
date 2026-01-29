/**
 * Router de Depósito - api-minimarket
 * Handlers para movimientos de depósito
 * @module api-minimarket/routers/deposito
 */

import { queryTable, insertTable, fetchWithParams } from '../helpers/supabase.ts';
import { isUuid, parsePositiveNumber, sanitizeTextParam, isValidMovimientoTipo, VALID_MOVIMIENTO_TIPOS } from '../helpers/validation.ts';
import { parsePagination } from '../helpers/pagination.ts';
import type { RouteHandler } from './types.ts';

// POST /deposito/movimiento
export const createMovimientoHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, parseJsonBody, user, logAudit } = ctx;
        checkRole(['admin', 'deposito']);

        const bodyResult = await parseJsonBody();
        if (bodyResult instanceof Response) return bodyResult;

        const body = bodyResult as Record<string, unknown>;
        const { producto_id, tipo, cantidad, observaciones, proveedor_id, destino } = body;

        // Validaciones
        if (!producto_id || !isUuid(String(producto_id))) {
                return respondFail('VALIDATION_ERROR', 'producto_id es requerido y debe ser UUID válido', 400);
        }

        if (!tipo || !isValidMovimientoTipo(String(tipo))) {
                return respondFail('VALIDATION_ERROR', `tipo debe ser uno de: ${VALID_MOVIMIENTO_TIPOS.join(', ')}`, 400);
        }

        const cantidadNum = parsePositiveNumber(cantidad);
        if (cantidadNum === null) {
                return respondFail('VALIDATION_ERROR', 'cantidad debe ser un número positivo', 400);
        }

        const movimiento: Record<string, unknown> = {
                producto_id: String(producto_id),
                tipo: String(tipo),
                cantidad: cantidadNum,
                usuario_id: user!.id,
                fecha: new Date().toISOString(),
        };

        if (observaciones) {
                const sanitized = sanitizeTextParam(String(observaciones));
                if (sanitized) movimiento.observaciones = sanitized;
        }

        if (proveedor_id && isUuid(String(proveedor_id))) {
                movimiento.proveedor_id = String(proveedor_id);
        }

        if (destino) {
                const sanitized = sanitizeTextParam(String(destino));
                if (sanitized) movimiento.destino = sanitized;
        }

        const result = await insertTable(supabaseUrl, 'movimientos_deposito', requestHeaders(), movimiento);
        const movimientoCreado = (result as unknown[])[0] as Record<string, unknown>;

        await logAudit(
                'movimiento_deposito_creado',
                'movimientos_deposito',
                String(movimientoCreado.id),
                { producto_id: movimiento.producto_id, tipo: movimiento.tipo, cantidad: movimiento.cantidad },
                'info'
        );

        return respondOk(movimientoCreado, 201, { message: 'Movimiento registrado exitosamente' });
};

// GET /deposito/movimientos
export const getMovimientosHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, url } = ctx;
        checkRole(['admin', 'deposito']);

        const paginationResult = parsePagination(
                url.searchParams.get('limit'),
                url.searchParams.get('offset'),
                50,
                200
        );

        if (!paginationResult.ok) {
                return respondFail('VALIDATION_ERROR', paginationResult.error.message, 400);
        }
        const { limit, offset } = paginationResult.params;

        const params = new URLSearchParams();
        params.set('select', 'id,producto_id,tipo,cantidad,fecha,observaciones,usuario_id,productos(nombre,sku)');
        params.set('order', 'fecha.desc');
        params.set('limit', String(limit));
        params.set('offset', String(offset));

        const productoId = url.searchParams.get('producto_id');
        if (productoId && isUuid(productoId)) {
                params.append('producto_id', `eq.${productoId}`);
        }

        const tipo = url.searchParams.get('tipo');
        if (tipo && isValidMovimientoTipo(tipo)) {
                params.append('tipo', `eq.${tipo}`);
        }

        const { data, count } = await fetchWithParams(
                supabaseUrl,
                'movimientos_deposito',
                params,
                requestHeaders()
        );

        return respondOk(data, 200, { extra: { count: count ?? data.length } });
};

// POST /deposito/ingreso
export const createIngresoHandler: RouteHandler = async (ctx) => {
        const { supabaseUrl, requestHeaders, respondOk, respondFail, checkRole, parseJsonBody, user, logAudit } = ctx;
        checkRole(['admin', 'deposito']);

        const bodyResult = await parseJsonBody();
        if (bodyResult instanceof Response) return bodyResult;

        const body = bodyResult as Record<string, unknown>;
        const { producto_id, cantidad, proveedor_id, observaciones } = body;

        if (!producto_id || !isUuid(String(producto_id))) {
                return respondFail('VALIDATION_ERROR', 'producto_id es requerido', 400);
        }

        const cantidadNum = parsePositiveNumber(cantidad);
        if (cantidadNum === null) {
                return respondFail('VALIDATION_ERROR', 'cantidad debe ser positiva', 400);
        }

        const ingreso: Record<string, unknown> = {
                producto_id: String(producto_id),
                tipo: 'entrada',
                cantidad: cantidadNum,
                usuario_id: user!.id,
                fecha: new Date().toISOString(),
        };

        if (proveedor_id && isUuid(String(proveedor_id))) {
                ingreso.proveedor_id = String(proveedor_id);
        }

        if (observaciones) {
                ingreso.observaciones = sanitizeTextParam(String(observaciones)) || '';
        }

        const result = await insertTable(supabaseUrl, 'movimientos_deposito', requestHeaders(), ingreso);
        const ingresoCreado = (result as unknown[])[0] as Record<string, unknown>;

        await logAudit(
                'ingreso_deposito',
                'movimientos_deposito',
                String(ingresoCreado.id),
                { producto_id: ingreso.producto_id, cantidad: ingreso.cantidad },
                'info'
        );

        return respondOk(ingresoCreado, 201, { message: 'Ingreso registrado exitosamente' });
};

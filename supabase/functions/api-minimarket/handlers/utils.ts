
import { queryTable } from '../helpers/supabase.ts';
import { ok } from '../../_shared/response.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('api-minimarket-utils');

export const getProductosDropdown = async (
        supabaseUrl: string,
        requestHeaders: Record<string, string>,
        originHeaders: Record<string, string>,
        requestId: string
) => {
        const productos = await queryTable(
                supabaseUrl,
                'productos',
                requestHeaders,
                { activo: true },
                'id,nombre',
                { order: 'nombre' }
        );

        return ok(productos, 200, originHeaders, { requestId });
};

export const getProveedoresDropdown = async (
        supabaseUrl: string,
        requestHeaders: Record<string, string>,
        originHeaders: Record<string, string>,
        requestId: string
) => {
        const proveedores = await queryTable(
                supabaseUrl,
                'proveedores',
                requestHeaders,
                { activo: true },
                'id,nombre',
                { order: 'nombre' }
        );

        return ok(proveedores, 200, originHeaders, { requestId });
};

/**
 * Auth helper para API proveedor (shared secret validation)
 */

import { fail } from '../../_shared/response.ts';

export function validateApiSecret(request: Request): { valid: boolean; error?: string } {
    const apiSecret = Deno.env.get('API_PROVEEDOR_SECRET');
    
    if (!apiSecret) {
        return { valid: false, error: 'API_PROVEEDOR_SECRET no configurado en servidor' };
    }

    const providedSecret = request.headers.get('x-api-secret');
    
    if (!providedSecret) {
        return { valid: false, error: 'Header x-api-secret requerido' };
    }

    if (providedSecret !== apiSecret) {
        return { valid: false, error: 'x-api-secret invalido' };
    }

    return { valid: true };
}

export function createAuthErrorResponse(error: string, corsHeaders: Record<string, string>, requestId: string): Response {
    return fail('AUTH_FAILED', error, 401, corsHeaders, { requestId });
}

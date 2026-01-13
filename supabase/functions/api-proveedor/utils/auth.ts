/**
 * Auth helper para API proveedor (shared secret validation)
 */

import { fail } from '../../_shared/response.ts';

export type ReadAuthMode = 'anon' | 'service';
export type SupabaseReadAuth = {
    headers: Record<string, string>;
    mode: 'jwt' | 'anon' | 'service';
};

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

export function parseReadAuthMode(value: string | null): ReadAuthMode {
    const normalized = value?.trim().toLowerCase();
    return normalized === 'service' ? 'service' : 'anon';
}

export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader) return null;
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
        return trimmed.slice(7).trim() || null;
    }
    return null;
}

export function buildSupabaseReadHeaders(options: {
    anonKey: string;
    serviceRoleKey: string;
    authHeader: string | null;
    readMode: ReadAuthMode;
}): SupabaseReadAuth {
    const token = extractBearerToken(options.authHeader);
    if (token) {
        return {
            mode: 'jwt',
            headers: {
                apikey: options.anonKey,
                Authorization: `Bearer ${token}`
            }
        };
    }

    if (options.readMode === 'service') {
        return {
            mode: 'service',
            headers: {
                apikey: options.serviceRoleKey,
                Authorization: `Bearer ${options.serviceRoleKey}`
            }
        };
    }

    return {
        mode: 'anon',
        headers: {
            apikey: options.anonKey,
            Authorization: `Bearer ${options.anonKey}`
        }
    };
}

export function createAuthErrorResponse(error: string, corsHeaders: Record<string, string>, requestId: string): Response {
    return fail('AUTH_FAILED', error, 401, corsHeaders, { requestId });
}

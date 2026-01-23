/**
 * Auth helper para API proveedor (shared secret validation)
 * 
 * NOTA: Esta API es interna (server-to-server). La autenticación por shared secret
 * es un patrón temporal. Ver D-010 en DECISION_LOG para hardening futuro.
 * 
 * Flujo de autenticación:
 * 1. Validar que existe API_PROVEEDOR_SECRET en env
 * 2. Validar que request incluye header x-api-secret
 * 3. Comparar de forma segura (timing-safe) ambos valores
 * 4. Opcionalmente, validar origen de la request
 */

import { fail } from '../../_shared/response.ts';

export type ReadAuthMode = 'anon' | 'service';
export type SupabaseReadAuth = {
    headers: Record<string, string>;
    mode: 'jwt' | 'anon' | 'service';
};

/**
 * Comparación timing-safe de strings para evitar timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        // Hacer trabajo extra para mantener tiempo constante
        let dummy = 0;
        for (let i = 0; i < a.length; i++) {
            dummy |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
        }
        return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

/**
 * Valida el shared secret de la request
 */
export function validateApiSecret(request: Request): { valid: boolean; error?: string } {
    const apiSecret = Deno.env.get('API_PROVEEDOR_SECRET');
    
    if (!apiSecret) {
        return { valid: false, error: 'API_PROVEEDOR_SECRET no configurado en servidor' };
    }

    // Validar longitud mínima del secret configurado
    if (apiSecret.length < 32) {
        return { valid: false, error: 'API_PROVEEDOR_SECRET debe tener al menos 32 caracteres' };
    }

    const providedSecret = request.headers.get('x-api-secret');
    
    if (!providedSecret) {
        return { valid: false, error: 'Header x-api-secret requerido' };
    }

    // Comparación timing-safe
    if (!timingSafeEqual(providedSecret, apiSecret)) {
        return { valid: false, error: 'x-api-secret invalido' };
    }

    return { valid: true };
}

/**
 * Valida que el origen sea interno (gateway o cron jobs)
 * TODO: Implementar lista blanca de orígenes internos
 */
export function validateInternalOrigin(request: Request): { valid: boolean; warning?: string } {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const userAgent = request.headers.get('user-agent');
    
    // Server-to-server: no debería tener Origin (browsers lo envían)
    if (origin) {
        // Si tiene origin, es probablemente un browser → sospechoso para API interna
        return { 
            valid: true, // Permitir pero advertir
            warning: `Request con Origin header: ${origin}. API proveedor es interna.`
        };
    }
    
    // Verificar User-Agent esperado (Deno runtime)
    if (userAgent && !userAgent.includes('Deno')) {
        return {
            valid: true,
            warning: `User-Agent inesperado: ${userAgent}`
        };
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

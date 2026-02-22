/**
 * Auth helper para API proveedor (shared secret validation)
 *
 * NOTA: Esta API es interna (server-to-server). La autenticación por shared secret
 * es el esquema definitivo (D-010, cerrada D-153). Controles:
 * - Comparación timing-safe para evitar timing attacks
 * - Longitud mínima de secret: 32 caracteres
 * - Origin allowlist configurable via INTERNAL_ORIGINS_ALLOWLIST
 * - Server-to-server (sin Origin) permitido
 * - Plan de rotación documentado en docs/SECRET_ROTATION_PLAN.md
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
 * Default internal origins allowed for server-to-server calls.
 * Can be extended via INTERNAL_ORIGINS_ALLOWLIST env var (comma-separated).
 */
const DEFAULT_INTERNAL_ORIGINS: readonly string[] = [
    'http://localhost',
    'http://127.0.0.1',
    'http://host.docker.internal',
];

function getInternalAllowlist(): string[] {
    const envList = Deno.env.get('INTERNAL_ORIGINS_ALLOWLIST');
    const extra = envList
        ? envList.split(',').map(o => o.trim().replace(/\/+$/, '')).filter(Boolean)
        : [];
    return [...DEFAULT_INTERNAL_ORIGINS, ...extra];
}

function originMatchesAllowlist(origin: string, allowlist: string[]): boolean {
    const normalized = origin.replace(/\/+$/, '');
    return allowlist.some(allowed => normalized === allowed || normalized.startsWith(allowed + ':'));
}

/**
 * Valida que el origen sea interno (gateway o cron jobs).
 * Server-to-server calls (no Origin header) are always allowed.
 * Browser-originated calls (with Origin header) must match the allowlist.
 */
export function validateInternalOrigin(request: Request): { valid: boolean; warning?: string } {
    const origin = request.headers.get('origin');

    // Server-to-server: no Origin header = allowed (Deno runtime, cron, gateway)
    if (!origin) {
        return { valid: true };
    }

    // Has Origin header → must be in allowlist
    const allowlist = getInternalAllowlist();
    if (originMatchesAllowlist(origin, allowlist)) {
        return { valid: true };
    }

    // Origin present but not in allowlist → block
    return {
        valid: false,
        warning: `Origin '${origin}' not in internal allowlist. API proveedor is internal-only.`,
    };
}

export function parseReadAuthMode(value: string | null | undefined): ReadAuthMode {
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

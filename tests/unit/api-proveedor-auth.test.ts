/**
 * Unit tests for api-proveedor auth helpers (read mode selection).
 */

import { describe, it, expect } from 'vitest';
import {
    buildSupabaseReadHeaders,
    extractBearerToken,
    parseReadAuthMode
} from '../../supabase/functions/api-proveedor/utils/auth.ts';

describe('auth helpers', () => {
    it('parseReadAuthMode defaults to anon', () => {
        expect(parseReadAuthMode(null)).toBe('anon');
        expect(parseReadAuthMode('')).toBe('anon');
        expect(parseReadAuthMode('unknown')).toBe('anon');
    });

    it('parseReadAuthMode accepts service', () => {
        expect(parseReadAuthMode('service')).toBe('service');
        expect(parseReadAuthMode('SERVICE')).toBe('service');
    });

    it('extractBearerToken handles bearer tokens', () => {
        expect(extractBearerToken(null)).toBeNull();
        expect(extractBearerToken('Bearer abc')).toBe('abc');
        expect(extractBearerToken('bearer   token-123')).toBe('token-123');
        expect(extractBearerToken('Basic abc')).toBeNull();
    });

    it('buildSupabaseReadHeaders prefers JWT when provided', () => {
        const result = buildSupabaseReadHeaders({
            anonKey: 'anon',
            serviceRoleKey: 'service',
            authHeader: 'Bearer user-token',
            readMode: 'service'
        });

        expect(result.mode).toBe('jwt');
        expect(result.headers.apikey).toBe('anon');
        expect(result.headers.Authorization).toBe('Bearer user-token');
    });

    it('buildSupabaseReadHeaders uses service role when configured', () => {
        const result = buildSupabaseReadHeaders({
            anonKey: 'anon',
            serviceRoleKey: 'service',
            authHeader: null,
            readMode: 'service'
        });

        expect(result.mode).toBe('service');
        expect(result.headers.apikey).toBe('service');
        expect(result.headers.Authorization).toBe('Bearer service');
    });

    it('buildSupabaseReadHeaders uses anon by default', () => {
        const result = buildSupabaseReadHeaders({
            anonKey: 'anon',
            serviceRoleKey: 'service',
            authHeader: null,
            readMode: 'anon'
        });

        expect(result.mode).toBe('anon');
        expect(result.headers.apikey).toBe('anon');
        expect(result.headers.Authorization).toBe('Bearer anon');
    });
});

describe('validateInternalOrigin', () => {
    // Tests básicos sin necesidad de mock de Deno.env
    it('validateInternalOrigin function exists and is exported', async () => {
        const { validateInternalOrigin } = await import(
            '../../supabase/functions/api-proveedor/utils/auth.ts'
        );
        expect(typeof validateInternalOrigin).toBe('function');
    });
});

describe('timing-safe comparison', () => {
    // Test que verifica que el validateApiSecret usa comparación timing-safe
    // Sin mock de Deno.env, solo verificamos que la función existe
    it('validateApiSecret function exists and is exported', async () => {
        const { validateApiSecret } = await import(
            '../../supabase/functions/api-proveedor/utils/auth.ts'
        );
        expect(typeof validateApiSecret).toBe('function');
    });
});

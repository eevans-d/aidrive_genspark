/**
 * Unit tests for api-proveedor auth helpers (read mode selection).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Deno global for non-Deno environments
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => undefined } };
}

import {
    buildSupabaseReadHeaders,
    extractBearerToken,
    parseReadAuthMode,
    validateInternalOrigin,
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

describe('validateInternalOrigin (A5 allowlist)', () => {
    let origEnvGet: (key: string) => string | undefined;

    function makeRequest(origin?: string): Request {
        const headers = new Headers();
        if (origin) headers.set('origin', origin);
        return new Request('https://example.com/test', { headers });
    }

    beforeEach(() => {
        origEnvGet = (globalThis as any).Deno.env.get;
        // Default: no INTERNAL_ORIGINS_ALLOWLIST set
        (globalThis as any).Deno.env.get = (key: string) => {
            if (key === 'INTERNAL_ORIGINS_ALLOWLIST') return undefined;
            return origEnvGet(key);
        };
    });

    afterEach(() => {
        (globalThis as any).Deno.env.get = origEnvGet;
    });

    it('allows requests without Origin header (server-to-server)', () => {
        const r = validateInternalOrigin(makeRequest());
        expect(r.valid).toBe(true);
        expect(r.warning).toBeUndefined();
    });

    it('allows localhost origin', () => {
        const r = validateInternalOrigin(makeRequest('http://localhost'));
        expect(r.valid).toBe(true);
    });

    it('allows localhost with port', () => {
        const r = validateInternalOrigin(makeRequest('http://localhost:3000'));
        expect(r.valid).toBe(true);
    });

    it('allows 127.0.0.1 origin', () => {
        const r = validateInternalOrigin(makeRequest('http://127.0.0.1'));
        expect(r.valid).toBe(true);
    });

    it('allows 127.0.0.1 with port', () => {
        const r = validateInternalOrigin(makeRequest('http://127.0.0.1:8080'));
        expect(r.valid).toBe(true);
    });

    it('allows host.docker.internal', () => {
        const r = validateInternalOrigin(makeRequest('http://host.docker.internal'));
        expect(r.valid).toBe(true);
    });

    it('blocks unknown external origin', () => {
        const r = validateInternalOrigin(makeRequest('https://evil-site.com'));
        expect(r.valid).toBe(false);
        expect(r.warning).toContain('evil-site.com');
        expect(r.warning).toContain('not in internal allowlist');
    });

    it('blocks arbitrary HTTPS origin', () => {
        const r = validateInternalOrigin(makeRequest('https://attacker.io'));
        expect(r.valid).toBe(false);
    });

    it('handles trailing slash in origin', () => {
        const r = validateInternalOrigin(makeRequest('http://localhost/'));
        expect(r.valid).toBe(true);
    });

    it('respects INTERNAL_ORIGINS_ALLOWLIST env var', () => {
        (globalThis as any).Deno.env.get = (key: string) => {
            if (key === 'INTERNAL_ORIGINS_ALLOWLIST') return 'https://my-gateway.internal,https://cron-runner.internal';
            return origEnvGet(key);
        };

        const r1 = validateInternalOrigin(makeRequest('https://my-gateway.internal'));
        expect(r1.valid).toBe(true);

        const r2 = validateInternalOrigin(makeRequest('https://cron-runner.internal'));
        expect(r2.valid).toBe(true);

        const r3 = validateInternalOrigin(makeRequest('https://not-allowed.com'));
        expect(r3.valid).toBe(false);
    });
});

describe('timing-safe comparison', () => {
    it('validateApiSecret function exists and is exported', async () => {
        const { validateApiSecret } = await import(
            '../../supabase/functions/api-proveedor/utils/auth.ts'
        );
        expect(typeof validateApiSecret).toBe('function');
    });
});

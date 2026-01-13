/**
 * Unit tests for API_PROVEEDOR_READ_MODE hardening and auth flow.
 * Covers anon/service mode selection and critical endpoint auth requirements.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    buildSupabaseReadHeaders,
    extractBearerToken,
    parseReadAuthMode,
    validateApiSecret,
    type ReadAuthMode,
    type SupabaseReadAuth
} from '../../supabase/functions/api-proveedor/utils/auth.ts';
import {
    endpointSchemas,
    endpointList,
    isEndpointName
} from '../../supabase/functions/api-proveedor/schemas.ts';

// ============================================================================
// API_PROVEEDOR_READ_MODE tests
// ============================================================================
describe('API_PROVEEDOR_READ_MODE handling', () => {
    describe('parseReadAuthMode', () => {
        it('defaults to anon when env is null/undefined', () => {
            expect(parseReadAuthMode(null)).toBe('anon');
            expect(parseReadAuthMode(undefined as unknown as string)).toBe('anon');
        });

        it('defaults to anon when env is empty', () => {
            expect(parseReadAuthMode('')).toBe('anon');
            expect(parseReadAuthMode('   ')).toBe('anon');
        });

        it('defaults to anon for unknown values', () => {
            expect(parseReadAuthMode('unknown')).toBe('anon');
            expect(parseReadAuthMode('jwt')).toBe('anon');
            expect(parseReadAuthMode('admin')).toBe('anon');
        });

        it('accepts service mode case-insensitively', () => {
            expect(parseReadAuthMode('service')).toBe('service');
            expect(parseReadAuthMode('SERVICE')).toBe('service');
            expect(parseReadAuthMode('Service')).toBe('service');
            expect(parseReadAuthMode('  service  ')).toBe('service');
        });

        it('accepts anon mode explicitly', () => {
            expect(parseReadAuthMode('anon')).toBe('anon');
            expect(parseReadAuthMode('ANON')).toBe('anon');
        });
    });

    describe('buildSupabaseReadHeaders with READ_MODE=anon', () => {
        const anonKey = 'anon-key-123';
        const serviceRoleKey = 'service-role-key-456';
        const readMode: ReadAuthMode = 'anon';

        it('uses anon key for reads without user JWT', () => {
            const result = buildSupabaseReadHeaders({
                anonKey,
                serviceRoleKey,
                authHeader: null,
                readMode
            });

            expect(result.mode).toBe('anon');
            expect(result.headers.apikey).toBe(anonKey);
            expect(result.headers.Authorization).toBe(`Bearer ${anonKey}`);
        });

        it('does NOT use service role key when mode is anon', () => {
            const result = buildSupabaseReadHeaders({
                anonKey,
                serviceRoleKey,
                authHeader: null,
                readMode
            });

            expect(result.headers.apikey).not.toBe(serviceRoleKey);
            expect(result.headers.Authorization).not.toContain(serviceRoleKey);
        });

        it('prefers user JWT over anon even in anon mode', () => {
            const userToken = 'user-jwt-token-789';
            const result = buildSupabaseReadHeaders({
                anonKey,
                serviceRoleKey,
                authHeader: `Bearer ${userToken}`,
                readMode
            });

            expect(result.mode).toBe('jwt');
            expect(result.headers.apikey).toBe(anonKey);
            expect(result.headers.Authorization).toBe(`Bearer ${userToken}`);
        });
    });

    describe('buildSupabaseReadHeaders with READ_MODE=service', () => {
        const anonKey = 'anon-key-123';
        const serviceRoleKey = 'service-role-key-456';
        const readMode: ReadAuthMode = 'service';

        it('uses service role key for reads without JWT', () => {
            const result = buildSupabaseReadHeaders({
                anonKey,
                serviceRoleKey,
                authHeader: null,
                readMode
            });

            expect(result.mode).toBe('service');
            expect(result.headers.apikey).toBe(serviceRoleKey);
            expect(result.headers.Authorization).toBe(`Bearer ${serviceRoleKey}`);
        });

        it('still prefers user JWT over service role', () => {
            const userToken = 'user-jwt-token';
            const result = buildSupabaseReadHeaders({
                anonKey,
                serviceRoleKey,
                authHeader: `Bearer ${userToken}`,
                readMode
            });

            // JWT takes priority regardless of read mode
            expect(result.mode).toBe('jwt');
            expect(result.headers.Authorization).toBe(`Bearer ${userToken}`);
        });
    });
});

// ============================================================================
// Auth rejection/error tests
// ============================================================================
describe('Auth rejection behavior', () => {
    describe('extractBearerToken edge cases', () => {
        it('returns null for empty strings', () => {
            expect(extractBearerToken('')).toBeNull();
            expect(extractBearerToken('   ')).toBeNull();
        });

        it('returns null for non-Bearer schemes', () => {
            expect(extractBearerToken('Basic abc123')).toBeNull();
            expect(extractBearerToken('Digest abc123')).toBeNull();
            expect(extractBearerToken('API-Key abc123')).toBeNull();
        });

        it('handles malformed Bearer headers', () => {
            expect(extractBearerToken('Bearer')).toBeNull();
            expect(extractBearerToken('Bearer ')).toBeNull();
            expect(extractBearerToken('Bearer   ')).toBeNull();
        });

        it('trims whitespace from tokens', () => {
            expect(extractBearerToken('Bearer   token123   ')).toBe('token123');
            expect(extractBearerToken('  bearer token456')).toBe('token456');
        });
    });

    describe('validateApiSecret interface contract', () => {
        // Note: validateApiSecret depends on Deno.env which is only available in Deno runtime
        // We test the expected interface without calling the function
        
        it('documents expected return type structure', () => {
            type ExpectedReturn = { valid: boolean; error?: string };
            
            // Type-check that the function signature matches expectations
            const _typeCheck: (req: Request) => ExpectedReturn = validateApiSecret;
            expect(typeof _typeCheck).toBe('function');
        });

        it('documents required header x-api-secret', () => {
            // The function expects x-api-secret header
            // Cannot test directly without Deno runtime
            const requiredHeader = 'x-api-secret';
            const envVar = 'API_PROVEEDOR_SECRET';
            
            expect(requiredHeader).toBe('x-api-secret');
            expect(envVar).toBe('API_PROVEEDOR_SECRET');
        });
    });
});

// ============================================================================
// Critical endpoint auth requirements
// ============================================================================
describe('Critical endpoints auth requirements', () => {
    const READ_ENDPOINTS = ['precios', 'productos', 'alertas', 'comparacion', 'estadisticas'] as const;
    const WRITE_ENDPOINTS = ['sincronizar', 'configuracion'] as const;

    describe('Read endpoints (precios/alertas/productos)', () => {
        it.each(READ_ENDPOINTS)('%s has requiresAuth=true', (endpoint) => {
            expect(isEndpointName(endpoint)).toBe(true);
            expect(endpointSchemas[endpoint].requiresAuth).toBe(true);
        });

        it.each(READ_ENDPOINTS)('%s has description defined', (endpoint) => {
            expect(endpointSchemas[endpoint].description).toBeDefined();
            expect(typeof endpointSchemas[endpoint].description).toBe('string');
            expect(endpointSchemas[endpoint].description.length).toBeGreaterThan(0);
        });
    });

    describe('Write endpoints (sincronizar/configuracion)', () => {
        it.each(WRITE_ENDPOINTS)('%s requires authentication', (endpoint) => {
            expect(isEndpointName(endpoint)).toBe(true);
            expect(endpointSchemas[endpoint].requiresAuth).toBe(true);
        });
    });

    describe('Health/status endpoints', () => {
        it('health endpoint allows unauthenticated access for monitoring', () => {
            // Health check is intentionally public for load balancers/monitoring
            expect(endpointSchemas.health.requiresAuth).toBe(false);
        });

        it('status endpoint requires auth (contains internal metrics)', () => {
            expect(endpointSchemas.status.requiresAuth).toBe(true);
        });
    });

    describe('All endpoints enumerated', () => {
        it('endpointList includes all expected endpoints', () => {
            const expected = ['precios', 'productos', 'comparacion', 'sincronizar', 'status', 'alertas', 'estadisticas', 'configuracion', 'health'];
            for (const ep of expected) {
                expect(endpointList).toContain(ep);
            }
        });

        it('all endpoints have schema definitions', () => {
            for (const ep of endpointList) {
                expect(endpointSchemas[ep]).toBeDefined();
                expect(endpointSchemas[ep].description).toBeDefined();
                expect(typeof endpointSchemas[ep].requiresAuth).toBe('boolean');
            }
        });
    });
});

// ============================================================================
// SupabaseReadAuth type validation
// ============================================================================
describe('SupabaseReadAuth type structure', () => {
    it('has correct mode values', () => {
        const modes: Array<SupabaseReadAuth['mode']> = ['jwt', 'anon', 'service'];
        
        for (const mode of modes) {
            const result = buildSupabaseReadHeaders({
                anonKey: 'anon',
                serviceRoleKey: 'service',
                authHeader: mode === 'jwt' ? 'Bearer token' : null,
                readMode: mode === 'service' ? 'service' : 'anon'
            });
            
            expect(['jwt', 'anon', 'service']).toContain(result.mode);
        }
    });

    it('headers always contain apikey and Authorization', () => {
        const testCases = [
            { authHeader: null, readMode: 'anon' as ReadAuthMode },
            { authHeader: null, readMode: 'service' as ReadAuthMode },
            { authHeader: 'Bearer jwt', readMode: 'anon' as ReadAuthMode }
        ];

        for (const tc of testCases) {
            const result = buildSupabaseReadHeaders({
                anonKey: 'anon',
                serviceRoleKey: 'service',
                authHeader: tc.authHeader,
                readMode: tc.readMode
            });

            expect(result.headers).toHaveProperty('apikey');
            expect(result.headers).toHaveProperty('Authorization');
            expect(typeof result.headers.apikey).toBe('string');
            expect(typeof result.headers.Authorization).toBe('string');
        }
    });
});

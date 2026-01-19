/**
 * Unit Tests for api-minimarket/helpers/auth.ts
 * 
 * Tests authentication and authorization utilities:
 * - extractBearerToken
 * - requireRole
 * - hasRole / hasAnyRole
 * - createRequestHeaders
 * 
 * Note: fetchUserInfo requires mocking fetch and is covered in integration tests.
 */

import { describe, it, expect } from 'vitest';
import {
        extractBearerToken,
        requireRole,
        hasRole,
        hasAnyRole,
        createRequestHeaders,
        BASE_ROLES,
        type UserInfo
} from '../../supabase/functions/api-minimarket/helpers/auth';

describe('BASE_ROLES', () => {
        it('should contain expected roles', () => {
                expect(BASE_ROLES).toContain('admin');
                expect(BASE_ROLES).toContain('deposito');
                expect(BASE_ROLES).toContain('ventas');
        });

        it('should have exactly 3 roles', () => {
                expect(BASE_ROLES.length).toBe(3);
        });
});

describe('extractBearerToken', () => {
        it('should extract token from valid Bearer header', () => {
                expect(extractBearerToken('Bearer abc123')).toBe('abc123');
                expect(extractBearerToken('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
        });

        it('should be case-insensitive for Bearer prefix', () => {
                expect(extractBearerToken('bearer abc123')).toBe('abc123');
                expect(extractBearerToken('BEARER abc123')).toBe('abc123');
                expect(extractBearerToken('BeArEr abc123')).toBe('abc123');
        });

        it('should handle extra whitespace', () => {
                expect(extractBearerToken('  Bearer abc123  ')).toBe('abc123');
                expect(extractBearerToken('Bearer   abc123')).toBe('abc123');
        });

        it('should return null for null header', () => {
                expect(extractBearerToken(null)).toBeNull();
        });

        it('should return null for non-Bearer headers', () => {
                expect(extractBearerToken('Basic abc123')).toBeNull();
                expect(extractBearerToken('abc123')).toBeNull();
                expect(extractBearerToken('')).toBeNull();
        });

        it('should return null for Bearer without token', () => {
                expect(extractBearerToken('Bearer ')).toBeNull();
                expect(extractBearerToken('Bearer')).toBeNull();
        });
});

describe('requireRole', () => {
        const adminUser: UserInfo = { id: '1', role: 'admin' };
        const depositoUser: UserInfo = { id: '2', role: 'deposito' };
        const ventasUser: UserInfo = { id: '3', role: 'ventas' };
        const noRoleUser: UserInfo = { id: '4', role: null };

        it('should not throw when user has allowed role', () => {
                expect(() => requireRole(adminUser, ['admin'])).not.toThrow();
                expect(() => requireRole(depositoUser, ['admin', 'deposito'])).not.toThrow();
                expect(() => requireRole(ventasUser, ['ventas', 'deposito', 'admin'])).not.toThrow();
        });

        it('should be case-insensitive for role matching', () => {
                expect(() => requireRole(adminUser, ['ADMIN'])).not.toThrow();
                expect(() => requireRole(depositoUser, ['Deposito'])).not.toThrow();
        });

        it('should throw for null user', () => {
                expect(() => requireRole(null, ['admin'])).toThrow();

                try {
                        requireRole(null, ['admin']);
                } catch (e: any) {
                        expect(e.code).toBe('UNAUTHORIZED');
                        expect(e.status).toBe(401);
                }
        });

        it('should throw when user lacks required role', () => {
                expect(() => requireRole(ventasUser, ['admin'])).toThrow();

                try {
                        requireRole(ventasUser, ['admin']);
                } catch (e: any) {
                        expect(e.code).toBe('FORBIDDEN');
                        expect(e.status).toBe(403);
                }
        });

        it('should throw for user with no role', () => {
                expect(() => requireRole(noRoleUser, ['admin'])).toThrow();
        });
});

describe('hasRole', () => {
        const adminUser: UserInfo = { id: '1', role: 'admin' };
        const noRoleUser: UserInfo = { id: '2', role: null };

        it('should return true when user has the role', () => {
                expect(hasRole(adminUser, 'admin')).toBe(true);
        });

        it('should be case-insensitive', () => {
                expect(hasRole(adminUser, 'ADMIN')).toBe(true);
                expect(hasRole(adminUser, 'Admin')).toBe(true);
        });

        it('should return false when user lacks the role', () => {
                expect(hasRole(adminUser, 'ventas')).toBe(false);
        });

        it('should return false for null user', () => {
                expect(hasRole(null, 'admin')).toBe(false);
        });

        it('should return false for user without role', () => {
                expect(hasRole(noRoleUser, 'admin')).toBe(false);
        });
});

describe('hasAnyRole', () => {
        const adminUser: UserInfo = { id: '1', role: 'admin' };
        const ventasUser: UserInfo = { id: '2', role: 'ventas' };
        const noRoleUser: UserInfo = { id: '3', role: null };

        it('should return true when user has one of the roles', () => {
                expect(hasAnyRole(adminUser, ['admin', 'deposito'])).toBe(true);
                expect(hasAnyRole(ventasUser, ['admin', 'ventas'])).toBe(true);
        });

        it('should be case-insensitive', () => {
                expect(hasAnyRole(adminUser, ['ADMIN', 'DEPOSITO'])).toBe(true);
        });

        it('should return false when user has none of the roles', () => {
                expect(hasAnyRole(ventasUser, ['admin', 'deposito'])).toBe(false);
        });

        it('should return false for null user', () => {
                expect(hasAnyRole(null, ['admin'])).toBe(false);
        });

        it('should return false for user without role', () => {
                expect(hasAnyRole(noRoleUser, ['admin', 'ventas'])).toBe(false);
        });

        it('should handle empty roles array', () => {
                expect(hasAnyRole(adminUser, [])).toBe(false);
        });
});

describe('createRequestHeaders', () => {
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon';
        const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.user';
        const requestId = 'req-123';

        it('should create headers with user token', () => {
                const headers = createRequestHeaders(userToken, anonKey, requestId);

                expect(headers.Authorization).toBe(`Bearer ${userToken}`);
                expect(headers.apikey).toBe(anonKey);
                expect(headers['Content-Type']).toBe('application/json');
                expect(headers['x-request-id']).toBe(requestId);
        });

        it('should use anon key when no token', () => {
                const headers = createRequestHeaders(null, anonKey, requestId);

                expect(headers.Authorization).toBe(`Bearer ${anonKey}`);
        });

        it('should merge extra headers', () => {
                const headers = createRequestHeaders(userToken, anonKey, requestId, {
                        'Prefer': 'return=representation',
                        'X-Custom': 'value'
                });

                expect(headers.Prefer).toBe('return=representation');
                expect(headers['X-Custom']).toBe('value');
                // Should still have base headers
                expect(headers.Authorization).toBeDefined();
                expect(headers.apikey).toBeDefined();
        });

        it('should allow overriding default headers', () => {
                const headers = createRequestHeaders(userToken, anonKey, requestId, {
                        'Content-Type': 'text/plain'
                });

                expect(headers['Content-Type']).toBe('text/plain');
        });
});

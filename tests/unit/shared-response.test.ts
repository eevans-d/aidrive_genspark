/**
 * Unit Tests for _shared/response.ts
 * 
 * Tests API response functions:
 * - ok() - success responses
 * - fail() - error responses with various signatures
 * - failWithDetails() - legacy signature
 */

import { describe, it, expect } from 'vitest';
import {
        ok,
        fail,
        failWithDetails
} from '../../supabase/functions/_shared/response';

describe('ok()', () => {
        describe('Basic Usage', () => {
                it('should create success response with data', async () => {
                        const response = ok({ id: 1, name: 'Test' });

                        expect(response.status).toBe(200);

                        const body = await response.json();
                        expect(body.success).toBe(true);
                        expect(body.data).toEqual({ id: 1, name: 'Test' });
                });

                it('should use custom status code', async () => {
                        const response = ok({ created: true }, 201);

                        expect(response.status).toBe(201);
                });

                it('should include Content-Type header', () => {
                        const response = ok({});

                        expect(response.headers.get('Content-Type')).toBe('application/json');
                });

                it('should merge custom headers', () => {
                        const response = ok({}, 200, { 'X-Custom': 'value' });

                        expect(response.headers.get('X-Custom')).toBe('value');
                });
        });

        describe('Options', () => {
                it('should include message when provided', async () => {
                        const response = ok({}, 200, {}, { message: 'Created successfully' });
                        const body = await response.json();

                        expect(body.message).toBe('Created successfully');
                });

                it('should include requestId when provided', async () => {
                        const response = ok({}, 200, {}, { requestId: 'req-123' });
                        const body = await response.json();

                        expect(body.requestId).toBe('req-123');
                });

                it('should include extra fields', async () => {
                        const response = ok({}, 200, {}, { extra: { pagination: { page: 1 } } });
                        const body = await response.json();

                        expect(body.pagination).toEqual({ page: 1 });
                });

                it('should not allow extra to override core fields', async () => {
                        const response = ok({ real: 'data' }, 200, {}, {
                                extra: { success: false, data: 'override' }
                        });
                        const body = await response.json();

                        expect(body.success).toBe(true);
                        expect(body.data).toEqual({ real: 'data' });
                });
        });

        describe('Data Types', () => {
                it('should handle array data', async () => {
                        const response = ok([1, 2, 3]);
                        const body = await response.json();

                        expect(body.data).toEqual([1, 2, 3]);
                });

                it('should handle null data', async () => {
                        const response = ok(null);
                        const body = await response.json();

                        expect(body.data).toBeNull();
                });

                it('should handle string data', async () => {
                        const response = ok('simple string');
                        const body = await response.json();

                        expect(body.data).toBe('simple string');
                });

                it('should preserve JSON semantics when data is undefined', async () => {
                        const response = ok(undefined);
                        const body = await response.json();

                        expect(body.success).toBe(true);
                        expect('data' in body).toBe(false);
                });
        });

        describe('Edge Cases', () => {
                it('should throw for circular payloads in ok()', () => {
                        const circular: Record<string, unknown> = {};
                        circular.self = circular;

                        expect(() => ok(circular)).toThrow();
                });
        });
});

describe('fail()', () => {
        describe('Basic Usage', () => {
                it('should create error response', async () => {
                        const response = fail('ERROR_CODE', 'Error message');

                        expect(response.status).toBe(400);

                        const body = await response.json();
                        expect(body.success).toBe(false);
                        expect(body.error.code).toBe('ERROR_CODE');
                        expect(body.error.message).toBe('Error message');
                });

                it('should use custom status code', async () => {
                        const response = fail('NOT_FOUND', 'Resource not found', 404);

                        expect(response.status).toBe(404);
                });

                it('should include Content-Type header', () => {
                        const response = fail('ERROR', 'Message');

                        expect(response.headers.get('Content-Type')).toBe('application/json');
                });
        });

        describe('Signature variants', () => {
                it('should handle empty headers object', async () => {
                        const response = fail('ERROR', 'Message', 400, {});

                        expect(response.status).toBe(400);
                        expect(response.headers.get('Content-Type')).toBe('application/json');
                });

                it('should accept options as 5th argument', async () => {
                        const response = fail('ERROR', 'Message', 400, {}, {
                                details: { field: 'email' },
                                requestId: 'req-123'
                        });
                        const body = await response.json();

                        expect(body.error.details).toEqual({ field: 'email' });
                        expect(body.requestId).toBe('req-123');
                });
        });

        describe('Legacy Signature (details, headers)', () => {
                it('should accept details as 4th argument when not headers-like', async () => {
                        const details = { field: 'email', values: [1, 2, 3] }; // Not headers-like (has non-string values)
                        const headers = { 'X-Custom': 'val' };
                        const response = fail('VALIDATION', 'Invalid input', 400, details, headers);
                        const body = await response.json();

                        expect(body.error.details).toEqual(details);
                        expect(response.headers.get('X-Custom')).toBe('val');
                });
        });

        describe('Options', () => {
                it('should include message when provided', async () => {
                        const response = fail('ERROR', 'Error', 400, {}, { message: 'User message' });
                        const body = await response.json();

                        expect(body.message).toBe('User message');
                });

                it('should include extra fields', async () => {
                        const response = fail('ERROR', 'Error', 400, {}, {
                                extra: { retryAfter: 60 }
                        });
                        const body = await response.json();

                        expect(body.retryAfter).toBe(60);
                });

                it('should throw for circular details in fail()', () => {
                        const circular: Record<string, unknown> = {};
                        circular.self = circular;

                        expect(() => fail('ERROR', 'Error', 400, circular)).toThrow();
                });
        });

        describe('Error Codes', () => {
                it('should handle various common error codes', async () => {
                        const codes = [
                                ['VALIDATION_ERROR', 400],
                                ['UNAUTHORIZED', 401],
                                ['FORBIDDEN', 403],
                                ['NOT_FOUND', 404],
                                ['INTERNAL_ERROR', 500]
                        ] as const;

                        for (const [code, status] of codes) {
                                const response = fail(code, 'Message', status);
                                const body = await response.json();

                                expect(response.status).toBe(status);
                                expect(body.error.code).toBe(code);
                        }
                });
        });
});

describe('failWithDetails() (deprecated)', () => {
        it('should work as legacy fail with details', async () => {
                const response = failWithDetails(
                        'VALIDATION_ERROR',
                        'Invalid input',
                        400,
                        { field: 'email', reason: 'invalid format' },
                        { 'X-Custom': 'value' }
                );

                expect(response.status).toBe(400);
                expect(response.headers.get('X-Custom')).toBe('value');

                const body = await response.json();
                expect(body.error.details).toEqual({
                        field: 'email',
                        reason: 'invalid format'
                });
        });

        it('should work with minimal arguments', async () => {
                const response = failWithDetails('ERROR', 'Message');
                const body = await response.json();

                expect(response.status).toBe(400);
                expect(body.error.code).toBe('ERROR');
        });
});

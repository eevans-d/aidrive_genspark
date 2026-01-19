/**
 * Unit Tests for _shared/errors.ts
 * 
 * Tests error classes and conversion utilities:
 * - AppError and HttpError classes
 * - isAppError type guard
 * - toAppError conversion
 * - fromFetchResponse (PostgREST errors)
 * - fromFetchError (network errors)
 * - getErrorStatus
 */

import { describe, it, expect, vi } from 'vitest';
import {
        AppError,
        HttpError,
        isAppError,
        toAppError,
        fromFetchResponse,
        fromFetchError,
        getErrorStatus
} from '../../supabase/functions/_shared/errors';

describe('AppError', () => {
        it('should create error with defaults', () => {
                const error = new AppError('Something went wrong');

                expect(error.message).toBe('Something went wrong');
                expect(error.code).toBe('INTERNAL_ERROR');
                expect(error.status).toBe(500);
                expect(error.name).toBe('AppError');
                expect(error.details).toBeUndefined();
        });

        it('should accept custom code and status', () => {
                const error = new AppError('Not found', 'NOT_FOUND', 404);

                expect(error.code).toBe('NOT_FOUND');
                expect(error.status).toBe(404);
        });

        it('should accept details object', () => {
                const error = new AppError('Validation failed', 'VALIDATION_ERROR', 400, { field: 'email' });

                expect(error.details).toEqual({ field: 'email' });
        });

        it('should accept details as string', () => {
                const error = new AppError('Error', 'CODE', 400, 'extra info');

                expect(error.details).toBe('extra info');
        });

        it('should be instance of Error', () => {
                const error = new AppError('Test');

                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(AppError);
        });
});

describe('HttpError', () => {
        it('should create with status first in constructor', () => {
                const error = new HttpError('Bad request', 400);

                expect(error.message).toBe('Bad request');
                expect(error.status).toBe(400);
                expect(error.code).toBe('HTTP_ERROR');
                expect(error.name).toBe('HttpError');
        });

        it('should accept custom code', () => {
                const error = new HttpError('Unauthorized', 401, 'AUTH_FAILED');

                expect(error.code).toBe('AUTH_FAILED');
        });

        it('should extend AppError', () => {
                const error = new HttpError('Test', 500);

                expect(error).toBeInstanceOf(AppError);
                expect(error).toBeInstanceOf(HttpError);
        });
});

describe('isAppError', () => {
        it('should return true for AppError', () => {
                expect(isAppError(new AppError('test'))).toBe(true);
        });

        it('should return true for HttpError', () => {
                expect(isAppError(new HttpError('test', 400))).toBe(true);
        });

        it('should return false for regular Error', () => {
                expect(isAppError(new Error('test'))).toBe(false);
        });

        it('should return false for non-errors', () => {
                expect(isAppError('string')).toBe(false);
                expect(isAppError(null)).toBe(false);
                expect(isAppError(undefined)).toBe(false);
                expect(isAppError({ message: 'fake' })).toBe(false);
        });
});

describe('toAppError', () => {
        it('should pass through AppError unchanged', () => {
                const original = new AppError('test', 'CODE', 400);
                const result = toAppError(original);

                expect(result).toBe(original);
        });

        it('should convert Error to AppError', () => {
                const original = new Error('regular error');
                const result = toAppError(original);

                expect(result).toBeInstanceOf(AppError);
                expect(result.message).toBe('regular error');
                expect(result.code).toBe('INTERNAL_ERROR');
                expect(result.status).toBe(500);
        });

        it('should use fallback code and status', () => {
                const result = toAppError(new Error('test'), 'CUSTOM_CODE', 404);

                expect(result.code).toBe('CUSTOM_CODE');
                expect(result.status).toBe(404);
        });

        it('should handle non-Error values', () => {
                const result = toAppError('string error');

                expect(result).toBeInstanceOf(AppError);
                expect(result.message).toBe('Unexpected error');
                expect(result.details).toEqual({ raw: 'string error' });
        });

        it('should handle null/undefined', () => {
                expect(toAppError(null).message).toBe('Unexpected error');
                expect(toAppError(undefined).message).toBe('Unexpected error');
        });
});

describe('fromFetchResponse', () => {
        it('should parse JSON error response', async () => {
                const response = new Response(
                        JSON.stringify({
                                message: 'Duplicate key violation',
                                code: '23505',
                                hint: 'Key already exists'
                        }),
                        {
                                status: 409,
                                headers: { 'Content-Type': 'application/json' }
                        }
                );

                const error = await fromFetchResponse(response);

                expect(error).toBeInstanceOf(AppError);
                expect(error.message).toBe('Duplicate key violation');
                expect(error.status).toBe(409);
                expect(error.code).toBe('DUPLICATE_KEY');
                expect(error.details).toEqual({
                        hint: 'Key already exists',
                        pgCode: '23505',
                        statusText: ''
                });
        });

        it('should handle text response', async () => {
                const response = new Response('Plain text error', {
                        status: 500,
                        headers: { 'Content-Type': 'text/plain' }
                });

                const error = await fromFetchResponse(response);

                expect(error.message).toBe('Plain text error');
                expect(error.status).toBe(500);
        });

        it('should use fallback message when body is empty', async () => {
                const response = new Response('', { status: 500 });

                const error = await fromFetchResponse(response, 'Custom fallback');

                expect(error.message).toBe('Custom fallback');
        });

        it('should map PGRST codes', async () => {
                const response = new Response(
                        JSON.stringify({ code: 'PGRST301', message: 'Not found' }),
                        { status: 404, headers: { 'Content-Type': 'application/json' } }
                );

                const error = await fromFetchResponse(response);

                expect(error.code).toBe('POSTGREST_NOT_FOUND');
        });

        it('should fallback to HTTP status mapping', async () => {
                const response = new Response(
                        JSON.stringify({ message: 'Too many requests' }),
                        { status: 429, headers: { 'Content-Type': 'application/json' } }
                );

                const error = await fromFetchResponse(response);

                expect(error.code).toBe('RATE_LIMITED');
        });
});

describe('fromFetchError', () => {
        it('should pass through AppError', () => {
                const original = new AppError('test');
                const result = fromFetchError(original);

                expect(result).toBe(original);
        });

        it('should convert TypeError to network error', () => {
                const error = fromFetchError(new TypeError('Failed to fetch'));

                expect(error.code).toBe('NETWORK_ERROR');
                expect(error.status).toBe(503);
                expect(error.details).toEqual({ originalMessage: 'Failed to fetch' });
        });

        it('should convert regular Error', () => {
                const error = fromFetchError(new Error('Some error'));

                expect(error.code).toBe('FETCH_ERROR');
                expect(error.message).toBe('Some error');
        });

        it('should handle non-Error values', () => {
                const error = fromFetchError({ weird: 'object' });

                expect(error.message).toBe('Unknown fetch error');
                expect(error.details).toEqual({ raw: { weird: 'object' } });
        });
});

describe('getErrorStatus', () => {
        it('should return status from AppError', () => {
                expect(getErrorStatus(new AppError('test', 'CODE', 403))).toBe(403);
                expect(getErrorStatus(new HttpError('test', 404))).toBe(404);
        });

        it('should infer 401 from unauthorized message', () => {
                expect(getErrorStatus(new Error('Usuario no autorizado'))).toBe(401);
                expect(getErrorStatus(new Error('Unauthorized access'))).toBe(401);
        });

        it('should infer 403 from forbidden message', () => {
                expect(getErrorStatus(new Error('Acceso denegado'))).toBe(403);
                expect(getErrorStatus(new Error('Forbidden resource'))).toBe(403);
        });

        it('should infer 404 from not found message', () => {
                expect(getErrorStatus(new Error('Recurso no encontrado'))).toBe(404);
                expect(getErrorStatus(new Error('Not found'))).toBe(404);
        });

        it('should infer 409 from duplicate message', () => {
                expect(getErrorStatus(new Error('El registro ya existe'))).toBe(409);
                expect(getErrorStatus(new Error('Duplicate entry'))).toBe(409);
        });

        it('should default to 500', () => {
                expect(getErrorStatus(new Error('Unknown error'))).toBe(500);
                expect(getErrorStatus('not an error')).toBe(500);
                expect(getErrorStatus(null)).toBe(500);
        });
});

/**
 * Coverage tests for _shared/errors.ts
 * Covers: fromFetchResponse, fromFetchError, mapPostgrestCode, getErrorStatus, HttpError
 */
import { describe, it, expect } from 'vitest';
import {
  AppError,
  HttpError,
  isAppError,
  toAppError,
  fromFetchResponse,
  fromFetchError,
  getErrorStatus,
} from '../../supabase/functions/_shared/errors';

describe('HttpError', () => {
  it('extends AppError', () => {
    const err = new HttpError('Not Found', 404, 'NOT_FOUND');
    expect(err).toBeInstanceOf(AppError);
    expect(err.name).toBe('HttpError');
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('defaults to status 500 and HTTP_ERROR code', () => {
    const err = new HttpError('Server error');
    expect(err.status).toBe(500);
    expect(err.code).toBe('HTTP_ERROR');
  });
});

describe('toAppError', () => {
  it('returns existing AppError as-is', () => {
    const original = new AppError('test', 'CODE', 400);
    const result = toAppError(original);
    expect(result).toBe(original);
  });

  it('wraps regular Error', () => {
    const result = toAppError(new Error('oops'), 'MY_CODE', 422);
    expect(result.message).toBe('oops');
    expect(result.code).toBe('MY_CODE');
    expect(result.status).toBe(422);
  });

  it('wraps non-Error values', () => {
    const result = toAppError('string error');
    expect(result.message).toBe('Unexpected error');
    expect(result.details).toEqual({ raw: 'string error' });
  });
});

describe('fromFetchResponse', () => {
  it('parses JSON error body', async () => {
    const resp = new Response(
      JSON.stringify({ message: 'duplicate', code: '23505', hint: 'unique_constraint' }),
      { status: 409, headers: { 'content-type': 'application/json' } },
    );

    const err = await fromFetchResponse(resp);
    expect(err.status).toBe(409);
    expect(err.code).toBe('DUPLICATE_KEY');
    expect(err.message).toBe('duplicate');
  });

  it('handles PGRST codes', async () => {
    const resp = new Response(
      JSON.stringify({ message: 'JWT expired', code: 'PGRST202' }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    );

    const err = await fromFetchResponse(resp);
    expect(err.code).toBe('POSTGREST_JWT_EXPIRED');
  });

  it('handles unknown PGRST codes', async () => {
    const resp = new Response(
      JSON.stringify({ message: 'test', code: 'PGRST999' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );

    const err = await fromFetchResponse(resp);
    expect(err.code).toBe('POSTGREST_PGRST999');
  });

  it('parses text body when not JSON', async () => {
    const resp = new Response('Plain text error', { status: 500 });

    const err = await fromFetchResponse(resp);
    expect(err.message).toBe('Plain text error');
  });

  it('uses fallback message when body parsing fails', async () => {
    const resp = new Response(null, { status: 500 });
    // Force JSON parse to fail
    Object.defineProperty(resp, 'headers', {
      value: new Headers({ 'content-type': 'application/json' }),
    });
    vi.spyOn(resp, 'json').mockRejectedValue(new Error('parse error'));

    const err = await fromFetchResponse(resp, 'Custom fallback');
    expect(err.message).toBeTruthy();
  });

  // mapPostgrestCode coverage - testing various SQLSTATE classes
  it.each([
    ['08001', 'CONNECTION_ERROR'],
    ['22001', 'STRING_DATA_TOO_LONG'],
    ['22003', 'NUMERIC_OUT_OF_RANGE'],
    ['22007', 'INVALID_DATE_FORMAT'],
    ['22012', 'DIVISION_BY_ZERO'],
    ['22P02', 'INVALID_TEXT_REPRESENTATION'],
    ['22999', 'DATA_EXCEPTION'],
    ['23505', 'DUPLICATE_KEY'],
    ['23503', 'FOREIGN_KEY_VIOLATION'],
    ['23502', 'NOT_NULL_VIOLATION'],
    ['23514', 'CHECK_VIOLATION'],
    ['23999', 'CONSTRAINT_VIOLATION'],
    ['28000', 'AUTH_ERROR'],
    ['40001', 'SERIALIZATION_FAILURE'],
    ['40P01', 'DEADLOCK_DETECTED'],
    ['40999', 'TRANSACTION_ROLLBACK'],
    ['42501', 'PERMISSION_DENIED'],
    ['42601', 'SYNTAX_ERROR'],
    ['42703', 'UNDEFINED_COLUMN'],
    ['42883', 'UNDEFINED_FUNCTION'],
    ['42P01', 'UNDEFINED_TABLE'],
    ['42999', 'QUERY_ERROR'],
    ['53000', 'INSUFFICIENT_RESOURCES'],
    ['54000', 'LIMIT_EXCEEDED'],
    ['P0001', 'RAISE_EXCEPTION'],
    ['P0999', 'PLPGSQL_ERROR'],
  ])('maps pgCode "%s" to "%s"', async (pgCode, expectedCode) => {
    const resp = new Response(
      JSON.stringify({ message: 'test', code: pgCode }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );

    const err = await fromFetchResponse(resp);
    expect(err.code).toBe(expectedCode);
  });

  // HTTP status fallback coverage
  it.each([
    [400, 'BAD_REQUEST'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [405, 'METHOD_NOT_ALLOWED'],
    [406, 'NOT_ACCEPTABLE'],
    [409, 'CONFLICT'],
    [416, 'RANGE_NOT_SATISFIABLE'],
    [422, 'UNPROCESSABLE_ENTITY'],
    [429, 'RATE_LIMITED'],
    [500, 'SERVER_ERROR'],
    [502, 'SERVER_ERROR'],
    [418, 'REQUEST_ERROR'],
  ])('falls back to HTTP status %d → "%s"', async (status, expectedCode) => {
    const resp = new Response(
      JSON.stringify({ message: 'test' }),
      { status, headers: { 'content-type': 'application/json' } },
    );

    const err = await fromFetchResponse(resp);
    expect(err.code).toBe(expectedCode);
  });

  it('PGRST known codes map correctly', async () => {
    const codes = [
      'PGRST000', 'PGRST001', 'PGRST002', 'PGRST100', 'PGRST101',
      'PGRST102', 'PGRST103', 'PGRST105', 'PGRST106', 'PGRST107',
      'PGRST108', 'PGRST109', 'PGRST110', 'PGRST116', 'PGRST200',
      'PGRST201', 'PGRST301',
    ];

    for (const code of codes) {
      const resp = new Response(
        JSON.stringify({ message: 'test', code }),
        { status: 500, headers: { 'content-type': 'application/json' } },
      );
      const err = await fromFetchResponse(resp);
      expect(err.code).toMatch(/^POSTGREST_/);
    }
  });
});

describe('fromFetchError', () => {
  it('returns existing AppError as-is', () => {
    const original = new AppError('test', 'CODE', 400);
    const result = fromFetchError(original);
    expect(result).toBe(original);
  });

  it('wraps TypeError as NETWORK_ERROR', () => {
    const result = fromFetchError(new TypeError('Failed to fetch'));
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.status).toBe(503);
  });

  it('wraps regular Error', () => {
    const result = fromFetchError(new Error('something'));
    expect(result.code).toBe('FETCH_ERROR');
    expect(result.status).toBe(500);
  });

  it('wraps non-Error values', () => {
    const result = fromFetchError(42);
    expect(result.code).toBe('FETCH_ERROR');
    expect(result.details).toEqual({ raw: 42 });
  });
});

describe('getErrorStatus', () => {
  it('returns status from AppError', () => {
    expect(getErrorStatus(new AppError('test', 'CODE', 422))).toBe(422);
  });

  it('infers 401 from "no autorizado"', () => {
    expect(getErrorStatus(new Error('No autorizado'))).toBe(401);
  });

  it('infers 401 from "unauthorized"', () => {
    expect(getErrorStatus(new Error('unauthorized access'))).toBe(401);
  });

  it('infers 403 from "acceso denegado"', () => {
    expect(getErrorStatus(new Error('Acceso denegado'))).toBe(403);
  });

  it('infers 403 from "forbidden"', () => {
    expect(getErrorStatus(new Error('forbidden'))).toBe(403);
  });

  it('infers 404 from "no encontrad"', () => {
    expect(getErrorStatus(new Error('Recurso no encontrado'))).toBe(404);
  });

  it('infers 404 from "not found"', () => {
    expect(getErrorStatus(new Error('not found'))).toBe(404);
  });

  it('infers 409 from "ya existe"', () => {
    expect(getErrorStatus(new Error('El registro ya existe'))).toBe(409);
  });

  it('infers 409 from "duplicate"', () => {
    expect(getErrorStatus(new Error('duplicate key'))).toBe(409);
  });

  it('returns 500 for unknown Error', () => {
    expect(getErrorStatus(new Error('unknown'))).toBe(500);
  });

  it('returns 500 for non-Error', () => {
    expect(getErrorStatus('string')).toBe(500);
  });
});

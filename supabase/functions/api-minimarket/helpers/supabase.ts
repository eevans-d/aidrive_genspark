/**
 * Supabase/PostgREST helpers for api-minimarket.
 *
 * All queries use user's JWT token to enforce RLS.
 * Service role is NOT used for regular queries.
 */

import { fromFetchResponse, AppError } from '../../_shared/errors.ts';

export type QueryOptions = {
  order?: string;
  limit?: number;
  offset?: number;
};

export type QueryResult<T> = {
  data: T[];
  count: number | null;
};

/**
 * Parse Content-Range header to extract total count.
 * Format: "0-9/100" or "0-9/*"
 */
export function parseContentRange(value: string | null): number | null {
  if (!value) return null;
  const parts = value.split('/');
  if (parts.length < 2) return null;
  const total = parts[1];
  if (total === '*') return null;
  const count = Number(total);
  return Number.isFinite(count) ? count : null;
}

/**
 * Build PostgREST query URL.
 */
export function buildQueryUrl(
  supabaseUrl: string,
  table: string,
  filters: Record<string, unknown> = {},
  select = '*',
  options: QueryOptions = {},
): string {
  const params = new URLSearchParams();
  params.set('select', select);

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, `eq.${String(value)}`);
    }
  });

  if (options.order) params.set('order', options.order);
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.offset !== undefined) params.set('offset', String(options.offset));

  return `${supabaseUrl}/rest/v1/${table}?${params.toString()}`;
}

/**
 * Query table via PostgREST.
 */
export async function queryTable<T = Record<string, unknown>>(
  supabaseUrl: string,
  table: string,
  headers: Record<string, string>,
  filters: Record<string, unknown> = {},
  select = '*',
  options: QueryOptions = {},
): Promise<T[]> {
  const queryUrl = buildQueryUrl(supabaseUrl, table, filters, select, options);

  const response = await fetch(queryUrl, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw await fromFetchResponse(response, `Error query ${table}`);
  }

  return await response.json();
}

/**
 * Query table with count via PostgREST.
 * Uses Prefer: count=exact header.
 */
export async function queryTableWithCount<T = Record<string, unknown>>(
  supabaseUrl: string,
  table: string,
  headers: Record<string, string>,
  filters: Record<string, unknown> = {},
  select = '*',
  options: QueryOptions = {},
): Promise<QueryResult<T>> {
  const queryUrl = buildQueryUrl(supabaseUrl, table, filters, select, options);

  const response = await fetch(queryUrl, {
    method: 'GET',
    headers: { ...headers, Prefer: 'count=exact' },
  });

  if (!response.ok) {
    throw await fromFetchResponse(response, `Error query ${table}`);
  }

  const data = await response.json();
  const count = parseContentRange(response.headers.get('content-range'));
  return { data, count: count ?? data.length };
}

/**
 * Insert into table via PostgREST.
 */
export async function insertTable<T = Record<string, unknown>>(
  supabaseUrl: string,
  table: string,
  headers: Record<string, string>,
  data: unknown,
): Promise<T[]> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await fromFetchResponse(response, `Error insertando en ${table}`);
  }

  return await response.json();
}

/**
 * Update table via PostgREST.
 */
export async function updateTable<T = Record<string, unknown>>(
  supabaseUrl: string,
  table: string,
  id: string,
  headers: Record<string, string>,
  data: unknown,
): Promise<T[]> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await fromFetchResponse(response, `Error actualizando ${table}`);
  }

  return await response.json();
}

/**
 * Call PL/pgSQL function via PostgREST RPC.
 */
export async function callFunction<T = unknown>(
  supabaseUrl: string,
  functionName: string,
  headers: Record<string, string>,
  params: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw await fromFetchResponse(response, `Error llamando ${functionName}`);
  }

  return await response.json();
}

/**
 * Fetch with custom query string (for complex filters like ilike, or).
 */
export async function fetchWithParams(
  supabaseUrl: string,
  table: string,
  params: URLSearchParams,
  headers: Record<string, string>,
): Promise<{ data: unknown[]; count: number | null }> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}?${params.toString()}`,
    {
      method: 'GET',
      headers: { ...headers, Prefer: 'count=exact' },
    },
  );

  if (!response.ok) {
    throw await fromFetchResponse(response, `Error query ${table}`);
  }

  const data = await response.json();
  const count = parseContentRange(response.headers.get('content-range'));
  return { data, count: count ?? data.length };
}

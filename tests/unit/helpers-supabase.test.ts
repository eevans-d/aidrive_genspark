/**
 * Tests for helpers/supabase.ts — PostgREST query helpers
 * Covers: parseContentRange, buildQueryUrl, queryTable, queryTableWithCount,
 *         insertTable, updateTable, callFunction, fetchWithParams
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseContentRange,
  buildQueryUrl,
  queryTable,
  queryTableWithCount,
  insertTable,
  updateTable,
  callFunction,
  fetchWithParams,
} from '../../supabase/functions/api-minimarket/helpers/supabase';

const BASE_URL = 'https://x.supabase.co';
const HEADERS = { Authorization: 'Bearer tok', apikey: 'anon', 'Content-Type': 'application/json' };

describe('parseContentRange', () => {
  it('parses valid range "0-9/100"', () => {
    expect(parseContentRange('0-9/100')).toBe(100);
  });

  it('returns null for wildcard "0-9/*"', () => {
    expect(parseContentRange('0-9/*')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(parseContentRange(null)).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(parseContentRange('bad')).toBeNull();
  });

  it('returns null for NaN total', () => {
    expect(parseContentRange('0-9/abc')).toBeNull();
  });
});

describe('buildQueryUrl', () => {
  it('builds basic URL with select', () => {
    const url = buildQueryUrl(BASE_URL, 'products');
    expect(url).toContain('/rest/v1/products');
    expect(url).toContain('select=*');
  });

  it('includes filters as eq. params', () => {
    const url = buildQueryUrl(BASE_URL, 'products', { activo: true, tipo: 'A' });
    expect(url).toContain('activo=eq.true');
    expect(url).toContain('tipo=eq.A');
  });

  it('ignores null/undefined filter values', () => {
    const url = buildQueryUrl(BASE_URL, 'products', { a: null, b: undefined, c: 'val' });
    expect(url).not.toContain('a=');
    expect(url).not.toContain('b=');
    expect(url).toContain('c=eq.val');
  });

  it('includes order, limit, offset', () => {
    const url = buildQueryUrl(BASE_URL, 'products', {}, '*', {
      order: 'name.asc',
      limit: 10,
      offset: 20,
    });
    expect(url).toContain('order=name.asc');
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=20');
  });

  it('uses custom select', () => {
    const url = buildQueryUrl(BASE_URL, 'products', {}, 'id,name');
    expect(url).toContain('select=id%2Cname');
  });
});

describe('queryTable', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns data on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }, { id: 2 }]), { status: 200 }),
    );

    const result = await queryTable(BASE_URL, 'products', HEADERS);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Error' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(queryTable(BASE_URL, 'products', HEADERS)).rejects.toThrow();
  });

  it('passes timeout to fetchWithTimeout', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    await queryTable(BASE_URL, 'products', HEADERS, {}, '*', { timeout: 5000 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('queryTableWithCount', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns data and count from content-range', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { 'content-range': '0-0/42' },
      }),
    );

    const result = await queryTableWithCount(BASE_URL, 'products', HEADERS);
    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.count).toBe(42);
  });

  it('falls back to data.length when no content-range', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }, { id: 2 }]), { status: 200 }),
    );

    const result = await queryTableWithCount(BASE_URL, 'products', HEADERS);
    expect(result.count).toBe(2);
  });

  it('throws on error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );

    await expect(queryTableWithCount(BASE_URL, 'products', HEADERS)).rejects.toThrow();
  });
});

describe('insertTable', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('inserts and returns representation', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 'new', name: 'Test' }]), { status: 201 }),
    );

    const result = await insertTable(BASE_URL, 'products', HEADERS, { name: 'Test' });
    expect(result).toEqual([{ id: 'new', name: 'Test' }]);
  });

  it('throws on error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'duplicate' }), {
        status: 409,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(insertTable(BASE_URL, 'products', HEADERS, { name: 'X' })).rejects.toThrow();
  });
});

describe('updateTable', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('updates and returns representation', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: '1', name: 'Updated' }]), { status: 200 }),
    );

    const result = await updateTable(BASE_URL, 'products', '1', HEADERS, { name: 'Updated' });
    expect(result).toEqual([{ id: '1', name: 'Updated' }]);
  });

  it('sends PATCH to correct URL with id filter', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    await updateTable(BASE_URL, 'products', 'abc', HEADERS, { name: 'X' });
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('products?id=eq.abc');
    expect((fetchSpy.mock.calls[0][1] as RequestInit).method).toBe('PATCH');
  });

  it('throws on error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Error', { status: 500 }),
    );

    await expect(updateTable(BASE_URL, 'products', '1', HEADERS, {})).rejects.toThrow();
  });
});

describe('callFunction', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('calls RPC endpoint and returns result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const result = await callFunction(BASE_URL, 'my_func', HEADERS, { p1: 'val' });
    expect(result).toEqual({ ok: true });
  });

  it('sends POST to /rest/v1/rpc/<function>', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(null), { status: 200 }),
    );

    await callFunction(BASE_URL, 'do_something', HEADERS);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('/rest/v1/rpc/do_something');
  });

  it('throws on error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(callFunction(BASE_URL, 'missing', HEADERS)).rejects.toThrow();
  });
});

describe('fetchWithParams', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('fetches with custom URLSearchParams', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }]), {
        status: 200,
        headers: { 'content-range': '0-0/5' },
      }),
    );

    const params = new URLSearchParams();
    params.set('select', 'id,name');
    params.set('name', 'ilike.*test*');

    const result = await fetchWithParams(BASE_URL, 'products', params, HEADERS);
    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.count).toBe(5);
  });

  it('falls back to data.length when no content-range', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }, { id: 2 }]), { status: 200 }),
    );

    const result = await fetchWithParams(BASE_URL, 'products', new URLSearchParams(), HEADERS);
    expect(result.count).toBe(2);
  });

  it('throws on error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Error', { status: 500 }),
    );

    await expect(
      fetchWithParams(BASE_URL, 'products', new URLSearchParams(), HEADERS),
    ).rejects.toThrow();
  });
});

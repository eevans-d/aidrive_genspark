/**
 * Tests for apiClient x-request-id correlation
 * @description Validates that frontend generates x-request-id, sends it to backend,
 * extracts server's x-request-id from responses, and propagates it in errors.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError, TimeoutError } from './apiClient';

// Mock supabase to provide a fake session
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token-123' } },
      }),
    },
  },
}));

describe('x-request-id correlation', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ApiError includes optional requestId field', () => {
    const err = new ApiError('CODE', 'msg', 500, null, 'req-abc');
    expect(err.requestId).toBe('req-abc');
    expect(err.code).toBe('CODE');
    expect(err.status).toBe(500);
  });

  it('ApiError requestId defaults to undefined', () => {
    const err = new ApiError('CODE', 'msg', 400);
    expect(err.requestId).toBeUndefined();
  });

  it('TimeoutError includes optional requestId field', () => {
    const err = new TimeoutError(5000, '/test', 'req-xyz');
    expect(err.requestId).toBe('req-xyz');
    expect(err.timeoutMs).toBe(5000);
    expect(err.endpoint).toBe('/test');
  });

  it('TimeoutError requestId defaults to undefined', () => {
    const err = new TimeoutError(5000, '/test');
    expect(err.requestId).toBeUndefined();
  });

  it('sends x-request-id header in outgoing requests', async () => {
    const responseHeaders = new Headers({ 'x-request-id': 'server-id-1' });
    fetchSpy.mockResolvedValue({
      ok: true,
      headers: responseHeaders,
      json: () => Promise.resolve({ success: true, data: { result: 'ok' } }),
    });

    // Dynamic import to get the apiRequest function indirectly through a public API
    // We test via the exported API methods which call apiRequest internally
    const { productosApi } = await import('./apiClient');
    await productosApi.dropdown();

    // Verify fetch was called with x-request-id header
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const fetchOpts = fetchSpy.mock.calls[0]![1] as { headers: Record<string, string> };
    expect(fetchOpts.headers).toHaveProperty('x-request-id');
    expect(fetchOpts.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^\d+-[a-z0-9]+$/
    );
  });

  it('propagates server x-request-id in ApiError on failure', async () => {
    const serverRequestId = 'srv-req-failure-42';
    const responseHeaders = new Headers({ 'x-request-id': serverRequestId });
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 422,
      headers: responseHeaders,
      json: () => Promise.resolve({
        success: false,
        error: { code: 'VALIDATION', message: 'Invalid input' },
      }),
    });

    const { productosApi } = await import('./apiClient');

    try {
      await productosApi.dropdown();
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.requestId).toBe(serverRequestId);
      expect(apiErr.code).toBe('VALIDATION');
      expect(apiErr.status).toBe(422);
    }
  });
});

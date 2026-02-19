/**
 * Unit tests for api-proveedor HTTP utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  isRetryableAPIError,
  fetchWithTimeout,
  fetchWithRetry,
} from '../../supabase/functions/api-proveedor/utils/http.ts';

describe('api-proveedor/utils/http', () => {
  describe('isRetryableAPIError()', () => {
    it('returns true for timeout errors', () => {
      expect(isRetryableAPIError(new Error('Request timeout'))).toBe(true);
    });

    it('returns true for network errors', () => {
      expect(isRetryableAPIError(new Error('Network error'))).toBe(true);
    });

    it('returns true for connection errors', () => {
      expect(isRetryableAPIError(new Error('Connection refused'))).toBe(true);
    });

    it('returns true for rate limit errors', () => {
      expect(isRetryableAPIError(new Error('Rate limit exceeded'))).toBe(true);
    });

    it('returns true for 503 errors', () => {
      expect(isRetryableAPIError(new Error('HTTP 503'))).toBe(true);
    });

    it('returns true for 502 errors', () => {
      expect(isRetryableAPIError(new Error('HTTP 502'))).toBe(true);
    });

    it('returns true for 504 errors', () => {
      expect(isRetryableAPIError(new Error('HTTP 504'))).toBe(true);
    });

    it('returns true for Spanish availability message', () => {
      expect(
        isRetryableAPIError(new Error('Servicio temporalmente no disponible')),
      ).toBe(true);
    });

    it('returns false for 404 errors', () => {
      expect(isRetryableAPIError(new Error('HTTP 404 Not Found'))).toBe(false);
    });

    it('returns false for 400 errors', () => {
      expect(isRetryableAPIError(new Error('Bad request'))).toBe(false);
    });

    it('returns false for generic errors', () => {
      expect(isRetryableAPIError(new Error('Unknown error'))).toBe(false);
    });
  });

  describe('fetchWithTimeout()', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns response on successful fetch', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      (globalThis.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchWithTimeout('https://example.com', {}, 5000);
      expect(result.status).toBe(200);
    });

    it('passes abort signal to fetch', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      (globalThis.fetch as any).mockResolvedValueOnce(mockResponse);

      await fetchWithTimeout('https://example.com', { method: 'GET' }, 5000);
      const callArgs = (globalThis.fetch as any).mock.calls[0];
      expect(callArgs[1].signal).toBeDefined();
    });

    it('throws on fetch error', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network'));

      await expect(
        fetchWithTimeout('https://example.com', {}, 5000),
      ).rejects.toThrow('Network');
    });
  });

  describe('fetchWithRetry()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('returns immediately on successful response', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      (globalThis.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchWithRetry('https://example.com', {}, 3, 100);
      expect(result.status).toBe(200);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('returns non-retryable error responses without retry', async () => {
      const mockResponse = new Response('not found', { status: 404 });
      (globalThis.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await fetchWithRetry('https://example.com', {}, 3, 100);
      expect(result.status).toBe(404);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on 500 and succeeds', async () => {
      const failResponse = new Response('error', { status: 500 });
      const okResponse = new Response('ok', { status: 200 });

      (globalThis.fetch as any)
        .mockResolvedValueOnce(failResponse)
        .mockResolvedValueOnce(okResponse);

      const promise = fetchWithRetry('https://example.com', {}, 3, 10, 100);

      // Advance past the retry delay
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result.status).toBe(200);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('throws non-retryable fetch errors immediately', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(
        new Error('Invalid URL'),
      );

      await expect(
        fetchWithRetry('https://example.com', {}, 3, 100),
      ).rejects.toThrow('Invalid URL');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
  });
});

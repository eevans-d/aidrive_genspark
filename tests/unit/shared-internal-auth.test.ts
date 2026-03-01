/**
 * Unit tests for _shared/internal-auth (requireServiceRoleAuth).
 */

import { describe, it, expect } from 'vitest';

// Mock Deno env
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => undefined } };
}

import { requireServiceRoleAuth } from '../../supabase/functions/_shared/internal-auth.ts';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-service-key';

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://test.supabase.co/functions/v1/cron-test', {
    headers,
  });
}

// Helper: create a fake JWT with given payload
function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('_shared/internal-auth — requireServiceRoleAuth', () => {
  describe('Bearer token matching', () => {
    it('authorizes when Authorization header matches service key', () => {
      const req = makeRequest({ authorization: `Bearer ${SERVICE_KEY}` });
      const result = requireServiceRoleAuth(req, SERVICE_KEY);
      expect(result.authorized).toBe(true);
      expect(result.errorResponse).toBeUndefined();
    });

    it('rejects when Authorization Bearer does not match', () => {
      const req = makeRequest({ authorization: 'Bearer wrong-key' });
      const result = requireServiceRoleAuth(req, SERVICE_KEY);
      expect(result.authorized).toBe(false);
      expect(result.errorResponse).toBeDefined();
      expect(result.errorResponse!.status).toBe(401);
    });
  });

  describe('apikey header matching', () => {
    it('authorizes when apikey matches service key', () => {
      const req = makeRequest({ apikey: SERVICE_KEY });
      const result = requireServiceRoleAuth(req, SERVICE_KEY);
      expect(result.authorized).toBe(true);
    });

    it('rejects when apikey does not match', () => {
      const req = makeRequest({ apikey: 'wrong-key' });
      const result = requireServiceRoleAuth(req, SERVICE_KEY);
      expect(result.authorized).toBe(false);
    });
  });

  describe('JWT role fallback (removed for security — S2 fix)', () => {
    it('rejects JWT with role=service_role that does not match exact key (no unverified JWT trust)', () => {
      const token = fakeJwt({ role: 'service_role', sub: 'system' });
      const req = makeRequest({ authorization: `Bearer ${token}` });
      const result = requireServiceRoleAuth(req, SERVICE_KEY);
      expect(result.authorized).toBe(false);
    });

    it('rejects when JWT has non-service_role role', () => {
      const token = fakeJwt({ role: 'anon', sub: 'user' });
      const req = makeRequest({ authorization: `Bearer ${token}` });
      const result = requireServiceRoleAuth(req, SERVICE_KEY);
      expect(result.authorized).toBe(false);
    });

    it('rejects when JWT is malformed (only 1 part)', () => {
      const req = makeRequest({ authorization: 'Bearer not-a-jwt' });
      const result = requireServiceRoleAuth(req, SERVICE_KEY);
      expect(result.authorized).toBe(false);
    });

    it('rejects when JWT payload is not valid JSON', () => {
      const req = makeRequest({ authorization: 'Bearer header.!!!invalid-base64.sig' });
      const result = requireServiceRoleAuth(req, SERVICE_KEY);
      expect(result.authorized).toBe(false);
    });
  });

  describe('no credentials', () => {
    it('rejects when no auth headers provided', () => {
      const req = makeRequest({});
      const result = requireServiceRoleAuth(req, SERVICE_KEY);
      expect(result.authorized).toBe(false);
      expect(result.errorResponse).toBeDefined();
    });
  });

  describe('error response format', () => {
    it('returns 401 with UNAUTHORIZED code', async () => {
      const req = makeRequest({});
      const result = requireServiceRoleAuth(req, SERVICE_KEY, { 'x-request-id': 'test' }, 'req-1');
      expect(result.authorized).toBe(false);

      const body = await result.errorResponse!.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toContain('internal service token');
    });
  });
});

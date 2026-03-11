import { beforeAll, describe, expect, test } from 'vitest';
import { createHmac } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.API_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.ANON_KEY;

const DEFAULT_ORIGIN = 'http://localhost:5173';
const ORIGIN = process.env.TEST_ORIGIN || process.env.ORIGIN || DEFAULT_ORIGIN;

const API_SECRET = process.env.API_PROVEEDOR_SECRET;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
const PRESET_BEARER_TOKEN = process.env.E2E_BEARER_TOKEN;

function base64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function buildHs256Jwt(secret: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      aud: 'authenticated',
      role: 'service_role',
      sub: 'e2e-smoke-user',
      email: 'e2e-smoke@local.test',
      iss: 'supabase-demo',
      iat: now,
      exp: now + 60 * 60,
    }),
  );

  const unsigned = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

function resolveBearerToken(serviceRoleKey: string): string {
  if (PRESET_BEARER_TOKEN?.trim()) {
    return PRESET_BEARER_TOKEN.trim();
  }
  if (JWT_SECRET?.trim()) {
    return buildHs256Jwt(JWT_SECRET.trim());
  }
  return serviceRoleKey;
}

const requireEnv = () => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !API_SECRET) {
    throw new Error(
      'Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY o API_PROVEEDOR_SECRET. Ejecuta supabase start o configura envs.'
    );
  }
  return { supabaseUrl: SUPABASE_URL, serviceRoleKey: SERVICE_ROLE_KEY, apiSecret: API_SECRET };
};

const expectOk = async (res: Response, label: string) => {
  if (res.ok) return;
  const body = await res.text();
  throw new Error(`${label} failed (${res.status}): ${body}`);
};

describe('E2E Smoke - api-proveedor', () => {
  let baseUrl: string;
  let authHeaders: Record<string, string>;

  beforeAll(() => {
    const { supabaseUrl, serviceRoleKey, apiSecret } = requireEnv();
    baseUrl = `${supabaseUrl}/functions/v1/api-proveedor`;
    const bearerToken = resolveBearerToken(serviceRoleKey);
    authHeaders = {
      Authorization: `Bearer ${bearerToken}`,
      'x-request-id': `smoke-${Date.now()}`,
      Origin: ORIGIN,
      'x-api-secret': apiSecret
    };
  });

  test('GET /status responde success', async () => {
    const res = await fetch(`${baseUrl}/status`, { headers: authHeaders });
    await expectOk(res, 'GET /status');

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test('GET /precios responde success', async () => {
    const res = await fetch(`${baseUrl}/precios?limit=1`, { headers: authHeaders });
    await expectOk(res, 'GET /precios');

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data?.productos)).toBe(true);
  });

  test('GET /alertas responde success', async () => {
    const res = await fetch(`${baseUrl}/alertas?limit=1`, { headers: authHeaders });
    await expectOk(res, 'GET /alertas');

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data?.alertas)).toBe(true);
  });

  test('GET /health responde success (requires JWT)', async () => {
    // NOTE: `api-proveedor` tiene `verify_jwt=true` en Supabase, por lo que /health requiere Authorization.
    const res = await fetch(`${baseUrl}/health`, { headers: authHeaders });
    await expectOk(res, 'GET /health');

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.status).toBeDefined();
    expect(body.data.timestamp).toBeDefined();
    expect(typeof body.data.health_score).toBe('number');
  });
});

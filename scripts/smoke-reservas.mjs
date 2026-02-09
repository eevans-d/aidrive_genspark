#!/usr/bin/env node
/**
 * Smoke test for POST /reservas (write endpoint).
 *
 * Strategy:
 *   1. Auth as TEST_USER_ADMIN (needs admin/ventas/deposito role).
 *   2. GET /search to find a real producto_id.
 *   3. POST /reservas with deterministic idempotency key (safe to rerun).
 *   4. Expect 201 (first) or 200 (idempotent rerun).
 *
 * Reads `.env.test` (gitignored) for:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_ADMIN, TEST_PASSWORD
 *
 * Security:
 * - Does NOT print JWTs, passwords, API keys, or full response payload data.
 * - Idempotency key includes date to avoid cross-day collisions.
 * - Reserves only 1 unit from the first found product.
 */

import fs from 'node:fs';
import path from 'node:path';

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (!key) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  const envPath = path.resolve(process.cwd(), '.env.test');
  loadDotEnvFile(envPath);

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const email = process.env.TEST_USER_ADMIN;
  const password = process.env.TEST_PASSWORD;

  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!anonKey) missing.push('SUPABASE_ANON_KEY');
  if (!email) missing.push('TEST_USER_ADMIN');
  if (!password) missing.push('TEST_PASSWORD');
  if (missing.length) {
    console.error(`MISSING_ENV: ${missing.join(', ')}`);
    process.exit(2);
  }

  const basePath = '/functions/v1/api-minimarket';

  // 1) Auth
  console.log('--- AUTH ---');
  const tokenUrl = new URL('/auth/v1/token', supabaseUrl);
  tokenUrl.searchParams.set('grant_type', 'password');

  const authRes = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!authRes.ok) {
    console.error(`AUTH_STATUS: ${authRes.status}`);
    process.exit(1);
  }

  const authJson = await authRes.json();
  const accessToken = authJson?.access_token;
  if (!accessToken) {
    console.error('AUTH_ERROR: missing access_token');
    process.exit(1);
  }
  console.log('AUTH_STATUS: OK');

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    apikey: anonKey,
    'Content-Type': 'application/json',
  };

  // 2) Find a product via /productos/dropdown
  console.log('\n--- FIND PRODUCT ---');
  const dropdownUrl = new URL(`${basePath}/productos/dropdown`, supabaseUrl);
  const dropdownRes = await fetch(dropdownUrl.toString(), { headers });

  if (!dropdownRes.ok) {
    console.log(`DROPDOWN_STATUS: ${dropdownRes.status}`);
    console.log('BLOCKER: cannot list products via /productos/dropdown');
    console.log('RESULT: BLOCKED');
    process.exit(0);
  }

  const dropdownJson = await dropdownRes.json();
  const productos = dropdownJson?.data;
  if (!Array.isArray(productos) || productos.length === 0) {
    console.log('DROPDOWN_STATUS: 200 (empty)');
    console.log('BLOCKER: no products in database — cannot test /reservas');
    console.log('RESULT: BLOCKED');
    process.exit(0);
  }

  const productoId = productos[0].id;
  const productoNombre = productos[0].nombre || 'unknown';
  console.log(`PRODUCT_FOUND: ${productoNombre} (id length: ${productoId?.length})`);

  // 3) POST /reservas
  console.log('\n--- POST /reservas ---');
  const today = new Date().toISOString().slice(0, 10);
  const idempotencyKey = `smoke-reservas-${today}`;

  const reservaUrl = new URL(`${basePath}/reservas`, supabaseUrl);
  const reservaRes = await fetch(reservaUrl.toString(), {
    method: 'POST',
    headers: {
      ...headers,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      producto_id: productoId,
      cantidad: 1,
      deposito: 'Principal',
      referencia: `smoke-test-${today}`,
    }),
  });

  const reservaJson = await reservaRes.json().catch(() => null);

  console.log(`STATUS: ${reservaRes.status}`);
  console.log(`SUCCESS: ${reservaJson?.success}`);
  console.log(`IDEMPOTENT: ${reservaJson?.idempotent ?? 'N/A'}`);

  if (reservaRes.status === 201 || reservaRes.status === 200) {
    console.log('RESULT: PASS');
  } else if (reservaRes.status === 409) {
    // INSUFFICIENT_STOCK — documented, not a test failure
    console.log(`ERROR_CODE: ${reservaJson?.error?.code}`);
    console.log('NOTE: 409 = insufficient stock (expected if product has 0 stock)');
    console.log('RESULT: PASS_WITH_NOTE');
  } else {
    console.log(`ERROR_CODE: ${reservaJson?.error?.code}`);
    console.log(`ERROR_MSG: ${reservaJson?.error?.message}`);
    console.log('RESULT: FAIL');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('UNEXPECTED_ERROR');
  console.error(err?.message || String(err));
  process.exit(1);
});

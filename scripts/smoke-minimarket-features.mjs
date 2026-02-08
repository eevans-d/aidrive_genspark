#!/usr/bin/env node
/**
 * Smoke test (read-only) for minimarket features:
 *   GET /functions/v1/api-minimarket/search?q=test&limit=3
 *   GET /functions/v1/api-minimarket/insights/arbitraje
 *   GET /functions/v1/api-minimarket/clientes
 *   GET /functions/v1/api-minimarket/cuentas-corrientes/resumen
 *   GET /functions/v1/api-minimarket/ofertas/sugeridas
 *   GET /functions/v1/api-minimarket/bitacora?limit=3
 *
 * Reads local `.env.test` (gitignored) for:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   TEST_USER_ADMIN
 *   TEST_PASSWORD
 *
 * Security:
 * - Does NOT print JWTs, passwords, API keys, or response payload data.
 * - Prints only HTTP status + minimal structural info (content-type, top-level keys/length).
 * - All requests are GET (read-only) — no data is created, updated, or deleted.
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

function summarizeJson(value) {
  if (Array.isArray(value)) return { type: 'array', length: value.length };
  if (value && typeof value === 'object') return { type: 'object', keys: Object.keys(value) };
  if (typeof value === 'string') return { type: 'string', length: value.length };
  return { type: typeof value };
}

function safeTruncate(text, max = 400) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max) + '...';
}

const ENDPOINTS = [
  { name: 'search',                  path: '/search?q=test&limit=3' },
  { name: 'insights/arbitraje',      path: '/insights/arbitraje' },
  { name: 'clientes',                path: '/clientes' },
  { name: 'cuentas-corrientes/resumen', path: '/cuentas-corrientes/resumen' },
  { name: 'ofertas/sugeridas',       path: '/ofertas/sugeridas' },
  { name: 'bitacora',                path: '/bitacora?limit=3' },
];

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

  // 1) Obtain a fresh JWT (access_token) via password grant.
  console.log('--- AUTH ---');
  const tokenUrl = new URL('/auth/v1/token', supabaseUrl);
  tokenUrl.searchParams.set('grant_type', 'password');

  const authRes = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!authRes.ok) {
    const text = await authRes.text().catch(() => '');
    console.error(`AUTH_STATUS: ${authRes.status}`);
    console.error(`AUTH_ERROR: ${safeTruncate(text)}`);
    process.exit(1);
  }

  const authJson = await authRes.json();
  const accessToken = authJson?.access_token;
  if (!accessToken || typeof accessToken !== 'string') {
    console.error('AUTH_STATUS: 200');
    console.error('AUTH_ERROR: missing access_token');
    process.exit(1);
  }
  console.log('AUTH_STATUS: OK');

  // 2) Call each endpoint (read-only GET).
  const basePath = '/functions/v1/api-minimarket';
  let failures = 0;

  for (const ep of ENDPOINTS) {
    console.log(`\n--- ${ep.name.toUpperCase()} ---`);
    const endpointUrl = new URL(`${basePath}${ep.path}`, supabaseUrl);

    try {
      const res = await fetch(endpointUrl.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey,
        },
      });

      const contentType = res.headers.get('content-type') || '';
      const rawBody = await res.text().catch(() => '');

      console.log(`STATUS: ${res.status}`);
      console.log(`CONTENT_TYPE: ${contentType || 'unknown'}`);

      if (contentType.includes('application/json')) {
        try {
          const parsed = rawBody ? JSON.parse(rawBody) : null;
          // For gateway responses, summarize the data field if present
          if (parsed && typeof parsed === 'object' && 'success' in parsed) {
            console.log(`SUCCESS: ${parsed.success}`);
            if (parsed.data !== undefined) {
              console.log(`DATA_SUMMARY: ${JSON.stringify(summarizeJson(parsed.data))}`);
            }
          } else {
            console.log(`BODY_SUMMARY: ${JSON.stringify(summarizeJson(parsed))}`);
          }
        } catch {
          console.log('BODY_SUMMARY: {"type":"invalid_json"}');
        }
      } else {
        console.log(`BODY_SUMMARY: ${JSON.stringify({ type: 'text', length: rawBody.length })}`);
      }

      if (!res.ok) {
        console.log(`BODY_SNIPPET: ${safeTruncate(rawBody)}`);
        failures++;
      }
    } catch (err) {
      console.error(`FETCH_ERROR: ${err?.message || String(err)}`);
      failures++;
    }
  }

  // 3) Summary
  const total = ENDPOINTS.length;
  const passed = total - failures;
  console.log(`\n--- SUMMARY ---`);
  console.log(`TOTAL: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failures}`);
  console.log(`RESULT: ${failures === 0 ? 'ALL_PASS' : 'SOME_FAILED'}`);

  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error('UNEXPECTED_ERROR');
  console.error(err?.stack || String(err));
  process.exit(1);
});

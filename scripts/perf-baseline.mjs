#!/usr/bin/env node
/**
 * Performance baseline: p50/p95 latency for api-minimarket endpoints.
 *
 * Runs N iterations of each GET endpoint and computes percentiles.
 *
 * Reads `.env.test` (gitignored) for:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_ADMIN, TEST_PASSWORD
 *
 * Usage:
 *   node scripts/perf-baseline.mjs [iterations]
 *   Default: 10 iterations per endpoint.
 *
 * Security: does NOT print JWTs, passwords, API keys, or response payloads.
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

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

const ENDPOINTS = [
  { name: 'health',                    path: '/health' },
  { name: 'search',                    path: '/search?q=test&limit=3' },
  { name: 'insights/arbitraje',        path: '/insights/arbitraje' },
  { name: 'clientes',                  path: '/clientes' },
  { name: 'cuentas-corrientes/resumen', path: '/cuentas-corrientes/resumen' },
  { name: 'ofertas/sugeridas',         path: '/ofertas/sugeridas' },
  { name: 'bitacora',                  path: '/bitacora?limit=3' },
];

async function main() {
  const envPath = path.resolve(process.cwd(), '.env.test');
  loadDotEnvFile(envPath);

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const email = process.env.TEST_USER_ADMIN;
  const password = process.env.TEST_PASSWORD;
  const iterations = parseInt(process.argv[2] || '10', 10);

  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!anonKey) missing.push('SUPABASE_ANON_KEY');
  if (!email) missing.push('TEST_USER_ADMIN');
  if (!password) missing.push('TEST_PASSWORD');
  if (missing.length) {
    console.error(`MISSING_ENV: ${missing.join(', ')}`);
    process.exit(2);
  }

  // Auth
  const tokenUrl = new URL('/auth/v1/token', supabaseUrl);
  tokenUrl.searchParams.set('grant_type', 'password');

  const authRes = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!authRes.ok) {
    console.error(`AUTH_FAILED: ${authRes.status}`);
    process.exit(1);
  }

  const { access_token: accessToken } = await authRes.json();
  if (!accessToken) {
    console.error('AUTH_ERROR: missing access_token');
    process.exit(1);
  }

  const basePath = '/functions/v1/api-minimarket';
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    apikey: anonKey,
  };

  console.log(`Performance Baseline — ${iterations} iterations per endpoint`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');

  const results = [];

  for (const ep of ENDPOINTS) {
    const latencies = [];
    let errors = 0;
    let rateLimited = 0;

    for (let i = 0; i < iterations; i++) {
      const url = new URL(`${basePath}${ep.path}`, supabaseUrl);
      const start = performance.now();
      try {
        const res = await fetch(url.toString(), { headers });
        await res.text(); // consume body
        const ms = performance.now() - start;
        if (res.ok) {
          latencies.push(Math.round(ms));
        } else if (res.status === 429) {
          // Rate limiting is expected at high iteration count — skip, don't count as error
          rateLimited++;
        } else {
          if (errors === 0) console.log(`  [${ep.name}] first error: HTTP ${res.status}`);
          errors++;
        }
      } catch {
        errors++;
      }
    }

    latencies.sort((a, b) => a - b);

    const entry = {
      endpoint: ep.name,
      ok: latencies.length,
      errors,
      rateLimited,
      min: latencies[0] || 0,
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      max: latencies[latencies.length - 1] || 0,
    };

    results.push(entry);
    const rlNote = rateLimited > 0 ? ` 429=${rateLimited}` : '';
    console.log(
      `${ep.name.padEnd(30)} | ok=${entry.ok} err=${entry.errors}${rlNote} | min=${entry.min}ms p50=${entry.p50}ms p95=${entry.p95}ms max=${entry.max}ms`
    );
  }

  // Summary table (markdown)
  console.log('\n## Markdown table\n');
  console.log('| Endpoint | OK | Err | 429 | Min | p50 | p95 | Max |');
  console.log('|----------|-----|-----|-----|-----|-----|-----|-----|');
  for (const r of results) {
    console.log(
      `| ${r.endpoint} | ${r.ok} | ${r.errors} | ${r.rateLimited} | ${r.min}ms | ${r.p50}ms | ${r.p95}ms | ${r.max}ms |`
    );
  }

  const allP95 = results.map((r) => r.p95);
  const worstP95 = Math.max(...allP95);
  console.log(`\nWorst p95: ${worstP95}ms`);
  console.log(`Iterations: ${iterations}`);

  const totalRateLimited = results.reduce((s, r) => s + r.rateLimited, 0);
  if (totalRateLimited > 0) {
    console.log(`Rate limited (429): ${totalRateLimited} requests (expected at high iteration count)`);
  }

  if (results.some((r) => r.errors > 0)) {
    console.log('\nWARNING: some endpoints had real errors (non-429)');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('UNEXPECTED_ERROR');
  console.error(err?.message || String(err));
  process.exit(1);
});

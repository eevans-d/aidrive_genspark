#!/usr/bin/env node

import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

const DEFAULT_TIMEOUT_MS = 6000;
const DEFAULT_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 800;

const TARGET = (process.env.OPS_SMOKE_TARGET || 'local').toLowerCase();
const TIMEOUT_MS = parsePositiveInt('OPS_SMOKE_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
const RETRIES = parseNonNegativeInt('OPS_SMOKE_RETRIES', DEFAULT_RETRIES);
const RETRY_DELAY_MS = parseNonNegativeInt('OPS_SMOKE_RETRY_DELAY_MS', DEFAULT_RETRY_DELAY_MS);
const apiProveedorSecret = process.env.OPS_SMOKE_API_PROVEEDOR_SECRET || process.env.API_PROVEEDOR_SECRET || '';
const apiProveedorAuthorization = process.env.OPS_SMOKE_API_PROVEEDOR_AUTHORIZATION || process.env.OPS_SMOKE_AUTHORIZATION || '';

if (!['local', 'remote'].includes(TARGET)) {
  console.error('[CONFIG_ERROR] OPS_SMOKE_TARGET must be local or remote');
  process.exit(2);
}

const baseUrl = resolveBaseUrl(TARGET);
const serviceRoleKey = process.env.OPS_SMOKE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const checks = [
  {
    name: 'api-minimarket/health',
    path: '/api-minimarket/health',
    critical: true,
  },
  {
    name: 'api-proveedor/health',
    path: '/api-proveedor/health',
    critical: true,
    headers: buildApiProveedorHeaders(apiProveedorSecret, apiProveedorAuthorization),
  },
];

if (serviceRoleKey) {
  checks.push({
    name: 'cron-health-monitor/health-check',
    path: '/cron-health-monitor/health-check',
    critical: false,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
} else {
  console.log('[INFO] optional endpoint cron-health-monitor/health-check disabled (missing OPS_SMOKE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY)');
}

if (!apiProveedorSecret) {
  console.log('[INFO] api-proveedor/health may return 401 if OPS_SMOKE_API_PROVEEDOR_SECRET (or API_PROVEEDOR_SECRET) is not set');
}

console.log(`[OPS_SMOKE] target=${TARGET} base_url=${baseUrl} timeout_ms=${TIMEOUT_MS} retries=${RETRIES} retry_delay_ms=${RETRY_DELAY_MS}`);

let criticalFailures = 0;
let nonCriticalFailures = 0;
let totalPass = 0;

for (const check of checks) {
  const result = await runCheck(check);
  if (result.pass) {
    totalPass += 1;
    continue;
  }

  if (check.critical) {
    criticalFailures += 1;
  } else {
    nonCriticalFailures += 1;
  }
}

console.log('');
console.log(`[SUMMARY] total=${checks.length} pass=${totalPass} fail=${checks.length - totalPass} critical_fail=${criticalFailures} non_critical_fail=${nonCriticalFailures}`);

if (criticalFailures > 0) {
  process.exit(1);
}

process.exit(0);

function parsePositiveInt(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    console.error(`[CONFIG_ERROR] ${name} must be a positive integer`);
    process.exit(2);
  }
  return value;
}

function parseNonNegativeInt(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0) {
    console.error(`[CONFIG_ERROR] ${name} must be a non-negative integer`);
    process.exit(2);
  }
  return value;
}

function resolveBaseUrl(target) {
  const explicitBase = process.env.OPS_SMOKE_BASE_URL;
  if (explicitBase) return trimTrailingSlash(explicitBase);

  if (target === 'local') {
    return trimTrailingSlash(process.env.OPS_SMOKE_LOCAL_BASE_URL || 'http://127.0.0.1:54321/functions/v1');
  }

  const remoteBase = process.env.OPS_SMOKE_REMOTE_BASE_URL;
  if (remoteBase) return trimTrailingSlash(remoteBase);

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('[CONFIG_ERROR] remote target requires OPS_SMOKE_REMOTE_BASE_URL or SUPABASE_URL');
    process.exit(2);
  }

  return `${trimTrailingSlash(supabaseUrl)}/functions/v1`;
}

async function runCheck(check) {
  const url = `${baseUrl}/${check.path.replace(/^\/+/, '')}`;
  const attempts = RETRIES + 1;
  let lastStatus = 'ERR';
  let lastLatency = 0;
  let lastError = '';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const start = Date.now();

    try {
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: check.headers || {},
      });

      const latency = Date.now() - start;
      lastStatus = String(response.status);
      lastLatency = latency;

      const pass = response.ok;
      console.log(`[${pass ? 'PASS' : 'FAIL'}] endpoint=${check.name} critical=${check.critical} status=${response.status} latency_ms=${latency} attempt=${attempt}`);

      if (pass) {
        return { pass: true };
      }
    } catch (error) {
      const latency = Date.now() - start;
      lastStatus = 'ERR';
      lastLatency = latency;
      lastError = sanitizeError(error);
      console.log(`[FAIL] endpoint=${check.name} critical=${check.critical} status=ERR latency_ms=${latency} attempt=${attempt} error=${lastError}`);
    }

    if (attempt < attempts) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  console.log(`[FAIL_FINAL] endpoint=${check.name} critical=${check.critical} status=${lastStatus} latency_ms=${lastLatency} attempts=${attempts}${lastError ? ` error=${lastError}` : ''}`);
  return { pass: false };
}

async function fetchWithTimeout(url, init) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function sanitizeError(error) {
  if (error instanceof Error) {
    const message = `${error.name}:${error.message}`.replace(/\s+/g, ' ').trim();
    return message.slice(0, 120);
  }
  return 'unknown_error';
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function buildApiProveedorHeaders(secret, authorization) {
  const headers = {};
  if (secret) headers['x-api-secret'] = secret;
  if (authorization) headers.Authorization = authorization;
  return headers;
}

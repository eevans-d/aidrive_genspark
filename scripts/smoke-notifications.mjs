#!/usr/bin/env node
/**
 * Smoke test seguro (read-only) para Edge Function `cron-notifications`.
 *
 * Endpoints llamados:
 *   GET /functions/v1/cron-notifications/channels
 *   GET /functions/v1/cron-notifications/templates
 *
 * Lee `.env.test` (no commiteado) para:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *
 * Seguridad:
 * - No imprime tokens/keys ni payloads completos.
 * - Solo status HTTP + resumen estructural (keys/length).
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
  return clean.slice(0, max) + '…';
}

async function fetchAndSummarize(url, headers) {
  const res = await fetch(url, { method: 'GET', headers });
  const contentType = res.headers.get('content-type') || '';
  const rawBody = await res.text().catch(() => '');

  let summary = { type: 'text', length: rawBody.length };
  if (contentType.includes('application/json')) {
    try {
      const parsed = rawBody ? JSON.parse(rawBody) : null;
      summary = summarizeJson(parsed);
    } catch {
      summary = { type: 'invalid_json' };
    }
  }

  return {
    ok: res.ok,
    status: res.status,
    contentType: contentType || 'unknown',
    summary,
    bodySnippet: res.ok ? '' : safeTruncate(rawBody),
  };
}

async function main() {
  loadDotEnvFile(path.resolve(process.cwd(), '.env.test'));

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!anonKey) missing.push('SUPABASE_ANON_KEY');
  if (missing.length) {
    console.error(`MISSING_ENV: ${missing.join(', ')}`);
    process.exit(2);
  }

  const headers = {
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
    Accept: 'application/json',
  };

  const base = new URL('/functions/v1/cron-notifications/', supabaseUrl);
  const channelsUrl = new URL('channels', base);
  const templatesUrl = new URL('templates', base);

  const channels = await fetchAndSummarize(channelsUrl.toString(), headers);
  console.log(`CHANNELS_STATUS: ${channels.status}`);
  console.log(`CHANNELS_CONTENT_TYPE: ${channels.contentType}`);
  console.log(`CHANNELS_BODY_SUMMARY: ${JSON.stringify(channels.summary)}`);
  if (!channels.ok) {
    console.log(`CHANNELS_BODY_SNIPPET: ${channels.bodySnippet}`);
  }

  const templates = await fetchAndSummarize(templatesUrl.toString(), headers);
  console.log(`TEMPLATES_STATUS: ${templates.status}`);
  console.log(`TEMPLATES_CONTENT_TYPE: ${templates.contentType}`);
  console.log(`TEMPLATES_BODY_SUMMARY: ${JSON.stringify(templates.summary)}`);
  if (!templates.ok) {
    console.log(`TEMPLATES_BODY_SNIPPET: ${templates.bodySnippet}`);
  }

  if (!channels.ok || !templates.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('UNEXPECTED_ERROR');
  console.error(err?.stack || String(err));
  process.exit(1);
});


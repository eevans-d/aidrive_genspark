#!/usr/bin/env node
/**
 * Send a deterministic smoke event to Sentry using a DSN (no secret output).
 *
 * DSN sources (priority):
 * 1) process.env.VITE_SENTRY_DSN
 * 2) minimarket-system/.env.production.local (VITE_SENTRY_DSN)
 *
 * Usage:
 *   node scripts/sentry-smoke-event.mjs
 *   node scripts/sentry-smoke-event.mjs --env production
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repoRoot = process.cwd();
const envArgIndex = process.argv.indexOf('--env');
const envName = envArgIndex >= 0 && process.argv[envArgIndex + 1]
  ? process.argv[envArgIndex + 1]
  : 'production';

function readDsnFromEnvFile() {
  const envFile = path.join(repoRoot, 'minimarket-system', '.env.production.local');
  if (!fs.existsSync(envFile)) return null;
  const content = fs.readFileSync(envFile, 'utf8');
  const line = content.split('\n').find((l) => l.startsWith('VITE_SENTRY_DSN='));
  if (!line) return null;
  return line.slice('VITE_SENTRY_DSN='.length).trim();
}

const dsn = process.env.VITE_SENTRY_DSN || readDsnFromEnvFile();
if (!dsn) {
  console.error('ERROR: missing VITE_SENTRY_DSN (env or minimarket-system/.env.production.local)');
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(dsn);
} catch {
  console.error('ERROR: invalid DSN format');
  process.exit(1);
}

const projectId = parsed.pathname.replace(/^\//, '');
if (!projectId || !parsed.username) {
  console.error('ERROR: DSN missing project id or public key');
  process.exit(1);
}

const eventId = crypto.randomBytes(16).toString('hex');
const message = `SENTRY_TERMINAL_SMOKE_${Date.now()}`;
const envelopeUrl = `${parsed.protocol}//${parsed.host}/api/${projectId}/envelope/`;

const envelopeHeader = JSON.stringify({
  event_id: eventId,
  sent_at: new Date().toISOString(),
  dsn,
});

const itemHeader = JSON.stringify({ type: 'event' });
const payload = JSON.stringify({
  event_id: eventId,
  platform: 'javascript',
  environment: envName,
  level: 'error',
  message,
  timestamp: Date.now() / 1000,
  tags: {
    source: 'terminal-smoke',
    repo: 'aidrive_genspark',
  },
  extra: {
    smoke: true,
    actor: 'codex',
  },
  exception: {
    values: [
      {
        type: 'SmokeError',
        value: message,
      },
    ],
  },
});

const envelope = `${envelopeHeader}\n${itemHeader}\n${payload}`;

const response = await fetch(envelopeUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-sentry-envelope',
  },
  body: envelope,
});

console.log(`SENTRY_SMOKE_STATUS=${response.status}`);
console.log(`SENTRY_SMOKE_EVENT_ID=${eventId}`);
console.log(`SENTRY_SMOKE_ENV=${envName}`);
console.log(`SENTRY_SMOKE_HOST=${parsed.host}`);
if (!response.ok) {
  const text = await response.text();
  console.log(`SENTRY_SMOKE_ERROR=${text.slice(0, 200)}`);
  process.exit(2);
}

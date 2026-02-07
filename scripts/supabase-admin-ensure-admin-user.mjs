#!/usr/bin/env node
/**
 * Ensure a Supabase Auth admin user exists and is usable for API tests.
 *
 * Reads local `.env.test` (gitignored) for:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   TEST_USER_ADMIN
 *   TEST_PASSWORD
 *
 * Actions (via Auth Admin API):
 * - Creates the user if missing (email_confirm: true)
 * - Sets/merges `app_metadata.role = "admin"`
 * - Resets password to TEST_PASSWORD (so local env stays the source of truth)
 *
 * Security:
 * - Does NOT print secrets (passwords, tokens, keys).
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

function safeTruncate(text, max = 400) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max) + '…';
}

async function supabaseFetch(url, { serviceRoleKey, ...init }) {
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
    },
  });
}

async function main() {
  loadDotEnvFile(path.resolve(process.cwd(), '.env.test'));

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.TEST_USER_ADMIN;
  const adminPassword = process.env.TEST_PASSWORD;

  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!adminEmail) missing.push('TEST_USER_ADMIN');
  if (!adminPassword) missing.push('TEST_PASSWORD');
  if (missing.length) {
    console.error(`MISSING_ENV: ${missing.join(', ')}`);
    process.exit(2);
  }

  // 1) List users (small project: page 1 is enough; but still handle pagination structure)
  const listUrl = new URL('/auth/v1/admin/users', supabaseUrl);
  listUrl.searchParams.set('page', '1');
  listUrl.searchParams.set('per_page', '200');

  const listRes = await supabaseFetch(listUrl.toString(), { method: 'GET', serviceRoleKey });
  if (!listRes.ok) {
    const text = await listRes.text().catch(() => '');
    console.error(`LIST_USERS_STATUS: ${listRes.status}`);
    console.error(`LIST_USERS_ERROR: ${safeTruncate(text)}`);
    process.exit(1);
  }

  const listJson = await listRes.json();
  const users = Array.isArray(listJson?.users) ? listJson.users : [];
  const existing = users.find((u) => (u?.email || '').toLowerCase() === adminEmail.toLowerCase());

  let userId = existing?.id || null;
  let existingAppMetadata = existing?.app_metadata || existing?.app_meta_data || null;

  // 2) Create user if missing
  if (!userId) {
    const createUrl = new URL('/auth/v1/admin/users', supabaseUrl);
    const createBody = {
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      app_metadata: { role: 'admin' },
    };

    const createRes = await supabaseFetch(createUrl.toString(), {
      method: 'POST',
      serviceRoleKey,
      body: JSON.stringify(createBody),
    });

    if (!createRes.ok) {
      const text = await createRes.text().catch(() => '');
      console.error(`CREATE_USER_STATUS: ${createRes.status}`);
      console.error(`CREATE_USER_ERROR: ${safeTruncate(text)}`);
      process.exit(1);
    }

    const created = await createRes.json();
    userId = created?.id || created?.user?.id || null;
    existingAppMetadata = created?.app_metadata || created?.user?.app_metadata || null;
  }

  if (!userId) {
    console.error('USER_ID: null (unexpected)');
    process.exit(1);
  }

  // 3) Update user: set password and ensure app_metadata.role="admin" (merge).
  const mergedAppMetadata =
    existingAppMetadata && typeof existingAppMetadata === 'object'
      ? { ...existingAppMetadata, role: 'admin' }
      : { role: 'admin' };

  const updateUrl = new URL(`/auth/v1/admin/users/${userId}`, supabaseUrl);
  const updateBody = {
    password: adminPassword,
    email_confirm: true,
    app_metadata: mergedAppMetadata,
  };

  const updateRes = await supabaseFetch(updateUrl.toString(), {
    method: 'PUT',
    serviceRoleKey,
    body: JSON.stringify(updateBody),
  });

  if (!updateRes.ok) {
    const text = await updateRes.text().catch(() => '');
    console.error(`UPDATE_USER_STATUS: ${updateRes.status}`);
    console.error(`UPDATE_USER_ERROR: ${safeTruncate(text)}`);
    process.exit(1);
  }

  console.log('ADMIN_USER_READY: yes');
  console.log(`ADMIN_EMAIL: ${adminEmail}`);
  console.log(`ADMIN_USER_ID: ${userId}`);
  console.log('APP_METADATA_ROLE: admin');
}

main().catch((err) => {
  console.error('UNEXPECTED_ERROR');
  console.error(err?.stack || String(err));
  process.exit(1);
});


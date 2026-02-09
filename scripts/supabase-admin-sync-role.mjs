#!/usr/bin/env node
/**
 * Sincronizar rol de un usuario entre auth.users.app_metadata y public.personal.
 *
 * Uso:
 *   node scripts/supabase-admin-sync-role.mjs <email> <rol>
 *
 * Roles validos: admin, deposito, ventas, usuario
 *
 * Lee `.env.test` (gitignored) para obtener:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Acciones:
 * 1. Busca el usuario en auth.users por email.
 * 2. Actualiza auth.users.app_metadata.role con el rol indicado (Admin API).
 * 3. Upsert en public.personal: establece rol y activo=true.
 *
 * Seguridad:
 * - No imprime secretos (passwords, tokens, keys).
 * - Requiere SUPABASE_SERVICE_ROLE_KEY (no debe ejecutarse en frontend).
 */

import fs from 'node:fs';
import path from 'node:path';

const VALID_ROLES = ['admin', 'deposito', 'ventas', 'usuario'];

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
  return clean.slice(0, max) + '...';
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
  // Parse CLI args
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Uso: node scripts/supabase-admin-sync-role.mjs <email> <rol>');
    console.error(`Roles validos: ${VALID_ROLES.join(', ')}`);
    process.exit(2);
  }

  const email = args[0].toLowerCase().trim();
  const rol = args[1].toLowerCase().trim();

  if (!email.includes('@')) {
    console.error(`EMAIL_INVALIDO: ${email}`);
    process.exit(2);
  }
  if (!VALID_ROLES.includes(rol)) {
    console.error(`ROL_INVALIDO: ${rol}. Validos: ${VALID_ROLES.join(', ')}`);
    process.exit(2);
  }

  // Load env
  loadDotEnvFile(path.resolve(process.cwd(), '.env.test'));

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.error(`MISSING_ENV: ${missing.join(', ')}`);
    process.exit(2);
  }

  // 1) Find user by email
  console.log(`Buscando usuario: ${email}`);

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
  const existing = users.find((u) => (u?.email || '').toLowerCase() === email);

  if (!existing) {
    console.error(`USUARIO_NO_ENCONTRADO: ${email}`);
    console.error('El usuario debe existir en auth.users. Creelo primero con signup o Admin API.');
    process.exit(1);
  }

  const userId = existing.id;
  const existingAppMetadata = existing.app_metadata || {};
  const currentRole = existingAppMetadata.role || '(sin rol)';

  console.log(`Usuario encontrado: ${userId}`);
  console.log(`Rol actual en app_metadata: ${currentRole}`);

  // 2) Update auth.users.app_metadata.role
  console.log(`Actualizando app_metadata.role -> ${rol}`);

  const mergedAppMetadata = { ...existingAppMetadata, role: rol };
  const updateUrl = new URL(`/auth/v1/admin/users/${userId}`, supabaseUrl);

  const updateRes = await supabaseFetch(updateUrl.toString(), {
    method: 'PUT',
    serviceRoleKey,
    body: JSON.stringify({ app_metadata: mergedAppMetadata }),
  });

  if (!updateRes.ok) {
    const text = await updateRes.text().catch(() => '');
    console.error(`UPDATE_AUTH_STATUS: ${updateRes.status}`);
    console.error(`UPDATE_AUTH_ERROR: ${safeTruncate(text)}`);
    process.exit(1);
  }

  console.log('app_metadata.role actualizado OK');

  // 3) Upsert in public.personal via PostgREST
  console.log(`Upsert en public.personal: user_auth_id=${userId}, rol=${rol}, activo=true`);

  const personalUrl = new URL('/rest/v1/personal', supabaseUrl);
  // PostgREST upsert: on_conflict=user_auth_id (requires Prefer: resolution=merge-duplicates)
  personalUrl.searchParams.set('on_conflict', 'user_auth_id');

  const personalRes = await supabaseFetch(personalUrl.toString(), {
    serviceRoleKey,
    method: 'POST',
    headers: {
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      user_auth_id: userId,
      nombre: existing.user_metadata?.nombre || existing.email?.split('@')[0] || 'Usuario',
      email: email,
      rol: rol,
      activo: true,
    }),
  });

  if (!personalRes.ok) {
    const text = await personalRes.text().catch(() => '');
    console.error(`UPSERT_PERSONAL_STATUS: ${personalRes.status}`);
    console.error(`UPSERT_PERSONAL_ERROR: ${safeTruncate(text)}`);
    console.error('NOTA: Es posible que la tabla personal no tenga unique constraint en user_auth_id.');
    console.error('Si falla, verificar schema de public.personal.');
    process.exit(1);
  }

  const personalData = await personalRes.json().catch(() => null);

  console.log('');
  console.log('=== SINCRONIZACION COMPLETADA ===');
  console.log(`EMAIL: ${email}`);
  console.log(`USER_ID: ${userId}`);
  console.log(`ROL_AUTH: ${rol} (app_metadata.role)`);
  console.log(`ROL_PERSONAL: ${rol} (public.personal.rol)`);
  console.log(`ACTIVO: true`);
  if (personalData && Array.isArray(personalData) && personalData[0]?.id) {
    console.log(`PERSONAL_ID: ${personalData[0].id}`);
  }
}

main().catch((err) => {
  console.error('UNEXPECTED_ERROR');
  console.error(err?.stack || String(err));
  process.exit(1);
});

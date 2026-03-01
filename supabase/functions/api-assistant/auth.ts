/**
 * Auth utilities for api-assistant.
 * Pure helpers (no Deno runtime dependencies) so they can be unit-tested.
 */

type RawRole = unknown;

function normalizeRole(rawRole: RawRole): string {
  if (typeof rawRole !== 'string') return 'usuario';

  const role = rawRole.toLowerCase().trim();
  if (role === 'jefe' || role === 'administrador' || role === 'administrator') return 'admin';
  if (role === 'depósito' || role === 'warehouse') return 'deposito';
  if (role === 'vendedor' || role === 'sales') return 'ventas';

  return role || 'usuario';
}

/**
 * Trusted source is app_metadata.role (server-side managed).
 * user_metadata is intentionally ignored for authorization decisions.
 */
export function extractTrustedRole(userData: Record<string, unknown>): string {
  const appMetadata = userData.app_metadata as Record<string, unknown> | undefined;
  return normalizeRole(appMetadata?.role);
}


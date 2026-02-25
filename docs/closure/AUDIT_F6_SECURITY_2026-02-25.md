# AUDIT_F6_SECURITY_2026-02-25

## Objetivo
Validar seguridad base: secretos hardcodeados, auth/authz, CORS, guardrails de Edge Functions y superficie de dependencias.

## Comandos ejecutados
```bash
rg -n "AIza[0-9A-Za-z_-]{20,}|sk_live_[0-9A-Za-z]+|sk_test_[0-9A-Za-z]+|xox[baprs]-[0-9A-Za-z-]+|-----BEGIN( RSA)? PRIVATE KEY-----|SUPABASE_SERVICE_ROLE_KEY\\s*=\\s*['\"][^'\"]+['\"]|GCV_API_KEY\\s*=\\s*['\"][^'\"]+['\"]|API_PROVEEDOR_SECRET\\s*=\\s*['\"][^'\"]+['\"]" .
rg -n "validateOrigin|CORS_ORIGIN_REQUIRED|CORS_ORIGIN_NOT_ALLOWED|REQUIRE_ORIGIN" supabase/functions/api-minimarket/index.ts supabase/functions/api-proveedor/index.ts
nl -ba supabase/functions/_shared/internal-auth.ts | sed -n '1,140p'
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json
pnpm -C minimarket-system audit --prod --audit-level=high
nl -ba scripts/run-e2e-tests.sh | sed -n '100,130p'
nl -ba scripts/run-integration-tests.sh | sed -n '104,130p'
```

## Salida relevante
- Secret scan:
  - Sin hardcoded secrets de producción detectados.
  - Coincidencias en scripts de prueba local por fallback explícito `API_PROVEEDOR_SECRET` (valor de testing local, no productivo).
- CORS y origen:
  - `validateOrigin` + bloqueos explícitos activos (`supabase/functions/api-minimarket/index.ts:165`, `:185`, `:198`).
  - `REQUIRE_ORIGIN` soportado (`api-minimarket/index.ts:173`, `api-proveedor/index.ts:253`).
- Auth interna endpoints sensibles:
  - `requireServiceRoleAuth` aplicado en cron/backfill/OCR (`supabase/functions/_shared/internal-auth.ts`, cron/backfill/ocr).
- Guardrail verify_jwt remoto:
  - `api-minimarket` mantiene `verify_jwt=false`.
  - resto de funciones `verify_jwt=true`.
- Dependencias productivas:
  - persisten `3 high + 2 moderate` (reaplican A-001/A-002).

## Conclusión F6
No se detectaron secretos de producción hardcodeados ni fallas críticas de auth/authz/CORS. Riesgo de seguridad principal permanece en dependencias frontend vulnerables.

## Hallazgos F6
| ID | Severidad | Archivo:Linea | Hallazgo | Acción |
|---|---|---|---|---|
| A-001 | ALTO | `minimarket-system/package.json:102` | Vulnerabilidad en cadena `react-router-dom` (runtime frontend) | Remediar dependencia y reauditar |
| A-002 | ALTO | `minimarket-system/package.json:108` | Vulnerabilidad en cadena `vite-plugin-pwa/workbox/minimatch` | Remediar dependencia y reauditar |
| A-010 | BAJO | `scripts/run-e2e-tests.sh:116` | Fallback hardcodeado de secreto de testing local (`API_PROVEEDOR_SECRET`) duplicado también en integración | Reemplazar por generación efímera en runtime o variable obligatoria de test |

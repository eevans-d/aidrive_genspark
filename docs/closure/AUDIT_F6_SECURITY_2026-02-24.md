# AUDIT_F6_SECURITY_2026-02-24

## Objetivo
Validar baseline de seguridad: secretos, auth/authz, CORS, guardrails de Edge Functions y vulnerabilidades.

## Comandos ejecutados
```bash
rg -n --hidden -g '!**/node_modules/**' -g '!**/dist/**' -e "AKIA[0-9A-Z]{16}" -e "AIza[0-9A-Za-z_-]{35}" -e "-----BEGIN (RSA|EC|OPENSSH|DSA|PGP) PRIVATE KEY-----" -e "xox[baprs]-[0-9A-Za-z-]{10,}" -e "sk_live_[0-9a-zA-Z]{20,}" .
rg -n "validateOrigin|CORS_ORIGIN_REQUIRED|CORS_ORIGIN_NOT_ALLOWED" supabase/functions/api-minimarket/index.ts
nl -ba supabase/functions/_shared/internal-auth.ts | sed -n '26,67p'
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[] | "\(.name)\tv\(.version)\tverify_jwt=\(.verify_jwt)"' | sort
pnpm -C minimarket-system audit --prod --audit-level=high
```

## Salida relevante
- Secret scan por patrones fuertes: sin coincidencias.
- CORS gateway endurecido:
  - `validateOrigin` (`supabase/functions/api-minimarket/index.ts:165`)
  - bloqueos `CORS_ORIGIN_REQUIRED`/`CORS_ORIGIN_NOT_ALLOWED` (`:185`, `:198`).
- Auth interna para cron/ocr/backfill:
  - `requireServiceRoleAuth` (`supabase/functions/_shared/internal-auth.ts:30-67`).
- Guardrail `verify_jwt`:
  - `api-minimarket v38 verify_jwt=false` (cumple regla).
  - resto de funciones `verify_jwt=true`.
- Dependencias prod frontend: persisten 3 high + 2 moderate (ver F4).

## Conclusión F6
No se detectan secretos hardcodeados ni fallas críticas de auth/authz/CORS en endpoints sensibles. Riesgo abierto en dependencias frontend productivas (A-001/A-002).

## Hallazgos F6
- Reaplica A-001 (ALTO) y A-002 (ALTO) por impacto directo de seguridad en runtime frontend.

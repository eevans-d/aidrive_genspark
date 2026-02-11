# EVIDENCIA SP-E — Producción

> Fecha: 2026-02-11
> Commit: `3b1a8b0`
> Ejecutor: Antigravity (Gemini) + Codex (revalidación final)

---

## E2 — VARIABLES DE ENTORNO Y SECRETS

### Inventario completo de env vars/secrets (SOLO NOMBRES)

#### Edge Functions (backend)

| Secret/Var (NOMBRE) | Donde se configura | Documentado | Usado por | Estado | Evidencia |
|---------------------|-------------------|-------------|-----------|--------|-----------|
| `SUPABASE_URL` | Supabase auto-inject | Sí | 11/13 funciones | ✅ OK | Auto-provisioned por Supabase |
| `SUPABASE_ANON_KEY` | Supabase auto-inject | Sí | api-minimarket, api-proveedor | ✅ OK | Auto-provisioned |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase auto-inject | Sí | 11/13 funciones | ✅ OK | Auto-provisioned |
| `ALLOWED_ORIGINS` | Supabase Secrets | Sí (SECRETOS_REQUERIDOS) | api-minimarket, api-proveedor, notificaciones-tareas | ⚠️ Verificar | ¿Configurado para dominio producción o localhost? |
| `REQUIRE_ORIGIN` | Supabase Secrets | No documentado | api-minimarket, api-proveedor | ⚠️ No documentado | Grep en index.ts |
| `API_PROVEEDOR_SECRET` | Supabase Secrets | Sí | api-proveedor | ⚠️ Rotación pendiente | SECRET_ROTATION_PLAN.md |
| `API_PROVEEDOR_READ_MODE` | Supabase Secrets | No documentado | api-proveedor | ⚠️ No documentado | api-proveedor/index.ts L183 |
| `INTERNAL_ORIGINS_ALLOWLIST` | Supabase Secrets | No documentado | api-proveedor | ⚠️ No documentado | api-proveedor/utils/auth.ts L82 |
| `ENVIRONMENT` | Supabase Secrets | No documentado | cron-notifications | ⚠️ No documentado | cron-notifications/index.ts L23 |
| `NOTIFICATIONS_MODE` | Supabase Secrets | No documentado | cron-notifications | ⚠️ No documentado | Default='simulation'. L26 |
| `SMTP_HOST` | Supabase Secrets | No documentado | cron-notifications | ⚠️ No documentado | Default='smtp.gmail.com'. L492 |
| `SMTP_PORT` | Supabase Secrets | No documentado | cron-notifications | ⚠️ No documentado | Default=587. L493 |
| `SMTP_USER` | Supabase Secrets | No documentado | cron-notifications | ⚠️ No documentado | Default=''. L494 |
| `SMTP_PASS` | Supabase Secrets | No documentado | cron-notifications | ⚠️ No documentado | Default=''. L495 |
| `SMTP_FROM` | Supabase Secrets | No documentado | cron-notifications | ⚠️ Mismatch con EMAIL_FROM | Fallback chain: SMTP_FROM → EMAIL_FROM → noreply@. L496 |
| `EMAIL_FROM` | Supabase Secrets | No documentado | cron-notifications (fallback) | ⚠️ Mismatch con SMTP_FROM | L496 |
| `TWILIO_ACCOUNT_SID` | Supabase Secrets | No documentado | cron-notifications | ⚠️ No documentado | L511 |
| `TWILIO_AUTH_TOKEN` | Supabase Secrets | No documentado | cron-notifications | ⚠️ No documentado | L512 |
| `TWILIO_FROM_NUMBER` | Supabase Secrets | No documentado | cron-notifications | ⚠️ No documentado | Default='+1234567890'. L513 |
| `SLACK_WEBHOOK_URL` | Supabase Secrets | No documentado | cron-notifications | ⚠️ No documentado | L527 |
| `TEST_ENVIRONMENT` | Supabase Secrets | No documentado | cron-testing-suite | N/A (dev-only) | L1319 |

#### Frontend (VITE_*)

| Var (NOMBRE) | Donde se configura | Documentado | Usado por | Estado | Evidencia |
|-------------|-------------------|-------------|-----------|--------|-----------|
| `VITE_SUPABASE_URL` | .env / CI | Sí | supabase.ts | ⚠️ CI usa placeholder | .env.example; CI sin secret real |
| `VITE_SUPABASE_ANON_KEY` | .env / CI | Sí | supabase.ts | ⚠️ CI usa placeholder | .env.example; CI sin secret real |
| `VITE_API_GATEWAY_URL` | .env / CI | Parcial (en SECRETOS_REQUERIDOS, falta en OBTENER_SECRETOS) | apiClient.ts L8 | ⚠️ Falta en docs | Fallback a '/api-minimarket' |
| `VITE_USE_MOCKS` | .env | No documentado como var de producción | apiClient.ts L9, supabase.ts L7 | ⚠️ Debe estar OFF en prod | Solo afecta tareasApi |
| `VITE_SENTRY_DSN` | .env | Sí (SENTRY_INTEGRATION_PLAN) | observability.ts L152 | ❌ BLOCKED | Sin DSN real |
| `VITE_BUILD_ID` | CI / .env | No documentado | observability.ts L63 | ⚠️ No documentado | Default='dev' |

### Resumen E2

| Métrica | Valor |
|---------|-------|
| Total env vars/secrets identificados | ~27 |
| Documentados correctamente | 7 |
| No documentados en guías de secretos | 15 |
| Con mismatch/inconsistencia | 2 (SMTP_FROM/EMAIL_FROM, VITE_API_GATEWAY_URL) |
| BLOCKED | 1 (VITE_SENTRY_DSN) |

---

## E1 — CHECKLIST DE DESPLIEGUE

### Pre-deploy

| Check | Comando/acción | Estado | Notas | Evidencia |
|-------|---------------|--------|-------|-----------|
| Unit tests pasan | `npx vitest run tests/unit/` | ✅ **PASS** | 46 archivos, 812 tests, 0 fallos, 21.57s | Execution Log baseline |
| Frontend lint | `pnpm -C minimarket-system lint` | ✅ **PASS** | 0 errores ESLint | Execution Log baseline |
| Frontend build | `pnpm -C minimarket-system build` | ✅ **PASS** | 9.90s, 27 entradas PWA precache | Execution Log baseline |
| TypeScript check | `pnpm -C minimarket-system exec tsc --noEmit` | ✅ **PASS** | Ejecutado en 2026-02-11, sin errores de compilación TS | Revalidación Codex SP-E |
| Edge Functions syntax | `deno check --no-lock` × 13 | BLOCKED | `deno` no está disponible en PATH de este host (`deno: command not found`) | Revalidación Codex SP-E |
| Sin console.log debug | Grep console.log | ✅ **PASS** | No hay `console.log` de debug en paths críticos de deploy. `console.error` en `Pedidos.tsx` queda como logging controlado y convive con `toast.error` (HC-3 mitigado). | Revalidación Codex SP-E |
| Sin secrets hardcodeados | Grep `eyJ\|sk_\|SG.` | ✅ **PASS** | 0 resultados en todo el codebase | Grep ejecutado |
| CI pipeline | GitHub Actions ci.yml | ⚠️ **PARCIAL** | 6/6 jobs obligatorios. Suites legacy en job opcional (`workflow_dispatch` + `run_legacy`) con `continue-on-error`. | SP-A A3 |

### Supabase producción

| Check | Estado | Notas | Evidencia |
|-------|--------|-------|-----------|
| 36 migraciones aplicadas | ✅ **PASS** | `20260211100000_audit_rls_new_tables.sql` aplicada en remoto. Local=remoto `36/36`. | `supabase db push --linked` + `supabase migration list --linked` (2026-02-11) |
| RLS habilitado | ⚠️ **PARCIAL** | La migración `20260211100000` habilita RLS y valida (a) al menos 1 policy por tabla y (b) sin grants `anon` en `pedidos/clientes/ventas/ofertas_stock/bitacora_turnos`. Falta validación funcional fina por regla de negocio/rol. | SQL migración + push exitoso |
| 13 Edge Functions ACTIVE | ✅ **PASS** | 13/13 ACTIVE confirmadas remotamente (v20/v12/v11/v10). | Execution Log: `supabase functions list` |
| api-minimarket verify_jwt=false | ✅ **PASS** | `deploy.sh` actualizado: usa `--no-verify-jwt` para `api-minimarket`. | `deploy.sh` verificado |
| HC-1 fix: 3 cron jobs auth | ✅ **PASS** | DDL aplicado en remoto (`20260211055140`), 4 jobs con Authorization. Vault pattern implementado (`20260211062617`): `service_role_key` en `vault.decrypted_secrets`. Test E2E: `CALL alertas_stock_38c42a40()` → HTTP 200. | migration + vault + E2E test |
| 6 cron jobs configurados | ✅ **PASS** | 4/4 jobs objetivo activos en remoto (`alertas-stock`, `notificaciones-tareas`, `reportes-automaticos`, `maintenance_cleanup`). Vault auth funcional. Test E2E: HTTP 200. | verificación remota + E2E |
| Secrets obligatorios | ⚠️ **PARCIAL** | `supabase secrets list --output json` confirma 13 secrets backend por nombre. Frontend/CI (`VITE_*`, `TEST_USER_*`) no verificables desde CLI. | Revalidación Codex SP-E |
| ALLOWED_ORIGINS producción | ✅ **PASS** | Secret actualizado en Supabase. Con `Origin: https://aidrive-genspark.vercel.app` devuelve `HTTP 200` + `Access-Control-Allow-Origin` correcto. Origen no permitido devuelve `HTTP 403` + `Allow-Origin: null`. | `supabase secrets set ALLOWED_ORIGINS=...` + `bash scripts/verify-cors.sh` (2026-02-11) |

### Frontend hosting

| Check | Estado | Notas | Evidencia |
|-------|--------|-------|-----------|
| VITE_SUPABASE_URL | ⚠️ | Requiere configurar para producción. CI actualmente usa placeholder. | .env + CI config |
| VITE_SUPABASE_ANON_KEY | ⚠️ | Idem | .env + CI config |
| VITE_API_GATEWAY_URL | ⚠️ | Falta en OBTENER_SECRETOS. Fallback a `/api-minimarket`. Funciona si mismo dominio. | apiClient.ts L8 |
| HTTPS | BLOCKED | Requiere hosting configurado | — |
| SPA redirect | BLOCKED | Requiere hosting configurado | — |

### Post-deploy verificación

| Check | Estado | Evidencia |
|-------|--------|-----------|
| Login funciona | BLOCKED | Sin runtime |
| Dashboard carga | BLOCKED | Sin runtime |
| CRUD Stock | BLOCKED | Sin runtime |
| POS venta completa | BLOCKED | Sin runtime |
| Cron ejecuta | BLOCKED | Sin runtime |
| 13 rutas accesibles | ✅ **PASS** (estático) | App.tsx: 13 rutas definidas con ProtectedRoute |

### Resumen E1

| Categoría | PASS | PARCIAL | FAIL | BLOCKED |
|-----------|------|---------|------|---------|
| Pre-deploy | 5 | 2 | 0 | 1 |
| Supabase | 6 | 2 | 0 | 0 |
| Frontend hosting | 0 | 3 | 0 | 2 |
| Post-deploy | 1 | 0 | 0 | 5 |
| **TOTAL** | **12** | **7** | **0** | **8** |

---

## E3 — LOGGING Y MONITOREO

| Canal | Configurado | Funcional | Cobertura | Acción | Evidencia |
|-------|------------|-----------|-----------|--------|-----------|
| **_shared/logger.ts** | ✅ Sí | ✅ Sí | 13/13 funciones (100%) | PASS — cobertura completa | Cada función importa logger |
| **Edge Function logs (Supabase)** | ✅ Sí | ⚠️ (requiere acceso dashboard) | Todas las funciones | Verificar formato y retención | Supabase native logging |
| **cron_jobs_execution_log** | ✅ Sí | ⚠️ Parcial | Jobs que usan orchestrator | Rotación semanal programada vía `maintenance_cleanup`, falta confirmar ejecución recurrente en runtime. | `20260211055140` + cron schedule |
| **Sentry** | ❌ No | ❌ No | Frontend (ErrorBoundary + observability.ts preparados) | **BLOCKED**: sin DSN real. Infraestructura local: localStorage max 50 errores. | observability.ts; SENTRY_INTEGRATION_PLAN.md |
| **SendGrid email** | ❌ No | ❌ No | cron-notifications | **BLOCKED**: sender verification pendiente. Modo simulación. | ESTADO_ACTUAL |
| **Slack Webhook** | ❌ No | ❌ No | cron-notifications | `SLACK_WEBHOOK_URL` no configurado | cron-notifications/index.ts L527 |
| **Push notifications** | ❌ No | ❌ No | — | No implementado | — |
| **Health checks (api-minimarket /health)** | ✅ Endpoint existe | ⚠️ Parcial | api-minimarket | Endpoint responde 200. CORS productivo ya corregido, pero aún no hay monitoreo externo continuo activo (UptimeRobot/Better Stack). | `curl -I` + `scripts/verify-cors.sh` |
| **cron-health-monitor** | ✅ Código existe | ❌ Sin trigger | 1 función | Huérfana — potencialmente útil con cron | Sin cron schedule |
| **Backup DB** | ✅ Script existe | ⚠️ Manual | `scripts/db-backup.sh` | Script de `pg_dump` creado. Procedimiento de restore documentado. | scripts/db-backup.sh; OPERATIONS_RUNBOOK.md |

### Resumen E3

**RESULTADO: NO hay canal de alerta real en producción.** El sistema registra logs internamente (logger.ts + Supabase native), pero:
- Sin Sentry → sin visibilidad de errores frontend
- Sin email → sin alertas al operador
- Sin Slack → sin alertas al equipo dev
- Sin push → sin notificaciones al operador

**Canal mínimo requerido para MVP:** Al menos UptimeRobot (gratuito) + Sentry free tier.

### Revalidación Codex SP-E (2026-02-11, pasada final)

Checks ejecutados para reducir `BLOCKED`:
- `pnpm -C minimarket-system lint` -> PASS.
- `pnpm -C minimarket-system build` -> PASS.
- `supabase db push --linked` -> aplicada `20260211100000_audit_rls_new_tables.sql`.
- `supabase migration list --linked` -> local=remoto `36/36`.
- `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json` -> 13/13 ACTIVE.
- `supabase secrets set ALLOWED_ORIGINS=... --project-ref dqaygmjpzoqjjrywdsxi` -> secret actualizado.
- `bash scripts/verify-cors.sh` -> PASS (origen permitido 200 + bloqueado 403/null).
- `curl -I -H "Origin: https://aidrive-genspark.vercel.app" .../health` -> `200` + `Access-Control-Allow-Origin` correcto.

Resultado de la pasada final SP-E:
- Se mantiene reducción de `BLOCKED` en E1 a **8**.
- Se confirma mejora en cron/Vault, UX POS y CORS productivo.
- Se elimina el drift de migraciones (`36/36` alineado).
- Riesgos de producción restantes: monitoreo real (Gate 16), hardening de CI legacy (Gate 18) y validación RLS por reglas de negocio.

---

## E4 — ROLLBACK

| Componente | Rollback posible | Método | Tiempo est. | Riesgo data loss | Evidencia |
|-----------|-----------------|--------|------------|-----------------|-----------|
| **Migraciones SQL** | ⚠️ Parcial | Template transaccional en `ROLLBACK_SQL_TEMPLATE.md` (BEGIN/COMMIT). Ejemplo concreto: `ROLLBACK_20260116000000`. Verify: `verify_rollback.sql`. | ~15-30min por migración | MEDIO — migraciones con DROP sin backup son irreversibles | ROLLBACK_SQL_TEMPLATE.md; ROLLBACK_EVIDENCE_2026-01-29.md |
| **Edge Functions** | ✅ Sí | Supabase mantiene versiones → re-deploy a versión anterior | ~5min por función | BAJO | Supabase versioning |
| **Frontend** | ✅ Sí | CI genera artefacto `frontend-build` (7 días retención). Re-deploy del bundle anterior. | ~5min | BAJO | CI workflow artifacts |
| **Datos (BD)** | ❌ No | Free plan SIN PITR. No hay pg_dump periódico configurado. | N/A | **ALTO** — un error destructivo en BD no es reversible | Supabase Free plan: sin PITR. Sin backup manual documentado. |
| **Secrets** | ⚠️ Parcial | Plan en SECRET_ROTATION_PLAN.md. Rotación no ejecutada. | ~15min | BAJO | SECRET_ROTATION_PLAN.md |

### Resumen E4

| Riesgo | Componente |
|--------|-----------|
| **ALTO** | Datos BD — sin backup automatizado, sin PITR (Free plan) |
| **MEDIO** | Migraciones SQL — no todas son reversibles comprobadamente |
| **BAJO** | Edge Functions, Frontend, Secrets — tienen mecanismos de rollback |

---

## Addendum reconciliado (2026-02-11)

- HC-1 y Vault cron auth: **resuelto** (`20260211055140`, `20260211062617` aplicadas en remoto).
- RLS audit migration: **aplicada** (`20260211100000`), local=remoto `36/36`.
- CORS productivo: **resuelto** para `https://aidrive-genspark.vercel.app`; bloqueo de orígenes no permitidos confirmado.

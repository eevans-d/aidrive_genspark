# 🟢 ESTADO ACTUAL DEL PROYECTO
 
**Última actualización:** 2026-02-04  
**Estado:** ⚠️ OPERATIVO con pendientes críticos (bloquea cierre final)

**Cierre 2026-02-01 (confirmación usuario, histórico):**
- Leaked password protection habilitado en panel. **(Re-abierto por COMET 2026-02-02)**
- WARN residual del Security Advisor confirmado/resuelto. **(Re-abierto por COMET 2026-02-02; verificado 2026-02-04: WARN=1)**  
- Migración `20260131020000_security_advisor_mitigations.sql` validada en entornos no‑PROD.
- Secrets de CI (GitHub Actions) configurados.
- Revisión humana P0 completada.
- Backup/DR documentado y baseline performance k6 ejecutado.
- Documentación sincronizada y cerrada.
- **Ejecución de tests (2026-02-02):**
  - ✅ `npm run test:all` (unit + auxiliary) — reportes en `test-reports/junit.xml` y `test-reports/junit.auxiliary.xml`.
  - ✅ `npm run test:integration` — PASS (38 tests).
  - ✅ `npm run test:e2e` — PASS (4 tests smoke).
  - ✅ `pnpm run test:components` (frontend) — PASS.
  - ✅ `pnpm run test:e2e:frontend` — PASS con mocks (6 passed, 9 skipped: auth real + gateway).
  - **Nota:** `npm run test:integration`/`npm run test:e2e` se ejecutaron con `SUPABASE_URL` remoto desde `.env.test` (scripts ahora omiten `supabase start` en ese modo).
  - **Local Docker:** `supabase start` falla por `schema_migrations` duplicado en migraciones preexistentes del DB template; ver detalle en `docs/ESTADO_CIERRE_REAL_2026-02-01.md`.

**Revisión COMET (Supabase, 2026-02-02):**
- ❌ **Leaked Password Protection**: DESACTIVADO. **Bloqueado**: el toggle no aparece sin **SMTP personalizado** (no basta el SMTP por defecto de Supabase).
- ⚠️ **Security Advisor**: WARN=3 (search_path mutable en `public.sp_aplicar_precio` + vista materializada pública `tareas_metricas` + leaked password protection).
- ❌ **Migración pendiente en PROD**: `20260202000000` no aplicada (historial remoto contiene `20250101000000` y dos versiones 20260131034xxx no presentes localmente).
- ⚠️ **Políticas RLS**: COMET reporta **18** activas en tablas críticas (esperado 30 según docs previas) — requiere verificación.
- ✅ RLS en tablas críticas PASS; ✅ 13 Edge Functions; ✅ secretos críticos presentes.

**Corrección post‑COMET (2026-02-02):**
- ✅ Historial de migraciones reconciliado (placeholders locales para `20250101000000`, `20260131034034`, `20260131034328`).
- ✅ `20260202000000_version_sp_aplicar_precio.sql` aplicada en PROD (`supabase db push`).
- ✅ `supabase migration list --linked` confirma `20260202000000` en remoto.
- ✅ Mitigación aplicada en PROD (Antigravity 2026-02-02): `20260202083000_security_advisor_followup.sql`.
- ✅ API desplegada (Antigravity 2026-02-02): endpoint `/reportes/efectividad-tareas` actualizado y función `api-minimarket` desplegada.
- ⚠️ Evidencia pendiente (limitaciones de entorno Antigravity): verificación visual del Security Advisor.
- ⚠️ Test real del endpoint con JWT **intentado** (2026-02-02): **401 Invalid JWT** usando credenciales de `.env.test` → requiere revisar credenciales/usuario o configuración Auth.

**Actualización 2026-02-03 (local):**
- ✅ `pnpm lint` (frontend) — OK.
- ✅ `pnpm build` — OK (corrige TS2339 en `minimarket-system/src/lib/apiClient.ts`).
- ✅ `npx tsc --noEmit` — OK.
- ✅ `npm run test:unit` — PASS (689 tests, junit en `test-reports/junit.xml`).
- ✅ `npm run test:coverage` — PASS (lines 70.34%, v8).
- ✅ `deno check --no-lock supabase/functions/**/index.ts` — OK (con `deno.json` y `nodeModulesDir: "auto"`).
- ✅ `bash scripts/run-integration-tests.sh` — PASS (38 tests).
- ✅ `bash scripts/run-e2e-tests.sh` — PASS (4 tests smoke; junit en `test-reports/junit.e2e.xml`).

**Actualización 2026-02-03 (COMET - credenciales Supabase):**
- ✅ SUPABASE_URL / VITE_SUPABASE_URL **guardadas** en GitHub Secrets.
- ✅ SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY **guardadas** en GitHub Secrets.
- ✅ SUPABASE_SERVICE_ROLE_KEY **guardada** en GitHub Secrets (solo servidor).
- ✅ `.env.test` actualizado con valores disponibles (incluye `DATABASE_URL` y `API_PROVEEDOR_SECRET`).
- ✅ `DATABASE_URL` completa (password incluido) — guardada en GitHub Secrets y `.env.test`.
- ✅ `API_PROVEEDOR_SECRET` alineado (Supabase Secrets + GitHub Secrets + `.env.test`).
- ✅ `SENDGRID_API_KEY` y `SMTP_*` cargados en Supabase Secrets (Edge Functions).
- ✅ Usuarios Auth verificados (3) — JWT requiere contraseña (no visible en dashboard).
- ⚠️ SMTP personalizado (Auth) **pendiente** — configurar en panel con SendGrid y activar leaked password protection.

**Actualización 2026-02-04 (COMET - verificación panel):**
- ✅ **SMTP personalizado (Auth)**: **HABILITADO** y configurado con SendGrid.
  - Host: `smtp.sendgrid.net`
  - Port: `587`
  - User: `apikey`
  - From Email: `noreply@minimarket-system.com`
  - From Name: `Sistema MiniMarket`
- ⚠️ **Leaked Password Protection**: **NO DISPONIBLE** en el plan actual (COMET reporta que requiere plan Pro o superior).
  - **Decisión (usuario):** no upgrade por ahora; se activará al pasar a producción.
- ✅ **Security Advisor**: WARN=1, ERROR=0, INFO=15.  
  - WARN único: leaked password protection deshabilitada.
  - INFO: tablas con RLS habilitada sin políticas (no bloqueante si solo `service_role`).
- ✅ **RLS policies count (public)**: **33** (consulta en SQL Editor).
- ⚠️ **Endpoint** `/reportes/efectividad-tareas`: sin evidencia en logs/invocaciones; requiere JWT admin para prueba real.

**Pendientes críticos (bloquean cierre):**
1) **Leaked Password Protection**: pendiente por plan (**decisión actual: no upgrade hasta producción**).
2) Probar `/reportes/efectividad-tareas` con JWT real (confirmar 200 OK) — requiere JWT admin.
3) Confirmar licencia definitiva (**LICENSE** contiene placeholder `[OWNER PENDIENTE]`).

**Actualización 2026-01-30 (local):**
- Revisión Security Advisor pendiente en ese momento (resuelto 2026-02-01 por confirmación usuario); ejecución local bloqueada por falta de `DATABASE_URL` en `.env.test`. Ver `docs/SECURITY_ADVISOR_REVIEW_2026-01-30.md`.

**Actualización 2026-01-30 (COMET):**
- Snapshot ANTES confirmó RLS deshabilitado en `notificaciones_tareas` y `productos_faltantes`, y 0 policies para 6 tablas críticas.
- Remediación aplicada en STAGING: RLS habilitado en 6/6, revocado `anon`, políticas creadas para `personal`, `stock_deposito`, `movimientos_deposito`, `precios_historicos`.
- Snapshot DESPUÉS literal capturado (JSON traducido por UI).
- Auditoría RLS Lite detectó gaps P0: `productos`, `proveedores`, `categorias` sin policies y con grants `anon` reportados. Remediación pendiente (resuelta 2026-01-31). Ver `docs/SECURITY_ADVISOR_REVIEW_2026-01-30.md`.

**Actualización 2026-01-31 (GitHub Copilot MCP):**
- Auditoría RLS completa ejecutada con output crudo + remediación role-based.
- `anon` revocado en tablas críticas, 30 policies activas, RLS 10/10.
- Evidencia: `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`.
- Gaps P0 de `productos`, `proveedores`, `categorias` cerrados.
- Migración versionada aplicada en PROD y verificada (04:06–04:15 UTC): `supabase/migrations/20260131000000_rls_role_based_policies_v2.sql`.
- Security Advisor (PROD) mitigado: 5 ERROR y 5 WARN eliminadas; anon grants internos revocados (0). Quedaban 2 WARN (leaked password protection + 1 WARN residual) y 15 INFO (tablas internas sin policies) — **resuelto 2026-02-01 por confirmación usuario (histórico; re‑abierto 2026-02-02)**. Ver Parte 8 y Addendum en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`.
- Migración recomendada para mitigar Advisor: `supabase/migrations/20260131020000_security_advisor_mitigations.sql` (validada en no‑PROD por confirmación usuario 2026-02-01).
- Planificación consolidada en `docs/HOJA_RUTA_MADRE_2026-01-31.md` (planes antiguos retirados).

## 🎯 Proyecto Supabase

| Propiedad | Valor |
|-----------|-------|
| **Nombre** | minimarket-system |
| **Ref** | dqaygmjpzoqjjrywdsxi |
| **Región** | East US (North Virginia) |
| **URL** | https://dqaygmjpzoqjjrywdsxi.supabase.co |
| **Dashboard** | https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi |

> Nota: ref/URL provienen de `.env.*` y `supabase/.temp/project-ref`; estado del panel confirmado por usuario (2026-02-01).

### Edge Functions en repo (13)
| Función | En repo |
|---------|--------|
| api-minimarket | ✅ |
| api-proveedor | ✅ |
| alertas-stock | ✅ |
| alertas-vencimientos | ✅ |
| cron-dashboard | ✅ |
| cron-health-monitor | ✅ |
| cron-jobs-maxiconsumo | ✅ |
| cron-notifications | ✅ |
| cron-testing-suite | ✅ |
| notificaciones-tareas | ✅ |
| reportes-automaticos | ✅ |
| reposicion-sugerida | ✅ |
| scraper-maxiconsumo | ✅ |

> Nota: estado de despliegue y tamaños confirmados por usuario en panel (2026-02-01).

---

## 📊 Métricas de Código (Verificadas en repo)

> Conteos calculados por ocurrencias de `it/test` en archivos de tests. No implican ejecución.

### Backend (Supabase Edge Functions)
| Categoría | Cantidad | Detalle |
|-----------|----------|---------|
| Edge Functions | 13 | api-minimarket, api-proveedor, scraper, crons, alertas |
| Módulos Compartidos | 7 | `_shared/` (logger, response, errors, cors, audit, rate-limit, circuit-breaker) |
| **Tests Backend (unit)** | **682** | 35 archivos en `tests/unit` |

### Frontend (minimarket-system)
| Categoría | Cantidad | Detalle |
|-----------|----------|---------|
| Páginas | 9 | Dashboard, Login, Deposito, Kardex, Productos, etc. |
| Hooks Query | 8 | useDashboardStats, useProductos, useTareas, etc. |
| Componentes | 3 | Layout, ErrorBoundary, ErrorMessage |
| **Tests Frontend (unit)** | **40** | 12 archivos en `minimarket-system/src` |

### Totales (repo)
- **Tests unitarios:** 722 (Backend 682 + Frontend 40)
- **Tests integración:** 38 (tests/integration)
- **Tests seguridad:** 14 (tests/security)
- **Tests performance:** 5 (tests/performance)
- **Tests contratos API:** 10 (tests/api-contracts)
- **Tests E2E backend smoke:** 4 (solo `tests/e2e/*.smoke.test.ts`; `edge-functions.test.js` es legacy/no ejecuta)
- **Tests E2E frontend (Playwright):** 18 definidos (4 skip)
- **Tests E2E auth real (Playwright):** 10 definidos (2 skip) — incluido en el total anterior
- **Coverage (artefacto repo):** 69.91% lines (coverage/index.html)
- **Migraciones en repo:** 16 archivos en `supabase/migrations` (incluye placeholders de historial remoto)
- **Build frontend:** `minimarket-system/dist/` presente (artefacto, no revalidado)

---

## ✅ Features Implementados
- ✅ Scraper de precios Maxiconsumo
- ✅ API Gateway con rate limiting + circuit breaker
- ✅ Alertas de stock bajo y vencimientos
- ✅ Roles validados server-side via `app_metadata` (sin fallback a `user_metadata`); frontend verifica rol en tabla `personal`
- ✅ React Query: 7 páginas usan hooks (`Dashboard`, `Kardex`, `Productos`, `Proveedores`, `Rentabilidad`, `Stock`, `Tareas`); `Deposito` usa `useQuery` inline; `Login` sin hook
- ✅ Exportación CSV de productos/stock
- ✅ **Proyecto Supabase configurado**
- ✅ **Migraciones versionadas en repo**
- ✅ **Edge Functions presentes en repo**
- ✅ **Suite de seguridad disponible en `tests/security/`**

## ✅ Estado de Pendientes
- Auditoría RLS completa: ✅ (2026-01-31) — revalidación final con output crudo
- Usuarios de prueba en Supabase Auth + tabla `personal`: ✅
- E2E con auth real (Playwright): spec define 10 tests (2 skip); última revalidación documentada 2026-01-27 (7/7 PASS; histórico)

> **Hoja de ruta madre (vigente):** `docs/HOJA_RUTA_MADRE_2026-01-31.md`

> **Plan modular actualizado:** ver `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`

> **Nota:** rollback PITR no disponible (plan Free Supabase). Backups diarios disponibles.

# EXECUTION LOG — Auditoría Forense 2026-02-10

> Commit base: `3b1a8b0` (main)
> Ejecutor: Claude Code (Opus 4)
> Plan: `docs/PLAN_MAESTRO_EJECUCION_AUDITORIA_v1.md`

---

## BASELINE

### Git
- Commit: `3b1a8b0` — Merge pull request #57
- Branch: `main`
- Estado: Archivos modificados + untracked del sistema agéntico

### Conteos verificados
| Dato | Valor |
|------|-------|
| Líneas Plan Maestro | 1234 |
| Líneas Batería v4.1 | 611 |
| Archivos docs | 116 |
| Archivos test (tests/) | 55 |
| Archivos test (frontend) | 16 |
| **Total test files** | **71** |

### Quality Gates
| Gate | Estado | Notas |
|------|--------|-------|
| Unit tests | **PASS** | 46 archivos, 812 tests passing, 21.57s |
| Frontend lint | **PASS** | Sin errores ESLint |
| Frontend build | **PASS** | Build exitoso en 9.90s, 27 entradas PWA precache |

### Supabase remoto
| Check | Estado | Notas |
|-------|--------|-------|
| CLI disponible | **OK** | v2.72.7 (update v2.75.0 disponible) |
| Functions list | **OK** | 13 funciones ACTIVE confirmadas remotamente |
| Migration list | BLOCKED | Requiere `supabase link` (no ejecutado para no alterar estado) |
| Secrets list | BLOCKED | Idem |

### Edge Functions confirmadas remotamente (13/13 ACTIVE)
| Función | Versión | Estado |
|---------|---------|--------|
| api-minimarket | v20 | ACTIVE |
| api-proveedor | v11 | ACTIVE |
| scraper-maxiconsumo | v11 | ACTIVE |
| cron-jobs-maxiconsumo | v12 | ACTIVE |
| alertas-stock | v10 | ACTIVE |
| notificaciones-tareas | v10 | ACTIVE |
| reportes-automaticos | v10 | ACTIVE |
| alertas-vencimientos | v10 | ACTIVE |
| reposicion-sugerida | v10 | ACTIVE |
| cron-notifications | v12 | ACTIVE |
| cron-dashboard | v10 | ACTIVE |
| cron-health-monitor | v10 | ACTIVE |
| cron-testing-suite | v10 | ACTIVE |

---

## SP-A — AUDITORÍA FORENSE

**Estado:** COMPLETADO
**Duración:** ~15 min (3 agentes en paralelo)
**Evidencia:** `docs/audit/EVIDENCIA_SP-A.md`

### Resumen ejecutivo

| Sub-prompt | Estado | Hallazgos clave |
|------------|--------|----------------|
| A1 — Inventario Funcional | DONE | 7 REAL + 6 PARTIAL EFs; 13/13 pages REAL; 33 migrations; 3/3 SPs confirmed |
| A2 — Pendientes con Criticidad | DONE | 21 pendientes: 6 ROJO, 12 AMARILLO, 4 VERDE; HC-2 y HC-3 confirmados |
| A3 — Funcionalidad Fantasma | DONE | ~7,943 líneas ghost/orphan; routers/ (1023 loc) nunca importado; 3 crons sin auth |

### Hallazgos ROJO (pre-producción)

1. **deploy.sh** no filtra `_shared` ni pasa `--no-verify-jwt` para api-minimarket (HC-2 CONFIRMADO)
2. **Pedidos.tsx** mutations solo console.error — operador sin feedback (HC-3 CONFIRMADO)
3. **Rotación de secretos** no ejecutada (API_PROVEEDOR_SECRET, SENDGRID_API_KEY, SMTP_PASS)
4. **SendGrid** sender verification pendiente
5. **SMTP_FROM vs EMAIL_FROM** mismatch en cron-notifications
6. **3 cron jobs** sin Authorization header (HC-1 CONFIRMADO)

### Hallazgos NUEVOS (no en documentación previa)

- NEW-1: `api-minimarket/routers/` (6 archivos, 1,023 loc) NUNCA importado por index.ts — ghost code
- NEW-2: Cron SQL referencia URL `htvlwhisjpdagqkqnpxg` ≠ project ref `dqaygmjpzoqjjrywdsxi`
- NEW-3: SMTP_FROM vs EMAIL_FROM mismatch
- NEW-4: 3 legacy test suites migradas a Vitest pero NO en CI (1,072 loc)
- NEW-5: VITE_USE_MOCKS solo afecta tareasApi

### Métricas clave

| Métrica | Valor |
|---------|-------|
| Edge Functions REAL / PARTIAL | 7 / 6 |
| Ghost/orphan lines | ~7,943 |
| Pendientes ROJO | 6 |
| Coverage | 69.39% (< 80% política) |
| _shared audit adoption | 1/13 |
| Gateway endpoints sin caller | ~20 de ~46 |

---

## SP-C — ANÁLISIS DE DETALLES

**Estado:** COMPLETADO
**Duración:** ~25 min (4 agentes en paralelo)
**Evidencia:** `docs/audit/EVIDENCIA_SP-C.md`

### Resumen ejecutivo

| Sub-prompt | Estado | Hallazgos clave |
|------------|--------|----------------|
| C1 — Manejo de Errores | DONE | 14 escenarios auditados: 2 OK, 8 PARCIAL, 4 MAL; Pedidos.tsx console.error P0 confirmado; sin interceptor 401 global |
| C2 — Consistencia de Datos | DONE | 6/12 entidades DRIFT (5 críticas tipadas inline fuera de `database.ts` + 1 sin contrato dedicado); 8/9 hooks bypasean gateway; dual-path data access |
| C3 — UX No Técnico | DONE | Gate 14: 3/6 PASS; 7/10 formato moneda OK; 5/13 Skeleton; 7/13 ErrorMessage |
| C4 — Dependencias Externas | DONE | 4/7 cron jobs exceden timeout Free plan 60s; scraper regex frágil; rate-limit in-memory inefectivo en 3/4 funciones |

### Hallazgos ROJO / P0 (nuevos en SP-C)

1. **NEW-C1:** No hay interceptor 401 global en frontend — sesión expirada no redirige a login
2. **NEW-C7:** 4/7 cron jobs con timeout > 60s del Free plan (scraping probablemente nunca completa)
3. **Pedidos.tsx console.error** reconfirmado como P0 (ver SP-A)

### Hallazgos NUEVOS (no en SP-A ni docs previos)

- NEW-C1: Sin interceptor 401 global en frontend
- NEW-C2: apiClient.ts no traduce errores backend a español para toast.error()
- NEW-C3: 5 entidades críticas (ventas, pedidos, clientes, CC, bitácora) tipadas inline en `apiClient.ts` pero fuera de `database.ts`
- NEW-C4: 8/9 hooks bypasean gateway — sin rate-limit, circuit-breaker ni audit
- NEW-C5: Pedidos.tsx usa .toLocaleString() sin locale 'es-AR'
- NEW-C6: Productos, Proveedores, Rentabilidad usan .toFixed() sin separador de miles
- NEW-C7: 4/7 cron jobs configurados con timeout > 60s del Free plan
- NEW-C8: maintenance_cleanup no puede ejecutarse — datos crecen sin poda

### Métricas clave SP-C

| Métrica | Valor |
|---------|-------|
| Escenarios error OK/PARCIAL/MAL | 2 / 8 / 4 |
| Páginas con ErrorMessage | 7/13 |
| Páginas con Skeleton | 5/13 |
| Entidades con DRIFT | 6/12 |
| Hooks bypasean gateway | 8/9 |
| Gate 14 PASS | 3/6 |
| Formato moneda correcto | 7/10 |
| Riesgos externos CRÍTICO | 2 |
| Rate-limit/CB cross-instance | 1/5 funciones |
| @supabase/supabase-js gap | ~56 minor versions |

### Revalidación Codex (2026-02-11)

Estado tras revisión independiente: **SP-C COMPLETADO CON AJUSTES**.

Ajustes aplicados sobre `docs/audit/EVIDENCIA_SP-C.md`:
- Corregidos conteos de líneas a estado real del repo:
  - `_shared/errors.ts`: 227 (no 228)
  - `_shared/response.ts`: 196 (no 197)
  - `helpers/auth.ts`: 344 (no 345)
- Corregida la matriz de adopción de `response.ts` (7/13): se ajustó clasificación de funciones SÍ/NO según código real.
- C1 quedó alineado al formato requerido del prompt: se agregó columna **Evidencia** en la tabla de 14 escenarios.
- C3 quedó alineado al formato requerido del prompt: se agregó tabla consolidada por página con columnas `Página | Español | Formato $ | Skeleton | Empty state | Mobile | Veredicto | Evidencia`.
- C4 quedó alineado al checklist del prompt: se agregó resumen explícito de `npm audit` (root: 0 prod vuln; frontend: 1 moderada transitiva en `lodash`).

Verificación puntual ejecutada:
- `wc -l` sobre archivos críticos de C1.
- `rg -l \"_shared/response\"` y `rg -l \"_shared/errors\"` en `supabase/functions`.
- `rg` de formato monetario, `ErrorMessage` y `Skeleton` en `minimarket-system/src/pages`.
- `npm audit --json --omit=dev` en root y en `minimarket-system/`.

---

## SP-B — VALIDACIÓN FUNCIONAL

**Estado:** COMPLETADO (Modo B — análisis estático profundo)
**Duración:** ~1h (re-análisis completo)
**Ejecutor:** Antigravity (Gemini) — 2a iteración
**Evidencia:** `docs/audit/EVIDENCIA_SP-B.md` (220+ líneas, 4 secciones)

### Resumen ejecutivo

| Sub-prompt | Estado | Hallazgos clave |
|------------|--------|----------------|
| B1 — Jornada del Operador | DONE | 13 tareas: **7 OK, 4 PARCIAL, 1 FALLA** (Pedidos HC-3 — P0). 4 pág sin ErrorMessage (Deposito, Pos, Pocket, Clientes). 8/13 sin Skeleton. |
| B2 — Flujos Críticos E2E | DONE | 5 flujos: **2 FALLA** (alertas stock HC-1, monitoreo inexistente), **1 OK** (scraping cron CON auth), **2 PARCIAL** (POS WhatsApp, pedidos HC-3). sp_reservar_stock idempotente OK. |
| B3 — Utilidad Real Outputs | DONE | **3/11 accionable** (Dashboard stats, Rentabilidad, alertas-stock lógica), **4/11 parcial**, **4/11 no llegan** al operador. Sin canal real de notificación (email/push/webhook). |
| B4 — Condiciones Adversas | DONE | 7 escenarios: **1 OK** (concurrencia), **5 MEDIO**, **1 ALTO** (timeout 60s free tier). Auth.ts robusto (cache+breaker), pero sin interceptor 401 global en frontend. |

### P0 confirmados SP-B
1. HC-1: 3 cron jobs sin Authorization header → 401 silencioso
2. HC-3: 3 mutaciones Pedidos.tsx con solo `console.error()` → operador sin feedback
3. Timeout 60s (free tier) vs scraping multi-categoría secuencial

---

## SP-D — OPTIMIZACIÓN

**Estado:** COMPLETADO
**Duración:** ~20 min
**Ejecutor:** Antigravity (Gemini)
**Evidencia:** `docs/audit/EVIDENCIA_SP-D.md`

### Resumen ejecutivo

| Sub-prompt | Estado | Hallazgos clave |
|------------|--------|----------------|
| D2 — Código Muerto | DONE | ~8,544 líneas ghost/orphan. 6 EFs huérfanas. routers/ (1,023 loc) nunca importado. 3 suites legacy no en CI. |
| D3 — Seguridad | DONE | 2 CRÍTICO (deploy.sh, 3 cron sin auth), 1 ALTO (cache 30s), 4 MEDIO (RLS, CORS, rate-limit, validation), 2 BAJO (secrets OK). |
| D1 — Performance | DONE | Cold start ~2-5s Free plan. 3 hooks con SELECT *. Sin paginación. MVs sin refresh cron. |
| D4 — UX Final | DONE | 4 P0 fixes (Pedidos console.error, ErrorMessage 6 pág, deploy.sh, interceptor 401). 7 P1 fixes listados. |

---

## SP-E — PRODUCCIÓN

**Estado:** COMPLETADO (revalidado; `BLOCKED` E1 reducido de 12 a 8)
**Duración:** ~20 min
**Ejecutor:** Antigravity (Gemini)
**Evidencia:** `docs/audit/EVIDENCIA_SP-E.md`

### Resumen ejecutivo

| Sub-prompt | Estado | Hallazgos clave |
|------------|--------|----------------|
| E2 — Secrets/Env | DONE | ~27 vars identificadas. 7 documentadas, 15 no documentadas. 2 mismatches (SMTP_FROM/EMAIL_FROM, VITE_API_GATEWAY_URL). |
| E1 — Deploy Checklist | DONE | 9 PASS, 8 PARCIAL, 2 FAIL (cron auth + CORS prod), 8 BLOCKED tras revalidación Codex. |
| E3 — Logging | DONE | **NO hay canal de alerta real.** Sin Sentry, sin email, sin Slack. Solo logs internos. |
| E4 — Rollback | DONE | BD sin PITR ni backup automatizado (riesgo ALTO). EF/Frontend con rollback OK. |

### Revalidación SP-E (Codex, 2026-02-11)

- `pnpm -C minimarket-system exec tsc --noEmit` -> PASS.
- `supabase migration list --linked` -> PASS (snapshot intermedio pre-push final; estado consolidado final: 36/36).
- `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json` -> 13/13 ACTIVE, `api-minimarket verify_jwt=false`.
- `supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json` -> inventario backend por nombre confirmado.
- `curl https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket/health` -> `success:true` (200).
- `ALLOWED_ORIGINS` en estado final PASS: origen productivo `https://aidrive-genspark.vercel.app` responde 200 con ACAO correcto; origen no permitido bloquea 403/null.

---

## SP-F — UTILIDAD REAL

**Estado:** COMPLETADO
**Duración:** ~15 min
**Ejecutor:** Antigravity (Gemini)
**Evidencia:** `docs/audit/EVIDENCIA_SP-F.md`

### Resumen ejecutivo

| Sub-prompt | Estado | Hallazgos clave |
|------------|--------|----------------|
| F1 — ¿Resuelve problema real? | DONE | 1/3 P0 ✅, 2/3 P0 ⚠️, 1/3 P1 ❌ (alertas). NO cumple criterio F1. |
| F2 — ¿Valor minuto 1? | DONE | TTFV ~25-30 min (> 20 min umbral). Sin onboarding, sin seed data, sin empty states. |
| F3 — Funcionalidad innecesaria | DONE | ~4,688 líneas INNECESARIAS + 42 docs closure. ~1,905 OVERKILL (conservar). |

---

## SP-Ω — CIERRE

**Estado:** COMPLETADO
**Duración:** ~15 min
**Ejecutor:** Antigravity (Gemini)
**Evidencia:** `docs/audit/EVIDENCIA_SP-OMEGA.md`

### 18 Gates

| Resultado | Gates | Conteo |
|-----------|-------|--------|
| ✅ OK | 1, 2, 8, 11, 17 | 5/18 |
| ⚠️ PARCIAL | 3, 7, 9, 10, 12, 14, 15, 18 | 8/18 |
| ❌ FALLA | 4, 5, 6, 13, 16 | 5/18 |

### Veredicto Final

# ❌ NO LISTO (Piloto y Producción)

**Criterio aplicado del Plan Maestro:** cualquier gate obligatorio fuera de ✅ implica `NO LISTO`.
**Estado actual Piloto:** 5/9 gates obligatorios en ✅ (1,2,8,11,17). Gates obligatorios restantes en ⚠️/❌: 3,4,7,18.
**Producción requiere además:** Gates 15 y 16 en ✅.
**Esfuerzo total P0 estimado:** ~8.5h

### Top 3 Acciones Inmediatas

1. Fix 3 cron jobs auth header (30min) → corrige Gate 4 (aún no alcanza para Piloto)
2. Fix deploy.sh (30min) → previene destrucción al re-deploy
3. Fix Pedidos.tsx console.error (30min) → UX mínima viable

### Paso 1 completado (prompts P0)

Se generó paquete de prompts ejecutables y breves en:
- `docs/closure/PROMPTS_P0_DESBLOQUEO_GATES_2026-02-11.md`

### Revalidación Codex (2026-02-11, SP-B→SP-Ω)

Estado tras revisión independiente: **SP-B/SP-D/SP-E/SP-F/SP-Ω verificados con ajustes factuales y de criterio**.

Ajustes aplicados:
- `docs/audit/EVIDENCIA_SP-B.md`
  - Conteos de líneas corregidos a estado real (`auth.ts` 344, `validation.ts` 130, `Pedidos.tsx` 708, `Pos.tsx` 597, `Pocket.tsx` 566, etc.).
  - Correcciones de líneas en funciones huérfanas (`alertas-vencimientos` 206, `reposicion-sugerida` 237, `cron-dashboard` 1283).
  - Escenario B4 de sesión expirada ajustado a **PARCIAL/MEDIO**: no hay interceptor global 401 en frontend.
- `docs/audit/EVIDENCIA_SP-D.md`
  - Conteos corregidos (`alertas-vencimientos` 206, `reposicion-sugerida` 237, `cron-notifications` 1282, `cron-dashboard` 1283, `cron-testing-suite` 1424, `rate-limit.ts` 273, `.gitignore` 948).
- `docs/audit/EVIDENCIA_SP-OMEGA.md`
  - Veredicto ajustado a **❌ NO LISTO** para alinear con criterio formal del plan (`cualquier gate obligatorio no-✅`).
  - Tabla de perfil Piloto corregida para gates obligatorios en `⚠️/❌` como `NO PASA`.

Comandos de verificación ejecutados:
- `wc -l` en archivos críticos (docs + frontend + edge functions + helpers).
- `rg -n` en cron SQL (`deploy_all_cron_jobs.sql`) para headers Authorization y jobs.
- `rg -n` para 401/auth flow (`apiClient.ts`, `AuthContext.tsx`, `App.tsx`).
- `rg -n` para `console.error`/`toast.error` en páginas críticas (`Pedidos`, `Pos`, `Pocket`, etc.).

---

## FIXES P0 — Ejecución (2026-02-11, Claude Code Opus 4)

**Estado:** COMPLETADO
**Duración:** ~45 min
**Ejecutor:** Claude Code (Opus 4)
**Prompts:** `docs/closure/PROMPTS_P0_DESBLOQUEO_GATES_2026-02-11.md` (4 prompts)

### Fixes aplicados

| # | Fix | Archivos modificados | Verificación |
|---|-----|---------------------|-------------|
| 1 | **HC-1: Authorization header en 3 cron jobs** | `supabase/cron_jobs/deploy_all_cron_jobs.sql` (3 procedures actualizados) | `grep Authorization` → 7/7 `net.http_post` con auth header |
| 2 | **HC-1: maintenance_cleanup cron semanal** | `supabase/cron_jobs/deploy_all_cron_jobs.sql` (Job 8 agregado) | Domingo 04:00, retención 30d, 120s timeout |
| 3 | **HC-1: Migración aplicada en remoto** | `20260211055140_fix_cron_jobs_auth_and_maintenance.sql` (via MCP) | 4 cron jobs activos en remoto. URLs corregidas `htvlwhisjpdagqkqnpxg` → `dqaygmjpzoqjjrywdsxi`. pg_cron 1.6.4 + pg_net 0.19.5 habilitadas. ✅ Runtime auth resuelto luego con Vault (`20260211062617`). |
| 4 | **HC-2: deploy.sh seguro** | `deploy.sh` (loop de Edge Functions refactorizado) | Dry-run: 13 funciones target, `_shared` skip, `api-minimarket` con `--no-verify-jwt` |
| 5 | **HC-3: Pedidos.tsx toast.error** | `minimarket-system/src/pages/Pedidos.tsx` (import + 3 catches) | `toast.error` en L52, L62, L72. Build PASS. |
| 6 | **HC-3: Interceptor 401 global** | `minimarket-system/src/lib/authEvents.ts` (nuevo), `apiClient.ts` (2 emit points), `AuthContext.tsx` (listener) | Observer pattern. Build PASS (5.48s, 27 PWA entries). |

### Quality Gates post-fix

| Gate | Estado | Evidencia |
|------|--------|-----------|
| Frontend build | ✅ PASS | `pnpm -C minimarket-system build` → 5.48s, 0 errores TS |
| Cron SQL auth check | ✅ PASS | `grep Authorization deploy_all_cron_jobs.sql` → 7/7 |
| deploy.sh dry-run | ✅ PASS | 13 funciones, `_shared` excluido, `api-minimarket` `--no-verify-jwt` |
| Pedidos.tsx feedback | ✅ PASS | 3 `toast.error` + 3 `console.error` (debug) |
| 401 interceptor | ✅ PASS | `authEvents.emit` en apiClient + `signOut` en AuthContext |

### 18 Gates recalculados

| Resultado | Gates (antes) | Gates (después) |
|-----------|------|--------|
| ✅ OK | 1, 2, 8, 11, 17 (5) | 1, 2, 8, 11, 17 (5) |
| ⚠️ PARCIAL | 3, 7, 9, 10, 12, 14, 15, 18 (8) | 3, 4, 7, 9, 10, 12, 13, 14, 15, 18 (10) |
| ❌ FALLA | 4, 5, 6, 13, 16 (5) | 5, 6, 16 (3) |

**Gates mejorados:**
- Gate 4 (Alertas stock): ❌→⚠️ (cron auth fijado y runtime validado vía Vault; persiste pendiente de canal real al operador).
- Gate 13 (ErrorMessage): ❌→⚠️ (snapshot intermedio post-P0; ver consolidado final en Addendum Codex).

### Veredicto post-fix

**⚠️ NO LISTO (Piloto) — MEJORADO SIGNIFICATIVAMENTE**

- Gates obligatorios Piloto: 5/9 ✅, 4/9 ⚠️ PARCIAL, **0 ❌ FALLA** (antes: 2 FALLA)
- Esfuerzo restante para Piloto: ~4-5h
- Esfuerzo restante para Producción: ~8-9h
- Detalle completo: `docs/audit/EVIDENCIA_SP-OMEGA.md` (Addendum post-fix)

---

## Revalidación post-cierre abrupto (2026-02-11, Codex)

Se ejecutó una verificación independiente para confirmar que la corrida P0 no quedó incompleta.

### Chequeos ejecutados

- `pnpm -C minimarket-system build` → ✅ PASS (5.36s, 27 entradas PWA).
- `pnpm -C minimarket-system lint` → ✅ PASS.
- `pnpm -C minimarket-system test:unit` → ✅ PASS (16 archivos, 110 tests).
- `find supabase/functions ... ! -name _shared ... index.ts` → ✅ 13 funciones deployables.
- `rg "net.http_post(" supabase/cron_jobs/deploy_all_cron_jobs.sql` + validación de bloque `Authorization` → ✅ 7/7 invocaciones con auth.
- `rg -- "--no-verify-jwt" deploy.sh` + filtro `_shared`/`index.ts` → ✅ presente.

### Ajuste adicional aplicado

- `minimarket-system/src/pages/Pedidos.tsx`
  - Se agregó `ErrorMessage` persistente para error de carga (`parseErrorMessage` + `detectErrorType` + `onRetry`).
  - Esto cierra el pendiente de Prompt 3 ("manejo de error persistente en páginas críticas") para Pedidos.

### Impacto de estado

- Gate 13 (ErrorMessage en páginas): mejora factual intermedia de **7/13 → 8/13** (consolidado final posterior: **9/13**).
- Veredicto general no cambia: **⚠️ NO LISTO (Piloto)** hasta cerrar gates 3, 4, 7 y 18.

---

## MIGRACIÓN REMOTA P0 — Aplicación (2026-02-11, GitHub Copilot Opus 4)

**Estado:** COMPLETADO (DDL + Vault + E2E)
**Ejecutor:** GitHub Copilot (Claude Opus 4) vía MCP Supabase
**Vault:** `service_role_key` configurado en Supabase Vault (`vault.decrypted_secrets`). Test E2E: HTTP 200.

### Comandos ejecutados

| # | Comando/Acción | Resultado |
|---|----------------|-----------|
| 1 | `supabase --version` | v2.72.7 |
| 2 | `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi` | 13 funciones ACTIVE |
| 3 | `supabase migration list --linked` | ❌ FAIL: Circuit breaker pooler |
| 4 | `mcp_supabase_list_migrations` | ✅ 33 migraciones (20260211 ausente — pendiente) |
| 5 | Corrección URLs: `sed -i 's/htvlwhisjpdagqkqnpxg/dqaygmjpzoqjjrywdsxi/g'` en migración + deploy_all_cron_jobs.sql | ✅ 7+7=14 URLs corregidas, 0 residuales |
| 6 | `CREATE EXTENSION IF NOT EXISTS pg_net` | ✅ pg_net 0.19.5 |
| 7 | `CREATE EXTENSION IF NOT EXISTS pg_cron` | ✅ pg_cron 1.6.4 |
| 8 | `mcp_supabase_apply_migration` (fix_cron_jobs_auth_and_maintenance) | ✅ Versión asignada: `20260211055140` |
| 9 | `mcp_supabase_list_migrations` | ✅ 34 migraciones (incluye `20260211055140`) |
| 10 | `SELECT jobname, schedule FROM cron.job` | ✅ 4 jobs activos |
| 11 | `curl api-minimarket/health` | ✅ HTTP 200 `{"status":"healthy"}` |
| 12 | Verificación procedures: `SELECT prosrc FROM pg_proc` | ✅ 4/4 con Authorization + URL correcta |
| 13 | `mv` archivo local `20260211000000` → `20260211055140` | ✅ Alineado con remoto |
| 14 | `vault.create_secret(service_role_key)` | ✅ UUID asignado, 219 chars |
| 15 | `mcp_supabase_apply_migration` (cron_jobs_use_vault_secret) | ✅ Versión `20260211062617`. 4 procedures migrados a vault |
| 16 | `CALL alertas_stock_38c42a40()` (E2E test) | ✅ HTTP 200 en `net._http_response` |
| 17 | `mcp_supabase_list_migrations` (final) | ✅ 35 migraciones totales |

### Cron jobs activos en remoto

| Job | Schedule | Procedure |
|-----|----------|-----------|
| alertas-stock_invoke | `0 * * * *` | `alertas_stock_38c42a40()` |
| maintenance_cleanup | `0 4 * * 0` | `maintenance_cleanup_7b3e9d1f()` |
| notificaciones-tareas_invoke | `0 */2 * * *` | `notificaciones_tareas_5492c915()` |
| reportes-automaticos_invoke | `0 8 * * *` | `reportes_automaticos_523bf055()` |

### BLOCKED

| Item | Razón | Estado |
|------|-------|--------|
| ~~`app.service_role_key`~~ | ~~Setting no configurado en BD remota~~ | ✅ **RESUELTO** (2026-02-11): Vault pattern implementado. `service_role_key` en `vault.decrypted_secrets`. Migración `20260211062617`. |
| ~~Cron jobs runtime~~ | ~~Sin service_role_key, los procedures fallarán~~ | ✅ **RESUELTO**: Test E2E `CALL alertas_stock_38c42a40()` → HTTP 200 |
| `.env` vacío | Variables `SUPABASE_DB_URL`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` sin valor | ⚠️ Pendiente — configurar credenciales locales según `docs/OBTENER_SECRETOS.md` |
| CLI pooler circuit breaker | `supabase migration list --linked` falla por rate-limit en pooler | ⚠️ Intermitente — usar MCP tools como workaround |

### Impacto sobre Gates

- **Gate 4** (Alertas stock): Mejora a ⚠️ PARCIAL (mejorado) — DDL + Vault auth funcional. Test E2E HTTP 200. Falta canal push/email.
- **Gate 10** (Cron jobs): Mejora a ⚠️ PARCIAL (mejorado) — 4 jobs con Vault auth funcional. Runtime verificado.
- **Gate 11** (Migraciones): ✅ OK — snapshot intermedio 35/35 (consolidado final posterior: 36/36).
- Veredicto general: **⚠️ NO LISTO (Piloto)** — pero bloqueador runtime cron ELIMINADO. Pendientes: canal push (Gate 4), RLS tablas nuevas (Gate 7).

---

## Addendum Codex — Ejecución inmediata de puntos pendientes (2026-02-11)

**Objetivo:** ejecutar los 2 puntos críticos pendientes del cierre: (1) aplicar migración RLS pendiente, (2) corregir CORS productivo y revalidar.

### Punto 1 — Migración remota `20260211100000`

Comandos:
- `supabase db push --linked`
- `supabase migration list --linked`

Resultado:
- ✅ Migración `20260211100000_audit_rls_new_tables.sql` aplicada correctamente.
- ✅ Estado de migraciones consolidado en `36/36` (local=remoto).

Notas técnicas:
- La migración fue ajustada a modo seguro antes de aplicar:
  - habilita RLS en tablas objetivo,
  - valida existencia de al menos 1 policy por tabla,
  - falla si detecta grants directos a `anon` en tablas sensibles.

### Punto 2 — Corrección `ALLOWED_ORIGINS` + revalidación

Comandos:
- `supabase secrets set ALLOWED_ORIGINS="https://aidrive-genspark.vercel.app,http://localhost:5173,http://127.0.0.1:5173" --project-ref dqaygmjpzoqjjrywdsxi`
- `supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output pretty`
- `bash scripts/verify-cors.sh`
- `curl -I -H "Origin: https://aidrive-genspark.vercel.app" https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket/health`
- `curl -I -H "Origin: https://malicious-site.com" https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket/health`

Resultado:
- ✅ Origin permitido responde `HTTP 200` con `Access-Control-Allow-Origin` correcto.
- ✅ Origin no permitido responde `HTTP 403` con `Access-Control-Allow-Origin: null`.
- ✅ CORS productivo queda corregido para dominio objetivo.

Nota de calidad:
- `scripts/verify-cors.sh` fue corregido para validar con `GET` real (evita falso negativo por `HEAD 404`).
- Adopción `ErrorMessage` en páginas (snapshot final post-Pos): **9/13**. Este valor reemplaza el snapshot intermedio `8/13`.

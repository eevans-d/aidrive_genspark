# 🟢 ESTADO ACTUAL DEL PROYECTO

**Última actualización:** 2026-02-01 04:35 UTC  
**Estado:** ✅ PRODUCCIÓN CONFIGURADA (revisión humana P0 completada 2026-02-01)

**Actualización 2026-02-01 (Antigravity Agent — revisión humana P0):**
- **Revisión humana P0 completada**: 6 módulos críticos analizados y aprobados.
  - `api-minimarket/index.ts` ✅ — JWT auth, CORS, rate limit 60/min, circuit breaker OK
  - `_shared/cors.ts` ✅ — validateOrigin, Vary: Origin, ALLOWED_ORIGINS
  - `_shared/rate-limit.ts` ✅ — FixedWindow + Adaptive, headers IETF
  - `20260110100000_fix_rls_security_definer.sql` ✅ — search_path=public, validaciones
  - `AuthContext.tsx` ⚠️ — OK (console.error menor; insert directo documentado D-025)
  - `scraper-maxiconsumo/` ✅ — SCRAPER_READ_MODE, circuit breaker, anti-detection
- Conteos recalculados desde repo (funciones, migraciones y tests).
- API gateway: 29 endpoints en `supabase/functions/api-minimarket/index.ts`.
- Frontend: 9 páginas, 8 hooks React Query, 3 componentes.
- Coverage en repo: 69.91% lines (coverage/index.html).
- **Pendiente manual:** Leaked Password Protection (Dashboard → Auth → Settings).

**Actualización 2026-01-30 (COMET):**
- Secretos críticos obtenidos desde Supabase y cargados en Edge Functions/CI (sin exponer valores).
- Validaciones mínimas OK: `migrate.sh status staging` y `run-integration-tests --dry-run`.
- Rollback de `create_stock_aggregations` ejecutado en STAGING (SQL manual). Evidencia: `docs/ROLLBACK_EVIDENCE_2026-01-29.md`.

**Actualización 2026-01-30 (local):**
- Revisión Security Advisor pendiente; ejecución local bloqueada por falta de `DATABASE_URL` en `.env.test`. Ver `docs/SECURITY_ADVISOR_REVIEW_2026-01-30.md`.

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
- Security Advisor (PROD) mitigado: 5 ERROR y 5 WARN eliminadas; anon grants internos revocados (0). Quedan 2 WARN (leaked password protection + 1 WARN residual por confirmar) + 15 INFO (tablas internas sin policies). Ver Parte 8 en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`.
- Migración recomendada para mitigar Advisor: `supabase/migrations/20260131020000_security_advisor_mitigations.sql` (pendiente aplicar/validar en entornos no-PROD si aplica).
- Planificación consolidada en `docs/HOJA_RUTA_MADRE_2026-01-31.md` (planes antiguos retirados).

## 🎯 Proyecto Supabase

| Propiedad | Valor |
|-----------|-------|
| **Nombre** | minimarket-system |
| **Ref** | dqaygmjpzoqjjrywdsxi |
| **Región** | East US (North Virginia) |
| **URL** | https://dqaygmjpzoqjjrywdsxi.supabase.co |
| **Dashboard** | https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi |

> Nota: ref/URL provienen de `.env.*` y `supabase/.temp/project-ref`; el estado del panel requiere verificación manual.

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

> Nota: estado de despliegue y tamaños requieren validación en Dashboard.

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
- **Tests E2E backend smoke:** 4 (tests/e2e)
- **Tests E2E frontend (Playwright):** 18 definidos (4 skip)
- **Tests E2E auth real (Playwright):** 10 definidos (2 skip) — incluido en el total anterior
- **Coverage (artefacto repo):** 69.91% lines (coverage/index.html)
- **Migraciones en repo:** 12 archivos en `supabase/migrations`
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

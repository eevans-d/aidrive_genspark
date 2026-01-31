# 🟢 ESTADO ACTUAL DEL PROYECTO

**Última actualización:** 2026-01-31  
**Estado:** ✅ PRODUCCIÓN CONFIGURADA (verificación completa 2026-01-28)

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

### Edge Functions Desplegadas
| Función | Estado | Tamaño |
|---------|--------|--------|
| api-minimarket | ✅ Funcionando | 897 KB |
| api-proveedor | ✅ Funcionando | 62 KB |
| alertas-stock | ✅ Funcionando | 8 KB |
| alertas-vencimientos | ✅ | 9 KB |
| cron-dashboard | ✅ | 18 KB |
| cron-health-monitor | ✅ | 16 KB |
| cron-jobs-maxiconsumo | ✅ | 22 KB |
| cron-notifications | ✅ | 23 KB |
| cron-testing-suite | ✅ | 19 KB |
| notificaciones-tareas | ✅ | 9 KB |
| reportes-automaticos | ✅ | 8 KB |
| reposicion-sugerida | ✅ | 115 KB |
| scraper-maxiconsumo | ✅ | 47 KB |

---

## 📊 Métricas de Código (Verificadas)

### Backend (Supabase Edge Functions)
| Categoría | Cantidad | Detalle |
|-----------|----------|---------|
| Edge Functions | 13 | api-minimarket, api-proveedor, scraper, crons, alertas |
| Módulos Compartidos | 7 | `_shared/` (logger, response, errors, cors, audit, rate-limit, circuit-breaker) |
| **Tests Backend** | **640** | 36 archivos |

### Frontend (minimarket-system)
| Categoría | Cantidad | Detalle |
|-----------|----------|---------|
| Páginas | 9 | Dashboard, Login, Deposito, Kardex, Productos, etc. |
| Hooks Query | 8 | useDashboardStats, useProductos, useTareas, etc. |
| Componentes | 3 | Layout, ErrorBoundary, ErrorMessage |
| **Tests Frontend** | **40** | 12 archivos |

### Totales
- **Tests Unitarios:** 720 (Backend 680 + Frontend 40) — revalidado 2026-01-28
- **Tests Integración (local):** 38/38 — revalidado 2026-01-28
- **Tests Seguridad:** 15/15 (real) — revalidado 2026-01-28
- **Tests Performance:** 6/6 (real) — revalidado 2026-01-28
- **Tests Contratos API:** 11/11 (real) — revalidado 2026-01-28
- **Tests E2E Backend Smoke:** 4/4 — revalidado 2026-01-28
- **Tests E2E Frontend Mocks:** 6/6 passed (9 skipped) — revalidado 2026-01-28
- **Tests E2E Auth Real:** 7/7 — revalidado 2026-01-28
- **Deno Check:** ✅ Sin errores — revalidado 2026-01-28
- **Migraciones:** 10/10 aplicadas y alineadas local/staging
- **Build Frontend:** ✅ Compilado (5.52s)
- **Coverage:** 69.91% lines (↑13.28%)
- **Agent Skills:** 5 activos (TestMaster V2, DeployOps V2, DocuGuard V2, CodeCraft, RealityCheck)

---

## ✅ Features Implementados
- ✅ Scraper de precios Maxiconsumo
- ✅ API Gateway con rate limiting + circuit breaker
- ✅ Alertas de stock bajo y vencimientos
- ✅ Roles validados server-side via `app_metadata` (sin fallback a `user_metadata`); frontend verifica rol en tabla `personal`
- ✅ React Query con caching en páginas con data (8/8); Login sin hook
- ✅ Exportación CSV de productos/stock
- ✅ **Proyecto Supabase configurado**
- ✅ **Migraciones aplicadas**
- ✅ **Edge Functions desplegadas**
- ✅ **Tests de seguridad con credenciales reales**

## ✅ Estado de Pendientes
- Auditoría RLS completa: ✅ (2026-01-31) — revalidación final con output crudo
- Usuarios de prueba en Supabase Auth + tabla `personal`: ✅
- E2E con auth real (Playwright): ✅ revalidado 2026-01-27 (7/7 PASS)

> **Hoja de ruta madre (vigente):** `docs/HOJA_RUTA_MADRE_2026-01-31.md`

> **Plan modular actualizado:** ver `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`

> **Nota:** rollback PITR no disponible (plan Free Supabase). Backups diarios disponibles.

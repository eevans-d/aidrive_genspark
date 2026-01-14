# C4_HANDOFF_MINIMARKET_TEC

**Fecha:** 2026-01-14  
**Dominio:** TEC  
**Nivel:** Intermedio  
**Estado:** Draft (actualizar al cierre)

## Componentes críticos
| Componente | Ubicación | Responsable | Notas |
|------------|-----------|-------------|-------|
| Gateway api-minimarket | supabase/functions/api-minimarket | Backend/DevOps | JWT, rate limit, circuit breaker, CORS restrictivo |
| API proveedor | supabase/functions/api-proveedor | Backend | Auth por shared secret + allowlist (D-010); migrar a token real |
| Scraper maxiconsumo | supabase/functions/scraper-maxiconsumo | Backend | ANON para lecturas (D-018), service para escrituras |
| Cron jobs maxiconsumo | supabase/functions/cron-jobs-maxiconsumo | Backend | Métricas/persistencia en cron_jobs_execution_log |
| Frontend | minimarket-system/ | Frontend | Vite/React/TS; Playwright E2E con mocks |
| DB + migraciones | supabase/migrations | DBA | RLS pendiente auditoría (D-019) |

## Configuraciones clave (no incluir secretos)
- Supabase: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (solo staging/prod). 
- Gateway: ALLOWED_ORIGINS, RATE_LIMIT, JWT_SECRET/JWT_AUD.
- API proveedor: API_PROVEEDOR_SECRET, API_PROVEEDOR_READ_MODE=anon (lecturas), API_PROVEEDOR_WRITE_MODE=service (escrituras).
- Scraper: SCRAPER_READ_MODE=anon, SCRAPER_WRITE_MODE=service.
- Frontend: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_USE_MOCKS (para E2E frontend).

## Procedimientos operativos
- Tests locales backend: `npm test` (unit), `npm run test:integration` (Supabase local), `npm run test:e2e` (gated/envs). 
- Tests frontend: `cd minimarket-system && pnpm test:e2e:frontend` (mocks).
- Migraciones: `supabase db reset` (local); staging/prod sólo con checklist WS3.1 y ventana de mantenimiento.
- Auditoría RLS: scripts/rls_audit.sql y docs/AUDITORIA_RLS_CHECKLIST.md (solo con credenciales).
- Deploy edge functions: ver docs/DEPLOYMENT_GUIDE.md (no ejecutar en prod sin credenciales/gate).

## Operación y monitoreo
- Logs/metrics cron: tabla cron_jobs_execution_log; revisar duración/errores/items.
- Alertas/validaciones: cron realtime-alerts y comparaciones (pendiente WS4.1).
- Observabilidad: `_shared/logger` con requestId/jobId/runId; evitar console.*.

## Backups y rollback
- Rollback migraciones: pasos en docs/DEPLOYMENT_GUIDE.md (WS3.2).
- No hay backups automatizados documentados; coordinar con Supabase para snapshots antes de cambios críticos.

## Transferencia y contacto
- Issues/PR en GitHub como canal principal.
- Roles y disponibilidad: ver docs/C0_STAKEHOLDERS_MINIMARKET_TEC.md.
- Credenciales: custodiar fuera del repo; compartir solo por canal seguro.

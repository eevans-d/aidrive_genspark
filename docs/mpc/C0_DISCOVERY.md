# C0 — Descubrimiento (MPC v2.0)

**Proyecto:** Mini Market System
**Fecha:** 2026-01-22
**Versión:** 1.0.0
**Estado:** Borrador validable

---

## 1) Inventario de assets (actual)

### 1.1 Repositorios y apps
- **Repositorio monolítico:** `aidrive_genspark_forensic` (raíz)
- **Frontend:** `minimarket-system/` (React + Vite + TS)
- **Backend/Edge Functions (Supabase):** `supabase/functions/`
- **DB y migraciones:** `supabase/migrations/` + `supabase/sql/`
- **Cron & automatizaciones:** `supabase/functions/cron-*` + `supabase/cron_jobs/`
- **Testing:** `tests/` (unit/integration/e2e/perf/security) + `vitest*.config.ts`
- **Docs:** `docs/` (Roadmap, arquitectura, runbooks, OpenAPI)
- **CI/CD:** `.github/workflows/ci.yml`

### 1.2 Sistemas y APIs involucrados
- **Supabase** (DB Postgres + Auth + REST + Edge Functions)
- **API Gateway:** `supabase/functions/api-minimarket`
- **API Proveedor:** `supabase/functions/api-proveedor`
- **Scraper:** `supabase/functions/scraper-maxiconsumo`
- **Crons:** `supabase/functions/cron-*` (jobs programados y auxiliares)

### 1.3 Entornos
- **Local:** Supabase local (config en `supabase/config.toml`)
- **Staging/Prod:** **Pendiente de credenciales** (bloqueante operativo)

---

## 2) Matriz de stakeholders (roles)

| Rol | Responsabilidades | Involucramiento | Decisión | Contacto |
|---|---|---|---|---|
| Product Owner | Prioridades, alcance, aceptación | Alto | Sí | TBD |
| Tech Lead | Arquitectura, estándares, riesgos | Alto | Sí | TBD |
| Backend Lead | Edge Functions, DB, crons | Alto | Sí | TBD |
| Frontend Lead | UI, data layer, UX | Medio | Parcial | TBD |
| QA/Testing | Strategy de pruebas, evidencias | Medio | Parcial | TBD |
| DevOps/Ops | CI/CD, despliegues, observabilidad | Medio | Parcial | TBD |
| Seguridad/Compliance | RLS, políticas, auditorías | Medio | Parcial | TBD |
| Analítica/Operaciones | KPIs, reportes, uso operativo | Bajo | No | TBD |

---

## 3) Requisitos funcionales (FR)

1. **Gestión de inventario**: stock, movimientos, depósitos, alertas.
2. **Scraping de precios**: extracción, comparación y alertas de cambios.
3. **APIs operativas**: gateway, proveedor, health/status.
4. **Cron jobs**: actualizaciones diarias, alertas, mantenimiento.
5. **Dashboard**: métricas, reportes, exportaciones CSV.
6. **Autenticación**: roles validados server-side.
7. **Notificaciones**: tareas/alertas configuradas.

## 4) Requisitos no funcionales (NFR)

- **Seguridad:** RLS verificado, CORS restringido, roles server-side, least privilege.
- **Observabilidad:** logging estructurado con `requestId/jobId/runId`.
- **Confiabilidad:** circuit breaker y rate limiting activos.
- **Performance:** baseline medible en cron/scraper y queries paginadas.
- **Testabilidad:** suites unit/integration/e2e ejecutables con configs claros.
- **Operabilidad:** runbooks y rollback documentados.

---

## 5) Restricciones y políticas

- **Credenciales de staging/prod faltantes** → bloquea RLS/migraciones en entorno real.
- **Frontend no debe escribir directo a DB** (writes via gateway).
- **Prohibido `console.log`** en Edge Functions; usar `createLogger()`.
- **CORS** debe restringirse por `ALLOWED_ORIGINS`.
- **Variables de entorno críticas** deben estar definidas antes de deploy.

---

## 6) Deuda técnica conocida / issues críticos

- **Auditoría RLS pendiente por credenciales.**
- **Logging parcial en cron auxiliares / propagación de `requestId`** (roadmap WS1.1/WS4.2).
- **E2E real bloqueado por credenciales** (WS2.2).
- **Validación runtime de payloads de cron** aún parcial (WS1.2/WS4.1).
- **Frontend lee directo de Supabase (confirmado)**: lecturas en hooks; writes deben ir por gateway. Evidencia: `minimarket-system/src/hooks/queries/useProveedores.ts` (consultas a `supabase.from(...)`).

---

## 7) Preguntas críticas abiertas (bloqueantes)

1. ¿Quién aprueba cambios en arquitectura/seguridad (owner nominal)?
2. ¿Disponemos de credenciales staging/prod y ventana de ejecución?
3. ¿Cuál es el objetivo temporal (deadline) para el próximo hito?
4. ¿Qué métricas de negocio son obligatorias para el cierre?

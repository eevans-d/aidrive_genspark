# Hoja de Ruta Unificada hacia Produccion (2026-01-30)

Ultima actualizacion: 2026-01-30
Origen: consolidacion local (docs + repo). Sin acceso a dashboards.

## 1) Alcance y fuentes verificadas (local)
Fuentes usadas y contrastadas en este documento:
- docs/ESTADO_ACTUAL.md (actualizado 2026-01-30)
- docs/DECISION_LOG.md (actualizado 2026-01-29)
- docs/CHECKLIST_CIERRE.md (actualizado 2026-01-28 + notas 2026-01-30)
- docs/ROADMAP.md (actualizado 2026-01-28)
- docs/SECURITY_ADVISOR_REVIEW_2026-01-30.md (COMET + CLI bloqueada)
- docs/AUDITORIA_RLS_CHECKLIST.md (completado 2026-01-23)
- docs/HOJA_RUTA_30_PASOS.md (actualizado 2026-01-28)
- docs/mpc/SUB_PLAN_01_GATEWAY_API_MINIMARKET.md
- docs/mpc/SUB_PLAN_02_FRONTEND_CORE.md
- docs/mpc/SUB_PLAN_03_SCRAPER_MAXICONSUMO.md
- docs/mpc/SUB_PLAN_04_CRON_JOBS.md
- docs/mpc/SUB_PLAN_06_ALERTAS_NOTIFICACIONES.md
- docs/closure/PROJECT_CLOSURE_REPORT.md
- docs/DB_GAPS.md (referencia a REPORTE_REVISION_DB.md inexistente)
- .github/dependabot.yml, LICENSE (repositorio)

## 2) Inconsistencias detectadas (requieren resolucion)
1) RLS inconsistente:
   - AUDITORIA_RLS_CHECKLIST.md (2026-01-23) indica P0 protegido.
   - COMET (2026-01-30) reporta 0 policies y RLS deshabilitado en 2 tablas.
   - Accion: re-verificar con output crudo y remediar.

2) DB_GAPS.md referencia REPORTE_REVISION_DB.md que NO existe en el repo.
   - Accion: recuperar/crear el reporte o quitar la referencia.

3) CHECKLIST_CIERRE.md referencia PLAN_EJECUCION.md, pero el archivo no existe.
   - Accion: crear el documento o actualizar la referencia.

4) HOJA_RUTA_30_PASOS.md tiene muchos pasos sin marcar, pero ESTADO_ACTUAL
   reporta verificaciones ya completadas. Falta unificacion de estado real.

## 3) Estado confirmado (segun docs, no re-verificado hoy)
- Rollback OPS-SMART-1 ejecutado en STAGING; evidencia en docs/ROLLBACK_EVIDENCE_2026-01-29.md.
- Secrets obtenidos y validados segun COMET (2026-01-29).
- Tests y build revalidados 2026-01-28 (ver docs/ESTADO_ACTUAL.md).
- Dependabot configurado (.github/dependabot.yml).

## 4) Bloqueadores para Produccion (P0)
Checklist P0 (no continuar a produccion hasta cerrar):
- [ ] P0-01 Resolver Security Advisor / RLS (COMET)
  - Estado actual: Prompt 1 y 2 ejecutados; remediacion aplicada en STAGING.
  - Snapshot DESPUES literal capturado (JSON traducido por UI).
  - Pendiente: cerrar gaps detectados por auditoria lite (ver P0-04).
  - Resultado requerido: RLS habilitado + policies adecuadas + grants correctos.
  - Evidencia: output crudo (sin traducciones).
  - Actualizar: docs/SECURITY_ADVISOR_REVIEW_2026-01-30.md,
               docs/DECISION_LOG.md, docs/ESTADO_ACTUAL.md, docs/CHECKLIST_CIERRE.md.

- [ ] P0-02 Re-auditoria RLS completa (psql o SQL Editor)
  - Ejecutar scripts/rls_audit.sql con DATABASE_URL o en SQL Editor.
  - Confirmar tablas P0 (productos, stock_deposito, movimientos_deposito,
    precios_historicos, proveedores, personal, categorias).
  - Guardar output y actualizar docs/AUDITORIA_RLS_CHECKLIST.md.

- [ ] P0-04 Remediar policies/grants en tablas P0 sin policies
  - Tablas: `productos`, `proveedores`, `categorias`.
  - Acciones minimas: crear policies SELECT para `authenticated` y revocar `anon`.
  - Versionar en migracion y aplicar en STAGING/PROD.

- [ ] P0-03 Decision de rotacion de secretos (si hubo exposicion historica)
  - Referencia: docs/DECISION_LOG.md (pendiente).
  - Si se rota, re-sincronizar Supabase + CI + .env.test y registrar.

## 5) Pendientes unificados (P1/P2)
Este es el backlog unificado y verificado por evidencia local.

### Seguridad y Accesos
- [ ] P1-01 Verificar grants reales para anon/authenticated en tablas criticas
  - Referencia: salida de COMET (Snapshot ANTES/DESPUES).
- [ ] P1-02 Security scanning automatizado en CI (no hay workflow CodeQL/Snyk)
  - Referencia: docs/closure/PROJECT_CLOSURE_REPORT.md.
- [ ] P1-03 Revisión de seguridad por humano (modulos P0)
  - Referencia: docs/closure/PROJECT_CLOSURE_REPORT.md.

### CI/CD y Validaciones
- [ ] P1-04 WS6.2 Validacion de envs requeridas antes de build/deploy
  - Referencia: docs/ROADMAP.md.
- [ ] P1-05 Habilitar integration/e2e en CI (hoy son gated/manual)
  - Referencia: docs/closure/PROJECT_CLOSURE_REPORT.md y .github/workflows/ci.yml.
- [ ] P1-06 k6 real / performance automatizado (actual es baseline Vitest)
  - Referencia: docs/closure/PROJECT_CLOSURE_REPORT.md.

### Ops / Observabilidad / Backup
- [ ] P1-07 Monitoring y alertas externas configuradas (no verificado)
  - Referencia: docs/closure/PROJECT_CLOSURE_REPORT.md.
- [ ] P1-08 Backup strategy documentada y probada + DR plan
  - Referencia: docs/closure/PROJECT_CLOSURE_REPORT.md.
- [ ] P1-09 Dashboard de metricas en vivo (cron/jobs)
  - Referencia: docs/CHECKLIST_CIERRE.md, docs/mpc/SUB_PLAN_04_CRON_JOBS.md.

### Documentacion y Gobernanza
- [ ] P1-10 Confirmar licencia oficial (LICENSE indica pendiente)
  - Accion: elegir licencia + owner + limpiar nota.
- [ ] P1-11 Onboarding guide para nuevos devs (no existe archivo)
  - Buscar/crear doc de onboarding.
- [ ] P1-12 Reconciliar PLAN_EJECUCION.md (marcado incompleto en CHECKLIST_CIERRE)
  - Estado actual: archivo no existe. Crear o quitar referencia.

### Producto / UX (no bloqueante)
- [ ] P2-01 Frontend: graficos en rentabilidad
- [ ] P2-02 Frontend: skeleton loaders
- [ ] P2-03 Frontend: mas tests de integracion
- [ ] P2-04 Frontend: PWA offline basico
- [ ] P2-05 Frontend: keyboard shortcuts
  - Referencia: docs/mpc/SUB_PLAN_02_FRONTEND_CORE.md

### Backend / Scraper / Cron / Notificaciones (no bloqueante)
- [ ] P2-06 Gateway: dividir api-minimarket/index.ts (1629 lineas) en routers
- [ ] P2-07 Gateway: rate limit por usuario (ademas de IP)
- [ ] P2-08 Gateway: OpenAPI para endpoints nuevos
  - Referencia: docs/mpc/SUB_PLAN_01_GATEWAY_API_MINIMARKET.md
- [ ] P2-09 Scraper: retry inteligente por categoria
- [ ] P2-10 Scraper: metricas de exito por categoria
- [ ] P2-11 Scraper: considerar headless browser
- [ ] P2-12 Scraper: dashboard de estado scraping
  - Referencia: docs/mpc/SUB_PLAN_03_SCRAPER_MAXICONSUMO.md
- [ ] P2-13 Cron: dashboard de ejecuciones
- [ ] P2-14 Cron: retry con backoff
- [ ] P2-15 Cron: alertas por fallo
  - Referencia: docs/mpc/SUB_PLAN_04_CRON_JOBS.md
- [ ] P2-16 Notificaciones: push/email
- [ ] P2-17 Notificaciones: dashboard en frontend
- [ ] P2-18 Notificaciones: umbrales por usuario
  - Referencia: docs/mpc/SUB_PLAN_06_ALERTAS_NOTIFICACIONES.md

## 6) Paso a paso (ruta minima a Produccion)
Secuencia recomendada desde el estado actual:
1) Ejecutar COMET Prompt 1 y 2 (RLS). Guardar output crudo.
2) Si hay cambios, versionar una migracion RLS en supabase/migrations/.
3) Ejecutar scripts/rls_audit.sql y actualizar docs/AUDITORIA_RLS_CHECKLIST.md.
4) Resolver decision de rotacion de secretos (si aplica) y re-sincronizar CI/Edge.
5) Validacion minima antes de release:
   - ./migrate.sh status staging
   - scripts/run-integration-tests.sh --dry-run
   - npm run test:unit
   - cd minimarket-system && pnpm run build:prod
   - deno check --no-lock --node-modules-dir=auto supabase/functions/**/index.ts
6) Actualizar docs (SECURITY_ADVISOR_REVIEW, DECISION_LOG, ESTADO_ACTUAL, CHECKLIST_CIERRE).
7) Revisiones P1 (si se requiere hardening para produccion estricta):
   - Monitoring/alertas externas
   - Backup/DR documentado
   - Security scanning en CI

## 7) Evidencia minima a capturar (para cierre)
- Output crudo SQL (RLS + policies + grants).
- Logs de verificacion (migrate status, dry-run, tests clave).
- Registro en DECISION_LOG de cambios criticos.

## 8) Estado de este documento
Este documento centraliza pendientes y pasos hasta produccion.
Se debe actualizar cuando:
- Se cierre un item P0/P1.
- Se ejecute una verificacion clave (RLS, migraciones, tests).

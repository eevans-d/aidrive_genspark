# Open Issues (Canónico)

**Última actualización:** 2026-02-13 (revalidación operativa)
**Fuente principal:** `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md`
**Limpieza de restos:** `docs/closure/RESTOS_CIERRE_2026-02-13.md` (13/15 cerrados, 2/15 abiertos por owner/infra)

---

## P0 (bloquean cierre Piloto)

| Pendiente | Gate | Estado | Evidencia actual | Siguiente acción |
|-----------|------|--------|------------------|------------------|
| ~~E2E completo de POS (flujo venta end-to-end)~~ | 3 | ✅ CERRADO | 8/8 tests E2E Playwright PASS. `minimarket-system/e2e/pos.e2e.spec.ts`. Evidencia: `docs/closure/EVIDENCIA_GATE3_2026-02-12.md`. | — |
| ~~Canal real de alertas stock bajo al operador~~ | 4 | ✅ CERRADO | `cron-notifications` envía emails reales vía SendGrid, Slack vía webhook, webhooks genéricos. SendGrid messageIds confirmados. Evidencia: `docs/closure/EVIDENCIA_GATE4_2026-02-12.md`. | — |
| Monitoreo real en producción | 16 | ⚠️ PARCIAL | `@sentry/react@10.38.0` integrado, `Sentry.init()` + `Sentry.captureException()` funcional. Build PASS. DSN pendiente del owner. Evidencia: `docs/closure/EVIDENCIA_GATE16_2026-02-12.md`. | Owner: crear proyecto Sentry, obtener DSN, configurar `VITE_SENTRY_DSN` en Vercel/env. |
| ~~Endurecimiento CI legacy suites~~ | 18 | ✅ CERRADO | Job `security-tests` obligatorio/bloqueante en CI. Política GO/NO-GO documentada. Evidencia: `docs/closure/EVIDENCIA_GATE18_2026-02-12.md`. | — |

---

## P1 (riesgo medio)

| Pendiente | Estado | Siguiente acción |
|-----------|--------|------------------|
| ~~Backup automatizado + restore probado~~ | ✅ CERRADO (Gate 15) | `db-backup.sh` con gzip/retención + `db-restore-drill.sh` + `backup.yml` GitHub Actions cron diario. Evidencia: `docs/closure/EVIDENCIA_GATE15_2026-02-12.md`. |
| ~~Validación fina de RLS por reglas de negocio/rol~~ | ✅ CERRADO | Migración `20260212130000_rls_fine_validation_lockdown.sql` + batería reproducible `scripts/rls_fine_validation.sql` ejecutada con `write_tests=1` y **0 FAIL**. Evidencia canónica: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-12.log`, `docs/closure/EVIDENCIA_RLS_FINE_2026-02-12.log`. Revalidación operativa por rol (gateway) 2026-02-13: `docs/closure/EVIDENCIA_RLS_SMOKE_ROLES_2026-02-13.md` (**3/3 PASS**). |
| Rotación preventiva de secretos pre-producción | ⚠️ PARCIAL | Ejecutar plan de `docs/SECRET_ROTATION_PLAN.md` con evidencia sin exponer valores. |

---

## Notas operativas

- Migraciones: baseline histórico 2026-02-12 reportó `38/38` remoto; conteo versionado local actual: `35` migraciones SQL.
- Baseline remoto vigente: 13 funciones activas; `api-minimarket v21` con `verify_jwt=false`.
- `cron-notifications` actualizada: envío real vía SendGrid cuando `NOTIFICATIONS_MODE=real`.
- `api-minimarket` debe mantenerse con `verify_jwt=false`.
- Hardening 5 pasos: cerrado (en estado vigente: `ErrorMessage` 12/13 páginas no-test).
- Estado actual UI: `ErrorMessage` en 12/13 páginas (`Pos.tsx` mantiene feedback por toast orientado a operación rápida).
- Revalidación SQL en este host (2026-02-13) quedó bloqueada por conectividad IPv6 a `db.<project-ref>.supabase.co:5432` (`Network is unreachable`); re-ejecutar `scripts/rls_audit.sql` y `scripts/rls_fine_validation.sql` en runner con salida IPv6.
- Referencias a `checkRole(['admin','deposito','jefe'])` en logs históricos/worktrees se consideran **no canónicas**; rol operativo vigente: `admin|deposito|ventas` con alias legacy `jefe -> admin`.
- **Veredicto: CON RESERVAS** — sistema defendible para producción piloto.

## Cerrados recientes (2026-02-12, sesión de ejecución)

- ✅ Gate 3: E2E POS 8/8 tests PASS (Playwright).
- ✅ Gate 4: Canal real alertas operador (SendGrid + Slack + Webhook).
- ✅ Gate 18: CI hardening con `security-tests` como gate bloqueante.
- ✅ Gate 15: Backup automatizado + restore drill + GitHub Actions cron.
- ✅ Credenciales visibles en login eliminadas.
- ✅ Enlaces rotos documentales reparados.
- ✅ Fallback legacy en cron-testing-suite removido.
- ✅ Snapshot vigente en `ESTADO_ACTUAL` normalizado contra baseline remoto.
- ✅ Adopción `ErrorMessage` elevada a 12/13 páginas funcionales y estandarizada en `Login`, `Clientes`, `Deposito`, `Pocket`, `Pedidos`.

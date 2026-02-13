# Open Issues (Canónico)

**Última actualización:** 2026-02-13 (revalidación SQL RLS cerrada)
**Fuente principal:** `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md`

## Estado Mega Plan (2026-02-13)

| Tarea | Estado | Evidencia |
|---|---|---|
| T01 (M3.S1) | ✅ PASS | `docs/closure/EVIDENCIA_M3_S1_2026-02-13.md` |
| T02 (M5.S1) | ✅ PASS | `docs/closure/EVIDENCIA_M5_S1_2026-02-13.md` |
| T03 (M5.S2) | ✅ PASS | `docs/closure/EVIDENCIA_M5_S2_2026-02-13.md` |
| T04 (M8.S1) | ✅ PASS | `docs/closure/EVIDENCIA_M8_S1_2026-02-13.md` |
| T05 (M6.S1) | ✅ PASS | `docs/closure/EVIDENCIA_M6_S1_2026-02-13.md` |
| T06 (M2.S1) | ✅ PASS | `docs/closure/EVIDENCIA_M2_S1_2026-02-13.md` |
| T07 (M2.S2) | ✅ PASS | `docs/closure/EVIDENCIA_M2_S2_2026-02-13.md` |
| T08 (M3.S2) | ✅ PASS | `docs/closure/EVIDENCIA_M3_S2_2026-02-13.md` |
| T09 (M6.S2) | ⚠️ BLOCKED (owner) | `docs/closure/EVIDENCIA_M6_S2_2026-02-13.md` |
| T10 (M7 cierre) | ✅ PASS (doc sync) | `docs/closure/EVIDENCIA_M7_CIERRE_2026-02-13.md` |

Checkpoints obligatorios:

- `docs/closure/CHECKPOINT_T01_T02_2026-02-13.md`
- `docs/closure/CHECKPOINT_T03_T04_2026-02-13.md`
- `docs/closure/CHECKPOINT_T05_T06_2026-02-13.md`
- `docs/closure/CHECKPOINT_T07_T08_2026-02-13.md`
- `docs/closure/CHECKPOINT_T09_T10_2026-02-13.md`

---

## P0 (bloquean cierre Piloto)

| Pendiente | Gate | Estado | Evidencia actual | Siguiente acción |
|-----------|------|--------|------------------|------------------|
| ~~E2E completo de POS (flujo venta end-to-end)~~ | 3 | ✅ CERRADO | 8/8 tests E2E Playwright PASS. `minimarket-system/e2e/pos.e2e.spec.ts`. Evidencia: `docs/closure/EVIDENCIA_GATE3_2026-02-12.md`. | — |
| ~~Canal real de alertas stock bajo al operador~~ | 4 | ✅ CERRADO | `cron-notifications` envía emails reales vía SendGrid, Slack vía webhook, webhooks genéricos. SendGrid messageIds confirmados. Evidencia: `docs/closure/EVIDENCIA_GATE4_2026-02-12.md`. | — |
| Monitoreo real en producción | 16 | ⚠️ PARCIAL / OWNER | `@sentry/react@10.38.0` integrado, `Sentry.init()` + `Sentry.captureException()` funcional. Build PASS. DSN pendiente del owner. Evidencia: `docs/closure/EVIDENCIA_GATE16_2026-02-12.md`, `docs/closure/EVIDENCIA_M6_S2_2026-02-13.md`. | Owner: crear proyecto Sentry, obtener DSN, configurar `VITE_SENTRY_DSN` en Vercel/env. |
| ~~Endurecimiento CI legacy suites~~ | 18 | ✅ CERRADO | Job `security-tests` obligatorio/bloqueante en CI. Política GO/NO-GO documentada. Evidencia: `docs/closure/EVIDENCIA_GATE18_2026-02-12.md`. | — |

---

## P1 (riesgo medio)

| Pendiente | Estado | Siguiente acción |
|-----------|--------|------------------|
| ~~Backup automatizado + restore probado~~ | ✅ CERRADO (Gate 15) | `db-backup.sh` con gzip/retención + `db-restore-drill.sh` + `backup.yml` GitHub Actions cron diario. Evidencia: `docs/closure/EVIDENCIA_GATE15_2026-02-12.md`. |
| ~~Validación fina de RLS por reglas de negocio/rol~~ | ✅ CERRADO | Migración `20260212130000_rls_fine_validation_lockdown.sql` + batería reproducible `scripts/rls_fine_validation.sql` ejecutada con `write_tests=1` y **0 FAIL**. Revalidación 2026-02-13 completada en este host: smoke por rol + SQL remota (`60/60 PASS`). Evidencias: `docs/closure/EVIDENCIA_RLS_SMOKE_ROLES_2026-02-13.md`, `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log`, `docs/closure/EVIDENCIA_RLS_FINE_2026-02-13.log`, `docs/closure/EVIDENCIA_RLS_REVALIDACION_2026-02-13.md`. |
| Rotación preventiva de secretos pre-producción | ⚠️ PARCIAL | `API_PROVEEDOR_SECRET` rotado y validado (2026-02-13): `docs/closure/SECRET_ROTATION_2026-02-13_031253.md`. Pendiente owner: rotar `SENDGRID_API_KEY`/`SMTP_PASS` y validar delivery real. |

---

## Notas operativas

- Migraciones: `39/39` local=remoto (actualización 2026-02-13, incluye `20260213030000`).
- Baseline histórico 2026-02-12: 13 funciones activas; `api-minimarket v21` con `verify_jwt=false`.
- Snapshot remoto actual 2026-02-13: `docs/closure/BASELINE_LOG_2026-02-13_031900.md`.
- `cron-notifications` actualizada: envío real vía SendGrid cuando `NOTIFICATIONS_MODE=real`.
- `api-minimarket` debe mantenerse con `verify_jwt=false`.
- Hardening 5 pasos: cerrado (incluye `ErrorMessage` 13/13 en páginas no-test).
- Revalidación RLS 2026-02-13: smoke por rol en PASS (`/clientes`, `/pedidos`) y SQL fina remota en PASS (`60/60`, `0 FAIL`).
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
- ✅ Adopción `ErrorMessage` completada en 13/13 páginas funcionales.

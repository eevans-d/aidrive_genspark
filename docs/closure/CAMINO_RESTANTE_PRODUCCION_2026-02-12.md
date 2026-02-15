# Camino Restante a Produccion (Vigente)

**Fecha:** 2026-02-15  
**Estado global:** `CON RESERVAS` (defendible para producción piloto)  
**Objetivo:** cerrar lo pendiente (higiene SendGrid + backups si aplica) y dejar checklist operativo sin ambiguedades.

## 1) Estado real confirmado (base 2026-02-13)

- Baseline remoto: 13 Edge Functions activas, `api-minimarket v26 verify_jwt=false`.
  Evidencia: `docs/ESTADO_ACTUAL.md`, `docs/closure/BASELINE_LOG_2026-02-13_061916.md`.
- Revalidacion remota en vivo (2026-02-13): `supabase migration list --linked` y `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi` confirman `39/39` y versiones vigentes.
- Mini plan de hardening 5/5 cerrado (credenciales, links, fallback cron, baseline, ErrorMessage 13/13).
  Evidencia: `scripts/verify_5steps.sh`, `docs/closure/CIERRE_5PASOS_2026-02-12.md`.
- Quality gates locales en PASS (unit + frontend tests + build).
  Evidencia: `test-reports/quality-gates_20260213-061657.log`.
- Validación fina de RLS por rol (P1) cerrada: `supabase/migrations/20260212130000_rls_fine_validation_lockdown.sql` + `scripts/rls_fine_validation.sql` ejecutado (`write_tests=1`) con **0 FAIL**.
  Evidencia: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log`, `docs/closure/EVIDENCIA_RLS_FINE_2026-02-13.log`, `docs/closure/EVIDENCIA_RLS_REVALIDACION_2026-02-13.md`.
- Rotación de `API_PROVEEDOR_SECRET` completada con éxito y rollback controlado.
  Evidencia: `docs/closure/SECRET_ROTATION_2026-02-13_031253.md`.
- Smoke por rol revalidado en gateway (admin/ventas/deposito).
  Evidencia: `docs/closure/EVIDENCIA_RLS_SMOKE_ROLES_2026-02-13.md`.

## 2) Gaps reales que bloquean produccion

| Gate | Estado | Gap real | Evidencia |
|---|---|---|---|
| 3 | ✅ CERRADO | — | `docs/closure/EVIDENCIA_GATE3_2026-02-12.md` |
| 4 | ✅ CERRADO | Smoke real + Email Activity `delivered` confirmados post-rotación. | `docs/closure/EVIDENCIA_GATE4_2026-02-12.md`, `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md` |
| 16 | ✅ CERRADO | Integracion Sentry + ingest tecnico + evidencia visual/alerta confirmadas en `production`. | `docs/closure/EVIDENCIA_GATE16_2026-02-14.md` |
| 18 | ✅ CERRADO | — | `docs/closure/EVIDENCIA_GATE18_2026-02-12.md` |
| 15 | ✅ CERRADO (código) | Activación operativa depende de configurar `SUPABASE_DB_URL` en GitHub Secrets y ejecutar el workflow (si aún no se hizo). | `docs/closure/EVIDENCIA_GATE15_2026-02-12.md` |
| Secret Rotation P1 | ✅ CERRADO | `API_PROVEEDOR_SECRET` ya rotado; SendGrid re-rotado + delivery confirmado en Email Activity. | `docs/closure/SECRET_ROTATION_2026-02-13_031253.md`, `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md` |

## 3) Plan de ejecucion restante (paso por paso / tarea por tarea)

### Paso 1 - Gate 16 (Monitoreo real - Sentry) [CERRADO]

**Resultado final:**
1. Evento confirmado en dashboard Sentry (`Issue URL` + `Event ID` + `environment=production`).
2. Regla de alerta `Send a notification for high priority issues` en `Enabled` con filtro `environment=production`.
3. Evidencia consolidada en `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`.

**Definition of Done (Gate 16):** cumplida.

### Paso 2 - Rotación SendGrid (owner)

**Estado (2026-02-15):** ya ejecutado y validado (smoke real + Email Activity `delivered`). Evidencia: `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`.

Acción final recomendada (higiene):
1. En SendGrid Dashboard -> Settings -> API Keys, revocar la API key anterior si aún está activa (solo luego de confirmar el delivery).
2. Registrar evidencia (sin exponer valores) en `docs/closure/` (keys listadas + estado Active/Revoked).

Recomendado (no bloqueante para piloto si se usa sender verificado):
- Configurar Domain Authentication para `minimarket-system.com` (requiere DNS) para permitir `SMTP_FROM="noreply@minimarket-system.com"`.

### Paso 3 - Activar/operativizar backups (si aún no está activado)

**Owner (GitHub):**
1. Configurar secret `SUPABASE_DB_URL` en GitHub (repo settings → Secrets).
2. (Opcional) Ajustar `BACKUP_RETENTION_DAYS`.
3. Ejecutar manualmente el workflow `Scheduled Database Backup` para generar el primer artifact.
4. Descargar un backup y ejecutar un restore drill contra base staging con `scripts/db-restore-drill.sh`.

**Nota de seguridad:** los artifacts contienen dumps SQL completos. Para producción “full”, considerar cifrado previo a upload o storage externo.

### Paso 4 - Cierre documental (si cambió el veredicto)

1. Actualizar `docs/ESTADO_ACTUAL.md`, `docs/closure/OPEN_ISSUES.md` y `docs/DECISION_LOG.md`.
2. Con SendGrid/SMTP ya cerrado (2026-02-15), evaluar mover el veredicto a `LISTO` (o el criterio vigente de Plan Maestro) si no quedan otras reservas operativas.

## 4) Orden recomendado de ejecucion

1. SendGrid (externo): (opcional) revocar la API key anterior si aún está activa
2. Backups (activación owner, si aplica)
3. Cierre documental final (actualizar estado a "sin reservas" si ya no quedan pendientes externos)

## 5) Nota de control

SendGrid/SMTP ya no bloquea: Gate 4 quedó revalidado con evidencia externa el **2026-02-15**. Si se desea reducir superficie de riesgo, revocar API keys anteriores en SendGrid.

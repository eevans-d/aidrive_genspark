# Camino Restante a Produccion (Vigente)

**Fecha:** 2026-02-13  
**Estado global:** `CON RESERVAS` (defendible para producción piloto)  
**Objetivo:** cerrar lo pendiente (principalmente Gate 16) y dejar checklist operativo sin ambigüedades.

## 1) Estado real confirmado (base 2026-02-13)

- Baseline remoto: 13 Edge Functions activas, `api-minimarket v22 verify_jwt=false`.
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
| 4 | ✅ CERRADO | — | `docs/closure/EVIDENCIA_GATE4_2026-02-12.md` |
| 16 | ⚠️ PARCIAL (BLOCKED owner) | Falta DSN real (`VITE_SENTRY_DSN`) para activar monitoreo y validar evento real en Sentry. | `docs/closure/EVIDENCIA_GATE16_2026-02-12.md` |
| 18 | ✅ CERRADO | — | `docs/closure/EVIDENCIA_GATE18_2026-02-12.md` |
| 15 | ✅ CERRADO (código) | Activación operativa depende de configurar `SUPABASE_DB_URL` en GitHub Secrets y ejecutar el workflow (si aún no se hizo). | `docs/closure/EVIDENCIA_GATE15_2026-02-12.md` |
| Secret Rotation P1 | ⚠️ PARCIAL | `API_PROVEEDOR_SECRET` ya rotado; falta rotación SendGrid (`SENDGRID_API_KEY`/`SMTP_PASS`) por Dashboard owner. | `docs/closure/SECRET_ROTATION_2026-02-13_031253.md` |

## 3) Plan de ejecucion restante (paso por paso / tarea por tarea)

### Paso 1 - Cerrar Gate 16 (Monitoreo real - Sentry)

**Owner (externo, obligatorio):**
1. Crear proyecto Sentry (React) y obtener DSN real.
2. Configurar `VITE_SENTRY_DSN` en entorno de despliegue (ej. Vercel) y redeploy.

**Ejecutor (repo, verificable):**
1. Confirmar que `@sentry/react` está instalado y que `Sentry.init()` es condicional.
2. Ejecutar `pnpm -C minimarket-system build` y validar que el build sigue en PASS.
3. Disparar un error controlado (solo en staging/dev) para generar un evento y confirmar que aparece en Sentry.
4. Documentar cierre actualizando `docs/closure/EVIDENCIA_GATE16_2026-02-12.md` (o creando nuevo archivo fechado, sin pegar DSN).

**Definition of Done (Gate 16):** evento visible en Sentry + alerta operativa confirmada.

### Paso 2 - Rotación SendGrid (owner)

1. Crear nueva API key en SendGrid Dashboard.
2. Ejecutar:
   - `supabase secrets set SENDGRID_API_KEY=<new> SMTP_PASS=<new> SMTP_USER=apikey --project-ref dqaygmjpzoqjjrywdsxi`
3. Redeploy:
   - `supabase functions deploy notificaciones-tareas --use-api`
   - `supabase functions deploy cron-notifications --use-api`
4. Validar entrega real en SendGrid Activity y registrar evidencia.

### Paso 3 - Activar/operativizar backups (si aún no está activado)

**Owner (GitHub):**
1. Configurar secret `SUPABASE_DB_URL` en GitHub (repo settings → Secrets).
2. (Opcional) Ajustar `BACKUP_RETENTION_DAYS`.
3. Ejecutar manualmente el workflow `Scheduled Database Backup` para generar el primer artifact.
4. Descargar un backup y ejecutar un restore drill contra base staging con `scripts/db-restore-drill.sh`.

**Nota de seguridad:** los artifacts contienen dumps SQL completos. Para producción “full”, considerar cifrado previo a upload o storage externo.

### Paso 4 - Cierre documental (si cambió el veredicto)

1. Actualizar `docs/ESTADO_ACTUAL.md`, `docs/closure/OPEN_ISSUES.md` y `docs/DECISION_LOG.md`.
2. Si Gate 16 se cierra, mover el veredicto a `LISTO` (o el criterio vigente de Plan Maestro).

## 4) Orden recomendado de ejecucion

1. Gate 16 (DSN + verificación)
2. Rotación SendGrid (owner)
3. Backups (activación owner, si aplica)
4. Cierre documental final

## 5) Nota de control

Mientras Gate 16 no esté cerrado con evidencia, el proyecto se mantiene en `CON RESERVAS` para piloto (sin monitoreo real activo).

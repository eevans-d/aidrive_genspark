# Monitoring Operativo

Estado: Activo
Audiencia: Soporte operativo
Ultima actualizacion: 2026-03-12
Fuente de verdad: docs/ESTADO_ACTUAL.md
Owner documental: Operacion + Infra

> Referencias y conteos: segun FactPack 2026-03-12.

## Objetivo
Definir monitoreo diario/semanal para detectar degradacion temprano y sostener continuidad operativa.

## Smoke Check Operativo (Nuevo estandar)
Script oficial: `node scripts/ops-smoke-check.mjs`

Endpoints criticos (bloqueantes):
- `/functions/v1/api-minimarket/health`
- `/functions/v1/api-proveedor/health`

Endpoint opcional (solo si hay service role):
- `/functions/v1/cron-health-monitor/health-check`

### Ejecucion rapida
Local:
```bash
OPS_SMOKE_TARGET=local node scripts/ops-smoke-check.mjs
```

Remoto:
```bash
OPS_SMOKE_TARGET=remote SUPABASE_URL="https://<project-ref>.supabase.co" node scripts/ops-smoke-check.mjs
```

Remoto con autenticacion de `api-proveedor/health`:
```bash
OPS_SMOKE_TARGET=remote \
SUPABASE_URL="https://<project-ref>.supabase.co" \
OPS_SMOKE_API_PROVEEDOR_AUTHORIZATION="Bearer $SUPABASE_SERVICE_ROLE_KEY" \
OPS_SMOKE_API_PROVEEDOR_SECRET="$API_PROVEEDOR_SECRET" \
node scripts/ops-smoke-check.mjs
```

Remoto + check opcional cron (sin exponer valor):
```bash
OPS_SMOKE_TARGET=remote \
SUPABASE_URL="https://<project-ref>.supabase.co" \
OPS_SMOKE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
node scripts/ops-smoke-check.mjs
```

### Variables soportadas
| Variable | Default | Uso |
|---|---|---|
| `OPS_SMOKE_TARGET` | `local` | Selecciona destino `local` o `remote`. |
| `OPS_SMOKE_TIMEOUT_MS` | `6000` | Timeout por request. |
| `OPS_SMOKE_RETRIES` | `1` | Reintentos por endpoint. |
| `OPS_SMOKE_RETRY_DELAY_MS` | `800` | Espera entre reintentos. |
| `OPS_SMOKE_BASE_URL` | N/A | Override total de base URL (`.../functions/v1`). |
| `OPS_SMOKE_LOCAL_BASE_URL` | `http://127.0.0.1:54321/functions/v1` | Base local si `target=local`. |
| `OPS_SMOKE_REMOTE_BASE_URL` | N/A | Base remota si `target=remote`. |
| `OPS_SMOKE_SERVICE_ROLE_KEY` | N/A | Habilita check opcional de cron monitor. |
| `OPS_SMOKE_API_PROVEEDOR_SECRET` | N/A | Header `x-api-secret` para `api-proveedor/health`. |
| `OPS_SMOKE_API_PROVEEDOR_AUTHORIZATION` | N/A | Header `Authorization` opcional para proveedor. |
| `OPS_SMOKE_AUTHORIZATION` | N/A | Fallback de Authorization para checks que lo requieran. |
| `SUPABASE_URL` | N/A | Fallback para construir base remota. |

### Interpretacion de salida
- `[PASS]`: endpoint respondio `2xx`.
- `[FAIL]`: intento fallido (HTTP no-2xx o error de red/timeout).
- `[FAIL_FINAL]`: endpoint agotado tras retries.
- `[SUMMARY]`: resumen final.
- `401` en `api-proveedor/health`: validar `OPS_SMOKE_API_PROVEEDOR_SECRET`.
- `401` con proveedor y `verify_jwt=true`: validar `OPS_SMOKE_API_PROVEEDOR_AUTHORIZATION`.

Exit codes:
- `0`: todos los checks criticos en PASS.
- `1`: fallo al menos un check critico.
- `2`: error de configuracion de variables.

## Procedimiento Paso A Paso
### A. Chequeo diario (inicio de jornada)
1. Confirmar disponibilidad de frontend:
   - `https://aidrive-genspark.pages.dev`
2. Ejecutar smoke check operativo:
   - `OPS_SMOKE_TARGET=remote SUPABASE_URL="https://<project-ref>.supabase.co" node scripts/ops-smoke-check.mjs`
3. Revisar alertas del sistema en UI.
4. Verificar pendientes criticos en `/cuaderno` y `/tareas`.

### B. Chequeo semanal
1. Revisar tendencia de errores en logs de Edge Functions.
2. Revisar ejecuciones de cron jobs y alertas activas.
3. Validar estado de backups y restauracion de prueba.
4. Correr verificacion documental de links.

## Endpoints Y Senales Clave
| Componente | Endpoint/Fuente | Frecuencia |
|---|---|---|
| Gateway principal | `/functions/v1/api-minimarket/health` | Diario |
| API proveedor | `/functions/v1/api-proveedor/health` | Diario |
| Cron health monitor | `/functions/v1/cron-health-monitor/health-check` | Semanal (si hay service role) |
| Dashboard cron | Edge Function `cron-dashboard` | Semanal |

Comandos base:
```bash
OPS_SMOKE_TARGET=remote SUPABASE_URL="https://<project-ref>.supabase.co" node scripts/ops-smoke-check.mjs
```

## Tablas De Observabilidad Relevantes
- `cron_jobs_execution_log`
- `cron_jobs_metrics`
- `cron_jobs_alerts`
- `cron_jobs_health_checks`

## Umbrales Operativos Iniciales
| Senal | Umbral de alerta |
|---|---|
| Health endpoint no 200 | Alerta inmediata |
| Error 5xx recurrente en gateway | >3 eventos en 15 min |
| Falla de cron critico | 1 corrida fallida sin recuperacion |
| Acumulacion de faltantes criticos | Tendencia creciente por 3 dias |

## Errores Comunes
1. Revisar solo frontend y no backend.
2. Correr smoke check sin definir target/base URL de forma explicita.
3. No guardar evidencia de hora y endpoint.
4. No diferenciar incidente puntual vs patron.
5. Escalar sin identificar si la falla es de un endpoint critico o de uno opcional.

## Verificacion
Checks recomendados:
```bash
# Documentacion operativa consistente
node scripts/validate-doc-links.mjs

# Smoke operativo rapido (SLO de disponibilidad)
OPS_SMOKE_TARGET=local node scripts/ops-smoke-check.mjs
```

## Escalacion
Nivel 1:
- Operador detecta desvio y ejecuta chequeo diario.

Nivel 2:
- Responsable interno valida logs y cron.

Nivel 3:
- Soporte tecnico abre incidente formal con evidencia:
  - endpoint afectado
  - timestamp
  - status code
  - requestId (si existe)
  - impacto operativo

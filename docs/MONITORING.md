# Monitoring Operativo

Estado: Activo
Audiencia: Soporte operativo
Ultima actualizacion: 2026-02-21
Fuente de verdad: docs/ESTADO_ACTUAL.md
Owner documental: Operacion + Infra

> Referencias y conteos: segun FactPack 2026-02-21.

## Objetivo
Definir monitoreo diario/semanal para detectar degradacion temprano y sostener continuidad operativa.

## Procedimiento Paso A Paso
### A. Chequeo diario (inicio de jornada)
1. Confirmar disponibilidad de frontend:
   - `https://aidrive-genspark.pages.dev`
2. Validar health de APIs:
   - `api-minimarket/health`
   - `api-proveedor/health`
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
| Estado proveedor | `/functions/v1/api-proveedor/status` | Diario (con auth) |
| Cron health monitor | Edge Function `cron-health-monitor` | Diario/Semanal |
| Dashboard cron | Edge Function `cron-dashboard` | Semanal |

Comandos base:
```bash
curl -i "$SUPABASE_URL/functions/v1/api-minimarket/health"
curl -i "$SUPABASE_URL/functions/v1/api-proveedor/health"
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
2. Verificar `/status` sin headers de autenticacion cuando aplica.
3. No guardar evidencia de hora y endpoint.
4. No diferenciar incidente puntual vs patron.

## Verificacion
Checks recomendados:
```bash
# Documentacion operativa consistente
node scripts/validate-doc-links.mjs

# Smoke funcional backend/frontend (si aplica entorno)
node scripts/smoke-minimarket-features.mjs
node scripts/smoke-notifications.mjs
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

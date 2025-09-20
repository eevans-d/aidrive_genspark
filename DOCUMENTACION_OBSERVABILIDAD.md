# Observabilidad del Dashboard Mini Market

Este documento resume cómo están implementados los logs, la correlación por request y las métricas del dashboard.

## Logging estructurado (JSON)

- Formato: cada línea es un objeto JSON con los campos:
  - `ts`: timestamp UTC ISO8601 (sufijo Z)
  - `level`: nivel (INFO/ERROR, etc.)
  - `logger`: nombre de logger
  - `msg`: mensaje breve (por ejemplo, "GET /api/summary -> 200")
  - `request_id`: correlación por request
  - `path`, `method`, `status`, `duration_ms`, `client_ip` (si aplica)
- Handlers:
  - Consola (stdout)
  - Archivo rotativo diario: `logs/dashboard.log` (por defecto)
- Config vía variables de entorno:
  - `DASHBOARD_LOG_LEVEL` (INFO por defecto)
  - `DASHBOARD_LOG_DIR` (ruta de logs, por defecto `inventario-retail/web_dashboard/logs`)
  - `DASHBOARD_LOG_ROTATE_WHEN` (midnight)
  - `DASHBOARD_LOG_BACKUP_COUNT` (7)

## Request-ID

- Header soportado: `X-Request-ID`
- Si el cliente no lo envía, el servidor genera uno (UUID hex).
- El middleware adjunta `X-Request-ID` a todas las respuestas.
- El valor se incluye en los logs para correlación end-to-end.

## Métricas (/metrics)

- Endpoint: `GET /metrics` (protegido con API Key)
- Formato: estilo Prometheus exposition (text/plain; version=0.0.4)
- Métricas expuestas:
  - `dashboard_requests_total` (counter)
  - `dashboard_errors_total` (counter, 5xx)
  - `dashboard_uptime_seconds` (gauge)
  - `dashboard_requests_by_path_total{path=...}` (counter)
  - `dashboard_errors_by_path_total{path=...}` (counter)
  - `dashboard_request_duration_ms_sum{path=...}` (counter)

## Buenas prácticas

- Propagar `X-Request-ID` desde el cliente si hay múltiples hops (proxy/API GW).
- Centralizar logs (ELK/EFK/Datadog) leyendo el archivo JSON o stdout.
- Scrappear `/metrics` desde Prometheus (agregar job y header de API key en el scrape si se usa un sidecar o exporter).

## Futuras mejoras

- Histograms de latencia por path (p50/p95) si integramos `prometheus_client` o `starlette_exporter`.
- OpenTelemetry para trazas distribuidas (trace_id/span_id, export a OTLP).
- Alertas (alertmanager) en `dashboard_errors_total` y latencia elevada.

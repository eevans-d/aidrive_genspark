# Runbook de Operaciones - Dashboard Mini Market

Procedimientos para operar, monitorear y solucionar problemas del Dashboard.

## Checklist de arranque
- Variables de entorno definidas (API Key, Allowed Hosts, HTTPS/HSTS, Rate Limit, Logging)
- Base de datos accesible
- Logs rotando a `${DASHBOARD_LOG_DIR}`
- Probes: `/health` responde 200

## Diagnóstico rápido
- Ver health: GET `/health`
- Ver métricas: GET `/metrics` con `X-API-Key`
- Revisar logs: `${DASHBOARD_LOG_DIR}/dashboard.log`
- Correlación: usar/propagar `X-Request-ID`

## Respuesta a incidentes comunes
- 401 en APIs: validar `X-API-Key` y valor en `DASHBOARD_API_KEY`
- 429 Too Many Requests: ajustar `DASHBOARD_RATELIMIT_*` o esperar la ventana
- 5xx frecuentes: inspeccionar logs con `request_id`, revisar consultas/BD
- CORS bloquea front externo: configurar `DASHBOARD_CORS_ORIGINS`
- Error de Host: setear `DASHBOARD_ALLOWED_HOSTS`

## Mantenimiento
- Rotación de logs vía `TimedRotatingFileHandler` (configurable)
- Respaldo de logs antes de depuración profunda
- Revisión de métricas de latencia y errores por ruta

## Prometheus/Grafana
- Scrape `/metrics` con API Key (via sidecar/exporter o auth en proxy)
- Paneles: solicitudes totales, errores 5xx, latencia por ruta, uptime

## Seguridad operativa
- Mantener la API Key fuera de repos y logs
- Forzar HTTPS en entornos públicos
- Limitar orígenes CORS

## Restauración de servicio
- Escalar workers Uvicorn/Gunicorn
- Reiniciar servicio tras cambios de env vars
- Verificar accesos en `/`, `/analytics`, `/providers`

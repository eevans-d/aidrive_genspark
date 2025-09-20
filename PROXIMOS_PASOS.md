# Próximos pasos (staging/producción, seguridad y observabilidad)

Esta checklist resume el plan para continuar. Marca cada ítem al completarlo.

## 1) Configurar secretos de Actions
- [ ] Staging: `STAGING_HOST`, `STAGING_USER`, `STAGING_KEY`, `STAGING_GHCR_TOKEN`, `STAGING_DASHBOARD_API_KEY`
- [ ] Producción: `PROD_HOST`, `PROD_USER`, `PROD_KEY`, `PROD_GHCR_TOKEN`, `PROD_DASHBOARD_API_KEY`

## 2) Preparar host de staging
- [ ] Instalar Docker y docker compose
- [ ] Copiar `deploy/compose/.env.dashboard` con valores reales
- [ ] Abrir puerto 8080 o configurar reverse proxy

## 3) Deploy a staging y verificación
- [ ] Ejecutar pipeline en `master`
- [ ] Validar que el job de deploy SSH corre
- [ ] Comprobar `/health` y `/metrics` en staging
- [ ] Revisar logs del contenedor

## 4) Release y deploy a producción
- [ ] Crear tag `v0.1.0` (o similar)
- [ ] Disparar pipeline de producción
- [ ] Validar servicio y preparar rollback a un tag previo

## 5) Reverse proxy con TLS
- [ ] Instalar y configurar Nginx/Traefik con TLS (Let’s Encrypt)
- [ ] Habilitar HSTS y cabeceras de seguridad

## 6) Persistencia y backups
- [ ] Mapear volúmenes a rutas del host (DB y logs)
- [ ] Programar cron de `backup_minimarket.sh`
- [ ] Probar `restore_minimarket.sh` periódicamente

## 7) Observabilidad (Prometheus/Grafana)
- [ ] Definir cómo scrappear `/metrics` con API Key (sidecar/proxy/job)
- [ ] Crear dashboards básicos
- [ ] Configurar Alertmanager (5xx, latencias altas, health)

## 8) Seguridad y supply chain
- [ ] Agregar Trivy/Grype al CI para escanear la imagen
- [ ] Generar/validar SBOM; activar Dependabot/Renovate
- [ ] Considerar firma de imágenes (cosign)

## 9) Calidad y pruebas
- [ ] pytest-cov con umbral mínimo (p.ej. 80%) y badge en README
- [ ] E2E con Playwright para flujos UI
- [ ] Carga con k6 (escenarios básicos)

## 10) Endurecimiento adicional
- [ ] Añadir SRI a assets externos y afinar CSP
- [ ] Migrar rate limiting a Redis si hay múltiples réplicas
- [ ] CSV streaming/paginado para exportaciones grandes
- [ ] DR: documentar RTO/RPO y ensayar restauración
- [ ] Mantenimiento SQLite (VACUUM/ANALYZE programados)
- [ ] Environments/branch protection con approvals para prod

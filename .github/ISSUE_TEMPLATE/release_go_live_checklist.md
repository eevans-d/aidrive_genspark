---
name: "Release Go-Live Checklist"
about: "Checklist para validar staging y ejecutar go-live"
labels: ["release", "go-live"]
---

# Release Go-Live Checklist (v1.0.0)

## Preparación
- [ ] PR de release aprobado y mergeado a master
- [ ] Tag final `v1.0.0` creado y pusheado
- [ ] Credenciales/secretos verificados

## Staging
- [ ] Despliegue a staging exitoso
- [ ] `/health` OK
- [ ] `/metrics` expone métricas (con API key)
- [ ] Headers de seguridad verificados (CSP/HSTS)
- [ ] Dashboards de Grafana funcionales
- [ ] AlertManager sin alertas críticas

## Performance (opcional)
- [ ] Baseline OK (scripts/load_testing_suite.sh baseline)
- [ ] 100 req/s OK (scenario1)

## Go/No-Go
- [ ] Go aprobado por Tech Lead
- [ ] Go aprobado por Seguridad
- [ ] Go aprobado por Operaciones
- [ ] Go aprobado por Producto

## Producción (Blue-Green)
- [ ] Blue ready, Green activo
- [ ] Routeo 1% → 25% → 100%
- [ ] Monitoreo latencia p95 < 500ms
- [ ] Error rate < 1%

## Post-Launch (24–48h)
- [ ] Dashboards OK
- [ ] Alertas controladas
- [ ] Sin incidentes críticos
- [ ] Debrief programado

Refs: `RELEASE_NOTES_v1.0.0.md`, `FASE8_GO_LIVE_PROCEDURES.md`

# Grafana Dashboards

Los 4 dashboards JSON completos se crearán en la siguiente fase de implementación (T1.2.2):

## Dashboards Planificados:

1. **dashboard-system-overview.json** (8h de diseño)
   - Health status de 7 servicios
   - Request rate, error rate, P95 latency
   - Uptime % últimos 7 días
   
2. **dashboard-business-kpis.json**
   - Productos depositados/h
   - Órdenes de compra generadas
   - Inflación calculada
   - Stock crítico alerts
   
3. **dashboard-performance.json**
   - CPU/Memory por container
   - Disk I/O, Network I/O
   - Database connections
   - Redis cache hit rate
   
4. **dashboard-ml-service.json**
   - OCR processing time (P50/P95/P99)
   - OCR timeout events
   - Price prediction accuracy
   - Model drift score

## Next Steps:

Estos dashboards se crearán cuando ejecutemos **T1.2.2** (Fase 1 Week 2).

Cada dashboard incluirá:
- Paneles con queries PromQL
- Thresholds configurados según KPIs
- Variables para filtrar por servicio/time range
- Links a runbooks/alertas relacionadas

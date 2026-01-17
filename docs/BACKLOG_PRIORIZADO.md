# BACKLOG PRIORIZADO (v1)

**Fecha:** 2026-01-12  
**Estado:** en curso (modo sin credenciales)  
**Metodo:** Puntaje = (Impacto x Urgencia) / Esfuerzo

---

## Top 5 (estado y plan corto)
1) ~~**P0-03**~~ ✅ Gateway sin service role + CORS restringido + rate limit + circuit breaker → **COMPLETADO 2026-01-12**  
2) **P1-01** Eliminar N+1 en Productos/Proveedores con joins o RPC.  
3) ~~**P1-02**~~ ✅ Paginacion + select de columnas minimas en catalogos (2026-01-15).  
4) **P1-04** Error UI + reintentos simples.  
5) ~~**WS6.1**~~ ✅ Integrar tests de integración/E2E en pipeline con guardas de env → **COMPLETADO 2026-01-12**

### Sprint inmediato sin credenciales
- ~~**DOC-01**~~ ✅ Cerrar `REPORTE_ANALISIS_PROYECTO.md` (2026-01-15).
- **DOC-02** Actualizar `API_README.md` con ejemplos `--dry-run` y sin claves.
- **TEST-01** Ampliar unitarios de parsers/routers/cache en scraper y gateway.

---

## Backlog completo

| ID | Tema | Impacto | Esfuerzo | Urgencia | Puntaje | Dependencias | Owner | Estado |
|----|------|:------:|:--------:|:--------:|:-------:|--------------|-------|--------|
| P0-01 | Fix conteo Dashboard | 5 | 1 | 5 | 25.0 | None | Frontend | Completado (usa count=exact) |
| P0-02 | Deposito atomico via RPC | 5 | 2 | 5 | 12.5 | DB/RPC | Frontend/DB | Completado (sp_movimiento_inventario) |
| P0-03 | Gateway sin service role + CORS restringido + rate limit | 5 | 2 | 5 | 12.5 | Env vars | Backend | ✅ Completado |
| P0-04 | Validacion de rol server-side (no metadata) | 5 | 3 | 4 | 6.7 | Tabla roles | Backend/DB | ✅ Completado (2026-01-17, useVerifiedRole desde tabla personal) |
| P1-01 | Eliminar N+1 Productos/Proveedores | 4 | 3 | 4 | 5.3 | Vistas/RPC | Frontend/DB | ✅ Completado (2026-01-16) |
| P1-02 | Paginacion y filtros server-side | 4 | 3 | 4 | 5.3 | API/query | Frontend | Completado (range + count exact) |
| P1-03 | Agregaciones de stock en DB | 4 | 3 | 3 | 4.0 | RPC/vistas | DB | ✅ Completado (2026-01-16, vistas materializadas + RPCs) |
| P1-04 | Error UI + reintentos simples | 3 | 2 | 4 | 6.0 | None | Frontend | ✅ Completado (2026-01-16) |
| P1-05 | Capa de datos con caching (React Query/SWR) | 4 | 3 | 3 | 4.0 | N/A | Frontend | ✅ Completado (2026-01-17, 8 hooks: Dashboard, Productos, Proveedores, Stock, Tareas, Kardex, Rentabilidad, Deposito) |
| P1-06 | ErrorBoundary seguro (sin stack en prod) | 3 | 1 | 3 | 9.0 | None | Frontend | ✅ Completado (2026-01-16) |
| P1-07 | Menu y rutas por rol | 3 | 2 | 3 | 4.5 | Roles | Frontend | ✅ Completado (2026-01-16) |
| P1-08 | Refactor gateway monolitico | 4 | 4 | 2 | 2.0 | Router | Backend | ✅ Completado (helpers modularizados) |
| P1-09 | Adoptar _shared/response en gateway | 2 | 1 | 3 | 6.0 | None | Backend | ✅ Ya implementado |
| P1-10 | Rate limiting en gateway | 3 | 2 | 2 | 3.0 | _shared/rate-limit | Backend | ✅ Completado (60 req/min) |
| P2-01 | Alertas proactivas de stock | 4 | 4 | 2 | 2.0 | Cron | Backend/DB | Completado (alertas-stock) |
| P2-02 | Alertas de vencimientos | 3 | 3 | 2 | 2.0 | Campos lote/fecha | Backend | ✅ Completado (2026-01-16, dry-run edge) |
| P2-03 | Reposicion sugerida | 4 | 4 | 2 | 2.0 | Stock/ventas | Backend/DB | ✅ Completado (2026-01-16, dry-run edge) |
| P2-04 | Kardex de movimientos | 3 | 3 | 2 | 2.0 | Movimientos | Frontend | ✅ Completado (2026-01-16) |
| P2-05 | Panel rentabilidad por producto | 3 | 4 | 1 | 0.8 | Margenes | Frontend/DB | ✅ Completado (2026-01-16, UI rentabilidad) |
| P2-06 | Auditoria de acciones sensibles | 3 | 3 | 2 | 2.0 | Logger | Backend | ✅ Completado (2026-01-16, módulo _shared/audit + integraciones) |
| P2-07 | Exportaciones CSV (stock/productos) | 2 | 2 | 2 | 2.0 | None | Frontend | ✅ Completado (2026-01-16, productos + stock) |
| P2-08 | Busqueda con codigo de barras | 3 | 2 | 2 | 3.0 | UI | Frontend | ✅ Completado (2026-01-16) |
| P2-09 | Notificaciones de tareas | 3 | 3 | 2 | 2.0 | Cron/edge | Backend | ✅ Completado (2026-01-16, refactor notificaciones-tareas) |
| P2-10 | Observabilidad UI (errores/reporting) | 2 | 2 | 2 | 2.0 | Sentry | Frontend/Ops | ✅ Completado (2026-01-16, dry-run local) |
| P3-01 | Limpieza de docs divergentes | 2 | 3 | 1 | 0.7 | Docs | Docs | Pendiente |
| DOC-01 | Reporte de análisis final (solo lectura) | 4 | 2 | 4 | 8.0 | Ninguna | Docs | ✅ Completado (2026-01-15) |
| DOC-02 | API_README con flujo dry-run y sin claves | 3 | 1 | 4 | 12.0 | Ninguna | Docs | ✅ Completado (2026-01-16) |
| TEST-01 | Unit tests extra parsers/routers/cache | 4 | 2 | 3 | 6.0 | Ninguna | Backend/QA | ✅ Completado (2026-01-16) |

---

## Notas
- Los items P0/P1 deberian entrar al ROADMAP vigente.  
- Las dependencias DB requieren validacion de schema y RLS en entorno real.

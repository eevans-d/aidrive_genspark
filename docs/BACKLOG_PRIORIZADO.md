# BACKLOG PRIORIZADO (v1)

**Fecha:** 2026-01-09  
**Estado:** inicial  
**Metodo:** Puntaje = (Impacto x Urgencia) / Esfuerzo

---

## Top 5 (con plan corto)
1) **P0-01** Corregir conteo de productos en Dashboard: usar `count` real y validar nulos.  
2) **P0-02** Movimiento de deposito atomico via RPC: unificar stock + movimiento con validacion.  
3) **P0-03** Gateway sin service role para queries y CORS restringido por origen.  
4) **P1-01** Eliminar N+1 en Productos/Proveedores con joins o RPC.  
5) **P1-02** Paginacion + select de columnas minimas en catalogos.

---

## Backlog completo

| ID | Tema | Impacto | Esfuerzo | Urgencia | Puntaje | Dependencias | Owner | Estado |
|----|------|:------:|:--------:|:--------:|:-------:|--------------|-------|--------|
| P0-01 | Fix conteo Dashboard | 5 | 1 | 5 | 25.0 | None | Frontend | Pendiente |
| P0-02 | Deposito atomico via RPC | 5 | 2 | 5 | 12.5 | DB/RPC | Frontend/DB | Pendiente |
| P0-03 | Gateway sin service role + CORS restringido | 5 | 2 | 5 | 12.5 | Env vars | Backend | Pendiente |
| P0-04 | Validacion de rol server-side (no metadata) | 5 | 3 | 4 | 6.7 | Tabla roles | Backend/DB | Pendiente |
| P1-01 | Eliminar N+1 Productos/Proveedores | 4 | 3 | 4 | 5.3 | Vistas/RPC | Frontend/DB | Pendiente |
| P1-02 | Paginacion y filtros server-side | 4 | 3 | 4 | 5.3 | API/query | Frontend | Pendiente |
| P1-03 | Agregaciones de stock en DB | 4 | 3 | 3 | 4.0 | RPC/vistas | DB | Pendiente |
| P1-04 | Error UI + reintentos simples | 3 | 2 | 4 | 6.0 | None | Frontend | Pendiente |
| P1-05 | Capa de datos con caching (React Query/SWR) | 4 | 3 | 3 | 4.0 | N/A | Frontend | Pendiente |
| P1-06 | ErrorBoundary seguro (sin stack en prod) | 3 | 1 | 3 | 9.0 | None | Frontend | Pendiente |
| P1-07 | Menu y rutas por rol | 3 | 2 | 3 | 4.5 | Roles | Frontend | Pendiente |
| P1-08 | Refactor gateway monolitico | 4 | 4 | 2 | 2.0 | Router | Backend | Pendiente |
| P1-09 | Adoptar _shared/response en gateway | 2 | 1 | 3 | 6.0 | None | Backend | Pendiente |
| P1-10 | Rate limiting en gateway | 3 | 2 | 2 | 3.0 | _shared/rate-limit | Backend | Pendiente |
| P2-01 | Alertas proactivas de stock | 4 | 4 | 2 | 2.0 | Cron | Backend/DB | Pendiente |
| P2-02 | Alertas de vencimientos | 3 | 3 | 2 | 2.0 | Campos lote/fecha | Backend | Pendiente |
| P2-03 | Reposicion sugerida | 4 | 4 | 2 | 2.0 | Stock/ventas | Backend/DB | Pendiente |
| P2-04 | Kardex de movimientos | 3 | 3 | 2 | 2.0 | Movimientos | Frontend | Pendiente |
| P2-05 | Panel rentabilidad por producto | 3 | 4 | 1 | 0.8 | Margenes | Frontend/DB | Pendiente |
| P2-06 | Auditoria de acciones sensibles | 3 | 3 | 2 | 2.0 | Logger | Backend | Pendiente |
| P2-07 | Exportaciones CSV (stock/productos) | 2 | 2 | 2 | 2.0 | None | Frontend | Pendiente |
| P2-08 | Busqueda con codigo de barras | 3 | 2 | 2 | 3.0 | UI | Frontend | Pendiente |
| P2-09 | Notificaciones de tareas | 3 | 3 | 2 | 2.0 | Cron/edge | Backend | Pendiente |
| P2-10 | Observabilidad UI (errores/reporting) | 2 | 2 | 2 | 2.0 | Sentry | Frontend/Ops | Pendiente |
| P3-01 | Limpieza de docs divergentes | 2 | 3 | 1 | 0.7 | Docs | Docs | Pendiente |

---

## Notas
- Los items P0/P1 deberian entrar al ROADMAP vigente.  
- Las dependencias DB requieren validacion de schema y RLS en entorno real.

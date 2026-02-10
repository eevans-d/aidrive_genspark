# C0 - Stakeholders (Mini Market System)

**Fecha:** 2026-02-10  
**Estado:** Vigente

## Stakeholders (roles)

| Rol | Responsabilidad | Necesita |
|-----|------------------|----------|
| Owner / Dueño | Rentabilidad, control, decisiones de compra/precio | Reportes simples, alertas accionables, estabilidad |
| Admin | Configuración general, alta de datos, auditoría | Permisos claros, bitácora, UX eficiente |
| Depósito | Recepción, movimientos, reposición | Flujos rápidos, escáner/búsqueda, evitar doble carga |
| Ventas / Caja (POS) | Registrar ventas, cobros, fiados/CC | Operación 1-paso, mínimo error, latencia baja |
| Proveedor / Integración | Precios y catálogo (scraper/API proveedor) | Hardening server-to-server, rotación de secret |
| SRE / Operaciones | Deploy/rollback, monitoreo, incident response | Runbooks, evidencia, guardrails, health checks |
| Dev Backend | Edge functions + DB | Contratos claros, tests, migraciones seguras |
| Dev Frontend | UI/UX + React Query | API estable, DX, mocks/E2E |

## RACI mínimo (alta nivel)

| Área | Responsable | Aprobador |
|------|------------|-----------|
| Cambios DB/migraciones | Dev Backend | Owner/Admin |
| Deploy a producción | SRE/Owner | Owner |
| Cambios de UX críticos | Dev Frontend | Owner/Admin |
| Rotación de secrets | Owner/SRE | Owner |


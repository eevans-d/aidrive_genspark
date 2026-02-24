# Auditoria en Progreso — Lista de Control (Mini Market System)

> Plantilla para persistencia de contexto entre sesiones de auditoria.
> Usar cuando la auditoria se ejecuta con Codex/Copilot (contexto limitado)
> o cuando una sesion de Claude Code se interrumpe.

## Metadata
| Campo | Valor |
|---|---|
| **Proyecto** | aidrive_genspark (Mini Market System) |
| **Fecha de inicio** | [YYYY-MM-DD] |
| **Fase actual** | [0-8] |
| **Herramienta primaria** | [Claude Code / Codex / Copilot] |
| **Commit de referencia** | [hash] |

## Estado por Fase
| Fase | Nombre | Estado | Fecha completada | Artefacto |
|------|--------|--------|------------------|-----------|
| 0 | Mapeo Total | Pendiente | — | `FILE_INVENTORY.txt` |
| 1 | Codigo Fuente | Pendiente | — | `SOURCE_AUDIT.txt` |
| 2 | Flujos Funcionales | Pendiente | — | `FLOW_TRACES.txt` |
| 3 | Tests | Pendiente | — | `TEST_RESULTS.txt` |
| 4 | Integraciones y Deps | Pendiente | — | `DEPENDENCIES_AUDIT.txt` |
| 5 | UI y Routing | Pendiente | — | `ROUTING_AUDIT.txt` |
| 6 | Seguridad Basica | Pendiente | — | `SECURITY_AUDIT.txt` |
| 7 | Consistencia Documental | Pendiente | — | `DOC_CONSISTENCY.txt` |
| 8 | Reporte Final | Pendiente | — | `FINAL_REPORT.md` |

> Estados: Pendiente | En Progreso | Completada | BLOCKED

## Hallazgos Acumulados
| # | Fase | Severidad | Archivo:Linea | Tipo | Descripcion | Accion Requerida | Resuelto |
|---|------|-----------|---------------|------|-------------|------------------|----------|
| 1 | | | | | | | No |

> Severidades: CRITICO | ALTO | MEDIO | BAJO
> Tipos: Fantasma | Esqueleto | Huerfano | Flujo Roto | Env Fantasma | Import Muerto | Ruta Ciega | TODO/FIXME | Secreto | Discrepancia Doc

## Contadores de Severidad
| Severidad | Cantidad |
|-----------|----------|
| CRITICO | 0 |
| ALTO | 0 |
| MEDIO | 0 |
| BAJO | 0 |

## Contexto para Continuacion de Sesion
> [Escribir aqui un resumen del estado actual, lo ultimo que se reviso,
> y lo que queda pendiente. Este bloque permite que un nuevo agente
> retome la auditoria sin perdida de contexto.]

### Archivos Criticos Revisados
- [ ] `supabase/functions/api-minimarket/index.ts` — API Gateway principal
- [ ] `minimarket-system/src/App.tsx` — Router frontend
- [ ] `minimarket-system/src/lib/apiClient.ts` — Cliente API
- [ ] `minimarket-system/src/contexts/AuthContext.tsx` — Autenticacion
- [ ] `supabase/functions/_shared/cors.ts` — CORS
- [ ] `deploy.sh` — Script de deploy

### Flujos Criticos Trazados
- [ ] Login -> Dashboard -> Inventario
- [ ] Ingreso de mercaderia (deposito)
- [ ] Venta POS -> Facturacion
- [ ] Gestion proveedores + precios
- [ ] Alertas stock / vencimientos
- [ ] Cron jobs (scraping, notificaciones, reportes)
- [ ] Cuaderno inteligente

## Notas del Auditor
> [Observaciones generales, decisiones tomadas, excepciones aceptadas.]

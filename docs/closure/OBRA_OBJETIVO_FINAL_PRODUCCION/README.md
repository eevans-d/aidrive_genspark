# OBRA OBJETIVO FINAL EN PRODUCCION (MAPA MAESTRO CANONICO)

- Fecha de version: `2026-02-17`
- Objetivo: definir la referencia de "proyecto finalizado en produccion" para contrastar de forma reproducible contra `docs/closure/REPORTE_AUDITORIA_PREPRODUCCION_DEFINITIVO_2026-02-16.md`.
- Alcance: funcional, tecnico, seguridad, calidad, operacion, continuidad IA y evidencia.
- Jerarquia de verdad: `codigo > ESTADO_ACTUAL > API_README > este paquete > reporte preprod historico`.

---

## 0) Hechos verificados contra codigo real (2026-02-17)

| Item | Resultado verificado | Evidencia |
|---|---|---|
| Archivos versionados | `606` | `git ls-files \| wc -l` |
| Edge Functions en repo (sin `_shared`) | `13` | `find supabase/functions ... ! -name '_shared'` |
| Migraciones SQL | `41` | `find supabase/migrations -name '*.sql'` |
| Rutas frontend en SPA principal | `15` rutas (`14` explicitas + `*`) | `minimarket-system/src/App.tsx` |
| Gateway `api-minimarket` | `55` guards de enrutamiento (`35` literales + `20` regex) | `supabase/functions/api-minimarket/index.ts` |
| Runtime `api-proveedor` | `9` endpoints en `schemas.ts` | `supabase/functions/api-proveedor/schemas.ts` |
| OpenAPI `api-proveedor` | YAML parsea OK, pero con drift vs runtime | `docs/api-proveedor-openapi-3.1.yaml`, `supabase/functions/api-proveedor/schemas.ts` |
| Drift proveedor confirmado | spec incluye `/scrape`,`/compare`,`/alerts`; runtime no. runtime incluye `/health`; spec no | mismos archivos |
| Metodo HTTP por endpoint en proveedor | NO implementado (router por ultimo segmento) | `supabase/functions/api-proveedor/index.ts`, `supabase/functions/api-proveedor/router.ts` |
| `reportes-automaticos` y esquema | usa `fecha_movimiento` y `tipo_movimiento` (sin mismatch detectado en codigo) | `supabase/functions/reportes-automaticos/index.ts` |
| Quality gates mas reciente | unit PASS; integration FAIL por `.env.test` faltante | `test-reports/quality-gates_20260217-032720.log` |
| Integridad de links docs | OK en `80` archivos | `node scripts/validate-doc-links.mjs` |

---

## 1) Verificacion de equivalentes (por que existe esta carpeta)

Documentos revisados como posibles equivalentes:

- `docs/ARCHITECTURE_DOCUMENTATION.md`: deprecado/aspiracional.
- `docs/PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md`: historico.
- `docs/closure/PROJECT_CLOSURE_REPORT.md`: snapshot viejo.
- `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md`: plan operativo parcial.
- `docs/ESTADO_ACTUAL.md` + `docs/closure/OPEN_ISSUES.md`: estado vigente, pero no blueprint integral objetivo.

Conclusion: no existia un documento unico y vigente con formato "obra final de referencia". Esta carpeta cubre ese vacio.

---

## 2) Vision de proyecto finalizado (target 100%)

El sistema final en produccion debe garantizar:

1. Operacion diaria completa sin planillas externas (ventas, stock, pedidos, tareas, clientes, cuenta corriente, reportes).
2. Seguridad by-default (RLS + RBAC + validacion de entrada + hardening API + higiene de secretos).
3. Observabilidad accionable (errores, salud, logs estructurados, trazabilidad por request/run/job).
4. Automatizacion estable (cron auth interno, lock, monitoreo, evidencia de ejecucion).
5. Documentacion viva (sin drift entre codigo, OpenAPI y docs canonicas).

---

## 3) Mapeo integral de capacidades (estado actual vs objetivo)

| Dominio | Objetivo final | Estado real hoy | Evidencia primaria |
|---|---|---|---|
| Identidad y roles | Auth FE/BE coherente y deny-by-default | PARCIAL AVANZADO | `supabase/functions/api-minimarket/helpers/auth.ts`, `minimarket-system/src/lib/roles.ts` |
| Catalogo comercial | CRUD robusto + reglas de pricing auditables | PARCIAL AVANZADO | `supabase/functions/api-minimarket/index.ts`, `supabase/functions/api-minimarket/handlers/proveedores.ts` |
| Inventario/deposito | Kardex fiable + movimientos trazables + reservas consistentes | PARCIAL AVANZADO | `supabase/functions/api-minimarket/handlers/reservas.ts`, `supabase/migrations/20260204120000_add_sp_reservar_stock.sql` |
| POS + cuenta corriente | venta atomica/idempotente + pagos parciales + saldo confiable | PARCIAL AVANZADO | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql` |
| Pedidos | flujo completo (alta, estado, pago, items) | PARCIAL AVANZADO | `supabase/functions/api-minimarket/index.ts`, `minimarket-system/src/pages/Pedidos.tsx` |
| Ofertas y merma | sugerir/aplicar/desactivar con trazabilidad | PARCIAL AVANZADO | `supabase/functions/api-minimarket/handlers/ofertas.ts` |
| Tareas/bitacora/notificaciones | gestion operativa multi-canal con SLA | PARCIAL AVANZADO | `supabase/functions/api-minimarket/handlers/bitacora.ts`, `supabase/functions/cron-notifications/index.ts` |
| Insights negocio | insights con accion directa desde UI | PARCIAL | `supabase/functions/api-minimarket/handlers/insights.ts`, `minimarket-system/src/components/AlertsDrawer.tsx` |
| Integracion proveedor | contrato estable y endurecido (metodo+auth+spec sincronizada) | PARCIAL | `supabase/functions/api-proveedor/*`, `docs/api-proveedor-openapi-3.1.yaml` |
| Automatizacion cron | jobs autenticados + lock + health monitor | PARCIAL AVANZADO | `supabase/functions/cron-*`, `supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql` |
| Observabilidad | Sentry + logs + salud cron + runbooks | PARCIAL AVANZADO | `minimarket-system/src/main.tsx`, `supabase/functions/_shared/logger.ts` |
| Seguridad/compliance | RLS y search_path hardening sin gaps P0/P1 | PARCIAL AVANZADO | `supabase/migrations/20260212130000_fix_rls_auth_users_final.sql`, `supabase/migrations/20260215100000_fix_search_path_all_functions.sql` |
| Calidad/testing | gates reproducibles en cualquier sesion | PARCIAL | `test-reports/quality-gates_20260217-032720.log` |
| Operacion/continuidad | backup + restore drill + continuidad IA verificable | PARCIAL AVANZADO | `.github/workflows/backup.yml`, `scripts/db-restore-drill.sh`, `docs/closure/CONTINUIDAD_SESIONES.md` |

---

## 4) Arquitectura objetivo final (estado deseado)

### 4.1 Capas

1. Frontend SPA/PWA (`React + Vite`) con manejo uniforme de estados/error.
2. Gateway `api-minimarket` como frontera principal de negocio y seguridad.
3. API interna `api-proveedor` solo server-to-server con contrato OpenAPI sincronizado.
4. Edge Functions especializadas (`cron-*`, alertas, reportes, scraping).
5. PostgreSQL (Supabase) con RLS, RPC atomicas y evidencia operativa.

### 4.2 Flujo E2E objetivo

1. Usuario autenticado opera en frontend.
2. Frontend invoca gateway con token + `x-request-id`.
3. Gateway valida auth/rol/rate-limit/circuit-breaker/entrada.
4. Persistencia y lectura en DB con RLS/RPC.
5. Procesos cron y funciones auxiliares corren con auth interna.
6. Logs y observabilidad consolidan salud y errores accionables.

---

## 5) Definicion de "Proyecto Finalizado en Produccion" (GO 100/100)

| Gate | Criterio obligatorio | Evidencia minima |
|---|---|---|
| G1 | Sin P0/P1 abiertos en seguridad y operacion | `docs/closure/OPEN_ISSUES.md` |
| G2 | Contratos API sincronizados con runtime (gateway + proveedor) | `docs/API_README.md`, OpenAPI validos |
| G3 | Endpoints criticos con metodo/permiso/validacion consistente | rutas + tests de rechazo |
| G4 | Reportes automaticos operativos y trazables | ejecucion de `reportes-automaticos` |
| G5 | RLS y roles validados en entorno remoto | evidencia en `docs/closure/` |
| G6 | Quality gates completos en verde (incluye integration real) | `test-reports/quality-gates_*.log` |
| G7 | Dependencias sin vulnerabilidades HIGH en runtime | auditoria de dependencias vigente |
| G8 | Observabilidad productiva activa (Sentry + cron health) | evidencias de monitoreo |
| G9 | Backups y restore drill verificados | evidencias Gate 15 |
| G10 | Secretos con higiene operativa y rotacion trazable | evidencias de rotacion |
| G11 | Documentacion canonica alineada y sin drift | reporte DocuGuard + links OK |
| G12 | Protocolo de continuidad IA probado | `docs/closure/CONTINUIDAD_SESIONES.md` + este paquete |

---

## 6) Brechas priorizadas para pasar de preprod a obra final

### Criticas (bloquean alineacion)

1. `api-proveedor` sin enforcement de metodo HTTP por endpoint.
2. Drift OpenAPI/runtime en proveedor (`/health` faltante en spec y `/scrape|/compare|/alerts` sobrantes en spec).
3. Quality gates de integracion no reproducibles universalmente sin `.env.test`.

### Importantes (deuda operativa)

1. Cerrar drift documental residual en inventario de endpoints gateway.
2. Mantener auditoria ciclica de dependencias y vulnerabilidades.
3. Verificar evidencias productivas de backup/secrets con owner responsable.

### Ajustes ya validados en esta revision

1. `docs/api-proveedor-openapi-3.1.yaml` parsea OK actualmente.
2. `reportes-automaticos` ya consulta `fecha_movimiento`/`tipo_movimiento` (no se confirma el mismatch historico indicado en reportes previos).

---

## 7) Uso de esta obra para contraste en nueva sesion IA

1. Leer `docs/closure/REPORTE_AUDITORIA_PREPRODUCCION_DEFINITIVO_2026-02-16.md` (estado preprod/historico).
2. Leer este `README.md` (objetivo final canonicamente definido).
3. Ejecutar matriz y protocolo:
   - `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/MATRIZ_CONTRASTE_PREPROD_VS_OBJETIVO.md`
   - `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/PROTOCOLO_CONTRASTE_NUEVA_SESION_IA.md`
4. Declarar "obra alcanzada" solo cuando no queden ejes `NO_ALINEADO` en matriz y se cumplan gates G1..G12.

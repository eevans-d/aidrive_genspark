# OBJETIVO FINAL: SISTEMA MINI MARKET EN PRODUCCION

> **Proposito:** Este documento describe el estado objetivo del proyecto 100% finalizado y operando en produccion. Es la referencia canonica ("Obra de Arte Original") contra la cual comparar el estado actual del sistema.

- Fecha de creacion: `2026-02-17`
- Basado en: auditoria pre-produccion `2026-02-16` + verificacion cruzada `2026-02-17`
- Commit de referencia: `d8d829d`

---

## 1. VISION DEL SISTEMA EN PRODUCCION

### 1.1 Que es

Sistema de gestion integral para mini markets que cubre:

- **Inventario y deposito**: ingreso de mercaderia, movimientos (entrada/salida/ajuste/transferencia), control de stock minimo/maximo, kardex de movimientos, reservas de stock con idempotencia.
- **Ventas POS**: punto de venta con idempotencia, metodos de pago (efectivo/debito/credito/fiado), integracion con cuenta corriente de clientes.
- **Clientes y cuenta corriente**: gestion de clientes, registro de pagos, saldos y resumen de "dinero en la calle".
- **Pedidos**: creacion, seguimiento de estado, registro de pagos parciales, preparacion de items con checklist.
- **Tareas**: creacion, asignacion, completado, cancelacion, reportes de efectividad por usuario.
- **Productos y categorias**: CRUD completo, precios con redondeo automatico, historial de precios, margen sugerido.
- **Proveedores**: gestion de proveedores, scraping automatizado de catalogo (Maxiconsumo), comparacion de precios, alertas de cambio, insights de arbitraje y oportunidades de compra.
- **Reportes y automatizaciones**: reportes diarios automaticos, alertas de stock bajo, alertas de vencimiento, notificaciones de tareas, health monitoring de cron jobs.
- **Ofertas**: sugerencia automatica de ofertas por proximidad a vencimiento, aplicacion y desactivacion.
- **Busqueda global**: busqueda unificada across productos, proveedores, tareas, pedidos y clientes.
- **Bitacora de turnos**: registro de notas operativas por turno.

### 1.2 Arquitectura objetivo

```
[Browser SPA]  --->  [api-minimarket (Gateway)]  --->  [Supabase PostgreSQL]
     |                       |
     |                [api-proveedor (Internal)]  --->  [scraper-maxiconsumo]
     |                       |
     |                [cron-* (Automated)]  --->  [SendGrid/Slack/Twilio]
     |
     +--- [Supabase Auth]
     +--- [Sentry (Observability)]
```

- **Frontend**: React 18 SPA con Vite, TanStack Query, Tailwind CSS, shadcn/ui, PWA
- **Backend**: Supabase Edge Functions (Deno) como API Gateway + funciones especializadas
- **Base de datos**: PostgreSQL 17 con RLS, funciones almacenadas, vistas materializadas
- **Autenticacion**: Supabase Auth (JWT) para usuarios, shared secret para APIs internas
- **Automatizacion**: pg_cron + pg_net -> Edge Functions
- **Observabilidad**: Sentry (frontend), logger estructurado (backend), cron-health-monitor

---

## 2. FUNCIONALIDADES COMPLETAS EN PRODUCCION

### 2.1 Frontend - 15 pantallas operativas

| Ruta | Pantalla | Roles con acceso | Estado objetivo |
|------|----------|------------------|-----------------|
| `/` | Dashboard | todos | Metricas en tiempo real: stock bajo, tareas pendientes, ventas del dia |
| `/login` | Login | publico | Autenticacion Supabase Auth con manejo de sesion |
| `/deposito` | Deposito | admin, deposito | Ingreso de mercaderia, movimientos de inventario |
| `/kardex` | Kardex | admin, deposito | Historial completo de movimientos por producto |
| `/stock` | Stock | todos | Vista general de stock, alertas de minimo |
| `/rentabilidad` | Rentabilidad | admin, deposito | Analisis de margenes y rentabilidad por producto |
| `/tareas` | Tareas | todos | Gestion de tareas con asignacion y seguimiento |
| `/productos` | Productos | admin, deposito, ventas | CRUD de productos con categorias y precios |
| `/proveedores` | Proveedores | admin, deposito | Gestion de proveedores y comparacion de precios |
| `/pedidos` | Pedidos | admin, deposito, ventas | Gestion completa de pedidos con preparacion |
| `/pos` | Punto de Venta | admin, ventas | Venta rapida con scanner, idempotencia |
| `/pocket` | Pocket | admin, deposito | Vista compacta para dispositivos moviles en deposito |
| `/clientes` | Clientes | admin, ventas | Gestion de clientes y cuenta corriente |
| `/ventas` | Ventas | admin, ventas | Historial y detalle de ventas realizadas |
| `/*` | 404 | todos | Pagina no encontrada |

### 2.2 API Gateway (api-minimarket) - Operaciones completas

55 guards de enrutamiento (35 literales + 20 regex) cubriendo:

| Modulo | Operaciones | Ejemplo |
|--------|-------------|---------|
| Productos | CRUD + dropdown + busqueda | `GET/POST/PUT/DELETE /productos`, `GET /productos/dropdown` |
| Stock | consulta general + minimo + por producto | `GET /stock`, `GET /stock/minimo`, `GET /stock/producto/{id}` |
| Deposito | ingreso + movimiento + historial | `POST /deposito/ingreso`, `POST /deposito/movimiento`, `GET /deposito/movimientos` |
| Ventas POS | crear (idempotente) + listar + detalle | `POST /ventas` (Idempotency-Key), `GET /ventas`, `GET /ventas/{id}` |
| Pedidos | CRUD + estados + pagos + preparacion | `POST/GET /pedidos`, `PUT /pedidos/{id}/estado`, `PUT /pedidos/{id}/pago` |
| Clientes | CRUD | `GET/POST /clientes`, `PUT /clientes/{id}` |
| Cuenta Corriente | pagos + resumen + saldos | `POST /cuentas-corrientes/pagos`, `GET .../resumen`, `GET .../saldos` |
| Precios | aplicar + margen + historial + redondear | `POST /precios/aplicar`, `GET /precios/producto/{id}` |
| Proveedores | listar + dropdown + detalle + CRUD | `GET /proveedores`, `POST /proveedores`, `PUT /proveedores/{id}` |
| Reservas | crear (idempotente) + cancelar | `POST /reservas` (Idempotency-Key), `POST /reservas/{id}/cancelar` |
| Tareas | crear + completar + cancelar | `POST /tareas`, `PUT /tareas/{id}/completar` |
| Categorias | listar + detalle | `GET /categorias`, `GET /categorias/{id}` |
| Ofertas | sugeridas + aplicar + desactivar | `GET /ofertas/sugeridas`, `POST /ofertas/aplicar` |
| Insights | arbitraje + compras + producto | `GET /insights/arbitraje`, `GET /insights/compras` |
| Reportes | efectividad de tareas | `GET /reportes/efectividad-tareas` |
| Busqueda | global | `GET /search?q=...` |
| Bitacora | listar + crear | `GET/POST /bitacora` |
| Compras | recepcion | `POST /compras/recepcion` |
| Health | health check | `GET /health` |

### 2.3 API Proveedor (api-proveedor) - 9 endpoints internos

| Endpoint | Funcion |
|----------|---------|
| `/precios` | Precios actuales del proveedor con paginacion |
| `/productos` | Catalogo de productos del proveedor con filtros |
| `/comparacion` | Comparativa precios proveedor vs sistema |
| `/sincronizar` | Trigger de scraping manual |
| `/status` | Estado operativo del modulo |
| `/alertas` | Alertas de cambios de precios |
| `/estadisticas` | KPIs y metricas temporales |
| `/configuracion` | Configuracion y salud del modulo |
| `/health` | Health check extendido |

### 2.4 Automatizaciones (cron jobs)

| Job | Frecuencia | Funcion |
|-----|-----------|---------|
| `alertas-stock` | cada hora | Detecta productos bajo stock minimo y genera alertas |
| `notificaciones-tareas` | cada 2 horas | Notifica tareas vencidas o proximas a vencer |
| `reportes-automaticos` | diario 08:00 UTC | Genera reporte diario (stock, movimientos, tareas, precios, faltantes) |
| `maintenance_cleanup` | domingos 04:00 UTC | Limpieza de datos obsoletos |
| `refresh_stock_views` | cada hora (opcional) | Refresca vistas materializadas de stock |

---

## 3. BASE DE DATOS EN PRODUCCION

### 3.1 Tablas (38)

| Categoria | Tablas | Cantidad |
|-----------|--------|----------|
| Core negocio | productos, categorias, proveedores, stock_deposito, movimientos_deposito, precios_historicos, productos_faltantes | 7 |
| Ventas y clientes | ventas, venta_items, clientes, cuentas_corrientes_movimientos | 4 |
| Pedidos | pedidos, detalle_pedidos | 2 |
| Tareas | tareas_pendientes, notificaciones_tareas | 2 |
| Proveedor/scraping | precios_proveedor, comparacion_precios, alertas_cambios_precios, configuracion_proveedor, estadisticas_scraping, cache_proveedor | 6 |
| Ordenes de compra | ordenes_compra, stock_reservado | 2 |
| Cron/monitoring | cron_jobs_tracking, cron_jobs_execution_log, cron_jobs_alerts, cron_jobs_notifications, cron_jobs_metrics, cron_jobs_monitoring_history, cron_jobs_health_checks, cron_jobs_config, cron_jobs_notification_preferences, cron_jobs_locks | 10 |
| Ofertas | ofertas_stock | 1 |
| Bitacora | bitacora_turnos | 1 |
| Infraestructura | rate_limit_state, circuit_breaker_state | 2 |
| Seguridad/auth | personal | 1 |

### 3.2 Seguridad DB

- **RLS activo** en todas las tablas con datos de negocio
- Funcion `has_personal_role(...)` para validacion de rol en politicas
- `SECURITY DEFINER` con `search_path` restringido en funciones almacenadas
- Stored procedures con locking transaccional para operaciones criticas:
  - `sp_procesar_venta_pos` (venta POS con idempotencia)
  - `sp_reservar_stock` (reserva con deduplicacion)
  - `sp_aplicar_precio` (actualizacion de precios con historial)

---

## 4. PATRONES DE RESILIENCIA IMPLEMENTADOS

| Patron | Donde | Configuracion |
|--------|-------|---------------|
| Rate Limiting | api-minimarket | 60 req/min por IP |
| Rate Limiting | api-proveedor | 120 req/min por endpoint+client |
| Circuit Breaker | api-minimarket | shared state en DB |
| Circuit Breaker | api-proveedor | shared state en DB |
| Idempotencia | POST /ventas | Idempotency-Key header |
| Idempotencia | POST /reservas | Idempotency-Key header |
| CORS | ambas APIs | allowlist por ALLOWED_ORIGINS |
| Cache | api-proveedor | in-memory + persistente en cache_proveedor |
| Auth JWT | api-minimarket | validacion contra /auth/v1/user |
| Auth Secret | api-proveedor | timing-safe comparison |
| Auth Service Role | cron functions | requireServiceRoleAuth |
| Error normalization | ambas APIs | toAppError + fail() con requestId |

---

## 5. TESTING EN PRODUCCION

### 5.1 Cobertura requerida

| Metrica | Threshold | Verificado |
|---------|-----------|------------|
| Statements | >= 80% | 89.20% |
| Functions | >= 80% | 93.29% |
| Branches | >= 80% | 80.92% |

### 5.2 Suites de test

| Suite | Archivos | Tipo |
|-------|----------|------|
| Unit backend | 58 | Funciones, handlers, utilidades |
| Frontend components | 30 | Hooks, pages, components |
| API contracts | 1 | OpenAPI compliance |
| Security | 1 | Patrones de seguridad |
| Performance | 1 | Load testing basico |
| E2E smoke | 1 | API proveedor smoke |

### 5.3 CI/CD

- GitHub Actions CI: lint + test + build + typecheck + security
- Backup diario a las 03:00 UTC
- Pre-commit hooks: lint-staged + eslint
- Deploy: `deploy.sh` con soporte dev/staging/production

---

## 6. OBSERVABILIDAD EN PRODUCCION

| Componente | Herramienta | Configuracion |
|------------|-------------|---------------|
| Frontend errors | Sentry | `VITE_SENTRY_DSN` |
| Backend logging | Logger estructurado | `_shared/logger.ts` con niveles configurables |
| Frontend error reports | localStorage | `mm_error_reports_v1` |
| Cron monitoring | cron-health-monitor | Edge Function dedicada |
| Health checks | /health endpoints | api-minimarket + api-proveedor |
| Auth events | authEvents | Pub/sub local para sesion |

---

## 7. SERVICIOS EXTERNOS INTEGRADOS

| Servicio | Proposito | Variables requeridas |
|----------|-----------|---------------------|
| Supabase | Auth, DB, Edge Functions, Storage | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| SendGrid/SMTP | Notificaciones por email | `SENDGRID_API_KEY` o `SMTP_*` |
| Slack | Alertas operativas | `SLACK_WEBHOOK_URL` |
| Twilio | Notificaciones SMS | `TWILIO_*` |
| Sentry | Error tracking frontend | `VITE_SENTRY_DSN` |
| Maxiconsumo | Proveedor (scraping) | URL publica |

---

## 8. ROLES Y PERMISOS

### 8.1 Roles del sistema

| Rol | Acceso | Descripcion |
|-----|--------|-------------|
| `admin` | Todas las rutas y operaciones | Administrador del sistema |
| `deposito` | Dashboard, deposito, kardex, stock, tareas, productos, proveedores, pedidos, pocket, rentabilidad | Personal de deposito/almacen |
| `ventas` | Dashboard, stock, tareas, productos, pedidos, pos, clientes, ventas | Personal de ventas |
| `usuario` | Dashboard, stock, tareas | Acceso basico de lectura |

### 8.2 Control de acceso

- Frontend: `canAccessRoute()` con DENY-BY-DEFAULT (ruta no configurada = sin acceso)
- Backend: `requireRole()` por endpoint con validacion server-side
- DB: RLS con `has_personal_role()` en politicas

---

## 9. ESTADO OBJETIVO vs ESTADO ACTUAL

### 9.1 Funcionalidades 100% operativas (en produccion)

- Inventario y deposito (CRUD + movimientos + kardex)
- Ventas POS con idempotencia
- Gestion de clientes y cuenta corriente
- Pedidos con preparacion de items
- Tareas con asignacion y efectividad
- Productos con precios y categorias
- Proveedores con scraping y comparacion
- Reportes automaticos diarios
- Alertas de stock bajo
- Ofertas por vencimiento
- Busqueda global
- Bitacora de turnos
- Reservas de stock idempotentes
- Sistema de roles y permisos (frontend + backend + DB)
- Circuit breaker y rate limiting
- Auth JWT + shared secret
- CI/CD con quality gates

### 9.2 Items pendientes para produccion completa

| # | Item | Impacto | Seccion auditoria |
|---|------|---------|-------------------|
| 1 | Enforzar validacion de metodo HTTP en api-proveedor | CRITICO | 9 (CRITICOS) |
| 2 | Alinear OpenAPI api-proveedor con runtime real | CRITICO | 9 (CRITICOS) |
| 3 | Configurar `.env.test` para integration/e2e | IMPORTANTE | 9 (IMPORTANTES) |
| 4 | Sincronizar OpenAPI api-minimarket (POST/PUT proveedores, /compras/recepcion) | IMPORTANTE | 9 (IMPORTANTES) |
| 5 | Actualizar dependencias vulnerables (transitive HIGH/MODERATE) | IMPORTANTE | 9 (IMPORTANTES) |
| 6 | Agregar security headers (CSP, HSTS) en servidor | MENOR | 9 (MENORES) |
| 7 | Configurar formatter dedicado (Prettier) | MENOR | 9 (MENORES) |
| 8 | Añadir eviccion automatica a rate limiter maps | MENOR | 9 (MENORES) |

### 9.3 Condicion de salida para produccion

```
produccion_ready = (
    todos_criticos_resueltos
    AND unit_tests_pass
    AND integration_tests_pass
    AND security_tests_pass
    AND build_exitoso
    AND env_secrets_configurados
    AND cron_jobs_verificados
)
```

---

## 10. VARIABLES DE ENTORNO REQUERIDAS EN PRODUCCION

### 10.1 Obligatorias

| Variable | Donde | Proposito |
|----------|-------|-----------|
| `SUPABASE_URL` | Backend + Frontend (`VITE_`) | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Backend + Frontend (`VITE_`) | Clave publica anonima |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend (secrets) | Clave administrativa |
| `ALLOWED_ORIGINS` | Backend | Origins permitidos para CORS |
| `API_PROVEEDOR_SECRET` | Backend | Shared secret para api-proveedor |
| `VITE_API_GATEWAY_URL` | Frontend | URL del gateway api-minimarket |

### 10.2 Servicios externos (opcionales pero recomendados)

| Variable | Servicio |
|----------|----------|
| `SENDGRID_API_KEY` | Email via SendGrid |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Email via SMTP |
| `SLACK_WEBHOOK_URL` | Notificaciones Slack |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | SMS via Twilio |
| `VITE_SENTRY_DSN` | Error tracking Sentry |

### 10.3 Configuracion operativa

| Variable | Default | Proposito |
|----------|---------|-----------|
| `ENVIRONMENT` | - | Entorno (production/staging/development) |
| `LOG_LEVEL` | info | Nivel de logging |
| `REQUIRE_ORIGIN` | true | Exigir header Origin en requests browser |
| `NOTIFICATIONS_MODE` | - | Modo de notificaciones |

---

## 11. ESTRUCTURA DE ARCHIVOS EN PRODUCCION

```
aidrive_genspark/
├── minimarket-system/          # Frontend React SPA
│   ├── src/
│   │   ├── components/         # Componentes reutilizables (Layout, ErrorBoundary, etc.)
│   │   ├── contexts/           # React Contexts (Auth)
│   │   ├── hooks/              # Custom hooks (queries, auth, roles)
│   │   ├── lib/                # Utilidades (apiClient, roles, observability)
│   │   ├── pages/              # 14 paginas del sistema
│   │   └── mocks/              # Mocks para testing
│   ├── e2e/                    # Tests Playwright
│   └── [configs]               # vite, vitest, tailwind, eslint, typescript
├── supabase/
│   ├── functions/
│   │   ├── _shared/            # Utilidades compartidas (cors, auth, errors, logger, rate-limit, circuit-breaker, response)
│   │   ├── api-minimarket/     # Gateway principal (index.ts + handlers/ + helpers/ + routers/)
│   │   ├── api-proveedor/      # API interna proveedor (index.ts + handlers/ + utils/ + router.ts)
│   │   ├── scraper-maxiconsumo/# Scraper del proveedor
│   │   ├── alertas-stock/      # Alerta cron de stock bajo
│   │   ├── alertas-vencimientos/# Alerta cron de vencimientos
│   │   ├── notificaciones-tareas/# Notificacion cron de tareas
│   │   ├── reportes-automaticos/# Reporte diario automatico
│   │   ├── reposicion-sugerida/ # Sugerencias de reposicion
│   │   ├── cron-health-monitor/ # Monitor de salud de crons
│   │   ├── cron-dashboard/      # Dashboard de cron jobs
│   │   ├── cron-jobs-maxiconsumo/# Orquestador de jobs proveedor
│   │   ├── cron-notifications/  # Envio de notificaciones (email/SMS/Slack)
│   │   └── cron-testing-suite/  # Suite de testing de crons
│   └── migrations/             # 41 migraciones SQL
├── tests/
│   ├── unit/                   # 58 tests unitarios
│   ├── api-contracts/          # Tests de contratos OpenAPI
│   ├── security/               # Tests de seguridad
│   ├── performance/            # Tests de rendimiento
│   ├── e2e/                    # Smoke tests
│   ├── contract/               # Tests de integracion
│   └── [helpers/mocks/setup]   # Infraestructura de testing
├── scripts/                    # Scripts operativos (backup, deploy, audit, smoke tests)
├── docs/                       # Documentacion tecnica
│   ├── closure/                # Artefactos de cierre y auditoria
│   ├── mpc/                    # Mega plan consolidado
│   ├── audit/                  # Evidencia de auditorias
│   └── [specs/guides]          # OpenAPI, guias, runbooks
├── .github/workflows/          # CI/CD (ci.yml, backup.yml)
└── .agent/                     # Sistema agentico Protocol Zero
```

---

## 12. METRICAS DE EXITO EN PRODUCCION

| Metrica | Objetivo |
|---------|----------|
| Disponibilidad API | >= 99.5% |
| Tiempo respuesta p95 | < 500ms |
| Cobertura de tests | >= 80% en todas las metricas |
| Zero critical vulnerabilities | en dependencias directas |
| Cron jobs success rate | >= 95% |
| Error rate frontend | < 1% de sesiones |
| Build time | < 2 minutos |
| Deploy downtime | 0 (rolling deploys Supabase) |

---

*Documento creado como referencia canonica de produccion. Comparar con `REPORTE_AUDITORIA_PREPRODUCCION_DEFINITIVO_2026-02-16.md` para identificar brechas entre estado actual y objetivo.*

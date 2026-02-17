# REPORTE DE AUDITORIA TECNICA DE PRE-PRODUCCION (DEFINITIVO)

- Fecha de auditoria (UTC): `2026-02-16`
- Workspace auditado: `/home/eevan/ProyectosIA/aidrive_genspark`
- Branch: `main`
- Commit base: `dadb2105a148a96eb230e219b5997db8c5d19e87`
- Re-verificacion cruzada (UTC): `2026-02-17 03:27:40`
- Commit re-verificado: `b78426f12b996d305b8bae6a02f8c12664c2d555`
- Alcance: repositorio completo (frontend, edge functions, migraciones, scripts, CI/CD, docs técnicas y artefactos de cierre)
- Modalidad: solo analisis y documentacion (sin cambios de codigo funcional)

---

## FE DE VERIFICACION CRUZADA (2026-02-17)

- `git ls-files`: `606` archivos versionados (el reporte original listaba `605`; faltaba `docs/closure/EVIDENCIA_CHANNEL_MATRIX_2026-02-16.md` en Apéndice A).
- Conteo de endpoints `api-minimarket` aclarado y validado contra código real:
  - `35` operaciones literales (`if (path === ... && method === ...)`).
  - `20` operaciones regex (`if (path.match(...) && method === ...)`).
  - `55` guards de enrutamiento en total.
- Estado quality gates local re-verificado:
  - unit tests: PASS,
  - integración: FAIL por ausencia de `.env.test` (`test-reports/quality-gates_20260217-032720.log:463-470`).
- `docs/api-proveedor-openapi-3.1.yaml`: parsea OK hoy; persiste drift contrato/runtime (`/health` faltante en spec y `/scrape|/compare|/alerts` sobrantes en spec).
- `reportes-automaticos`: en código actual usa `fecha_movimiento` y `tipo_movimiento` (la alerta histórica por columnas `fecha/tipo` queda como hallazgo superado).
- Documentación alineada en esta iteración: `docs/API_README.md`, `docs/ESTADO_ACTUAL.md`, `docs/DECISION_LOG.md`.

### Fixes aplicados en commit `d8d829d` (2026-02-17)

- **[RESUELTO]** `reportes-automaticos/index.ts`: columnas PostgREST corregidas (`fecha` -> `fecha_movimiento`, `m.tipo` -> `m.tipo_movimiento`).
- **[RESUELTO]** `minimarket-system/src/lib/roles.ts`: ruta `/ventas` agregada a `ROUTE_CONFIG` con `['admin', 'ventas']`. Tests actualizados en `roles.test.ts`.
- **[RESUELTO]** `docs/api-proveedor-openapi-3.1.yaml`: error de parseo YAML corregido (comillas en linea 746).

### Correccion de hallazgo incorrecto (seccion 3.3)

- `alertas-vencimientos` `warning_days`/`urgent_days`: el reporte original indicaba riesgo de `NaN`. Verificacion contra codigo real muestra que `Math.max(1, Number(...))` retorna `1` cuando el valor es `NaN`, por lo que el guard es efectivo y el riesgo no existe.

### Precedencia de esta fe de verificacion

- Si alguna seccion historica de este reporte contradice los bullets anteriores, tomar estos bullets como estado verificado vigente.
- El cuerpo original se conserva por trazabilidad historica de la auditoria del `2026-02-16`.

---

## 1. IDENTIFICACION GENERAL DEL PROYECTO

### 1.1 Nombre del proyecto
- Nombre raíz del workspace: `workspace` (`package.json:2`)
- Nombre del frontend: `react_repo` (`minimarket-system/package.json:2`)
- Denominacion funcional en README: `Sistema Mini Market` (`README.md:1`)

### 1.2 Descripcion / proposito
- Sistema de gestion para mini markets (inventario, compras, deposito, tareas, ventas POS, clientes/cuenta corriente, reportes y automatizaciones con cron). Referencias:
  - `README.md:3`
  - `docs/ESTADO_ACTUAL.md:18`

### 1.3 Tipo de aplicacion
- `Web SPA` (frontend React/Vite)
- `API Gateway serverless` (`api-minimarket` en Supabase Edge Functions)
- `API interna server-to-server` (`api-proveedor`)
- `Automatizaciones backend` (cron jobs + funciones auxiliares)

### 1.4 Stack tecnologico completo (con versiones)

#### Frontend
- React `^18.3.1` (`minimarket-system/package.json`)
- Vite `^6.0.1`
- TypeScript `~5.9.3`
- React Router DOM `^6`
- TanStack Query `^5.90.17`
- Supabase JS `^2.78.0`
- Sentry React `^10.38.0`
- Tailwind CSS `3.4.16`
- Vitest `^4.0.17`
- Playwright `^1.57.0`

#### Backend / Plataforma
- Supabase Edge Functions (Deno)
- Deno import de Supabase JS `2.49.4` (`supabase/functions/deno.json:3`)
- PostgreSQL (Supabase) `major_version = 17` (`supabase/config.toml:31`)
- PostgREST/RPC via `/rest/v1/*` y `/rest/v1/rpc/*`
- `pg_cron` + `pg_net` (cron SQL y `net.http_post`)

#### Testing y calidad
- Vitest (unit, contract, security, performance, e2e smoke)
- Testing Library
- ESLint (`minimarket-system/eslint.config.js`)
- Husky + lint-staged (`package.json:20`, `package.json:45`)

#### Toolchain/CI
- GitHub Actions (`.github/workflows/ci.yml`, `.github/workflows/backup.yml`)
- Node `20+` (README) y `20` en backup workflow (`.github/workflows/backup.yml:16`)
- pnpm `9+` (README)
- Supabase CLI

### 1.5 Estructura de carpetas (arbol completo)
- Cantidad de archivos versionados (`git ls-files`): `606`
- Arbol completo: ver **Apéndice A** (incluido completo en este documento).

### 1.6 Archivos de configuracion encontrados (cada uno y su proposito)

| Archivo | Proposito |
|---|---|
| `package.json` | scripts de test/husky/lint-staged del workspace raíz |
| `minimarket-system/package.json` | scripts frontend build/lint/test/deploy |
| `deno.json` | ajuste Deno raíz (`nodeModulesDir`) |
| `supabase/functions/deno.json` | imports/strict para Edge Functions |
| `supabase/config.toml` | config local Supabase (API, DB, Auth, Storage, limits) |
| `vitest.config.ts` | tests unit raíz + thresholds de cobertura |
| `vitest.auxiliary.config.ts` | suites auxiliares (security/perf/contracts) |
| `vitest.integration.config.ts` | configuración integración |
| `vitest.e2e.config.ts` | configuración e2e smoke |
| `minimarket-system/vite.config.ts` | build frontend + PWA + chunking |
| `minimarket-system/vitest.config.ts` | tests frontend |
| `minimarket-system/eslint.config.js` | lint frontend |
| `minimarket-system/tailwind.config.js` | estilo Tailwind |
| `minimarket-system/postcss.config.js` | pipeline CSS |
| `minimarket-system/playwright.config.ts` | e2e browser |
| `minimarket-system/tsconfig.json` | TS project references |
| `minimarket-system/tsconfig.app.json` | TS app config |
| `minimarket-system/tsconfig.node.json` | TS node/vite config |
| `minimarket-system/components.json` | config de componentes UI (shadcn) |
| `.github/workflows/ci.yml` | pipeline CI/CD de validaciones |
| `.github/workflows/backup.yml` | backup diario DB |
| `.env.example` | variables de entorno base documentadas |
| `.env.test.example` | variables para integración/e2e |
| `minimarket-system/.env.example` | variables frontend de ejemplo |
| `.gitignore` | exclusiones incluyendo `.env` |

### 1.7 Variables de entorno utilizadas (TODAS, sin valores)

> Fuente: escaneo de `Deno.env.get`, `process.env`, `import.meta.env`, `getEnvValue`, más `.env.example` y `.env.test.example`.

- `ACCESS_TOKEN`
- `ALLOWED_ORIGINS`
- `API_PROVEEDOR_READ_MODE`
- `API_PROVEEDOR_SECRET`
- `CAPTCHA_API_KEY`
- `CAPTCHA_PROVIDER`
- `DB_PASSWORD`
- `DENO_DEPLOYMENT_ID`
- `DEV`
- `EMAIL_FROM`
- `ENABLE_CAPTCHA`
- `ENABLE_PROXY`
- `ENVIRONMENT`
- `INTERNAL_ORIGINS_ALLOWLIST`
- `LOG_LEVEL`
- `NOTIFICATIONS_MODE`
- `PROD`
- `PROJECT_ID`
- `PROXY_URL`
- `REQUIRE_ORIGIN`
- `SCRAPER_READ_MODE`
- `SCRAPER_TIMEOUT_MS`
- `SENDGRID_API_KEY`
- `SLACK_WEBHOOK_URL`
- `SMTP_FROM`
- `SMTP_HOST`
- `SMTP_PASS`
- `SMTP_PORT`
- `SMTP_USER`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `TEST_ENVIRONMENT`
- `TEST_PASSWORD`
- `TEST_USER_ADMIN`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `VITE_API_GATEWAY_URL`
- `VITE_BUILD_ID`
- `VITE_SENTRY_DSN`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_USE_MOCKS`
- `WEBHOOK_URL`

#### Estado de documentación/env audit (nombres)
- `.env.example` no usado en código: `ACCESS_TOKEN`, `DB_PASSWORD`, `PROJECT_ID` (`docs/closure/ENV_AUDIT_2026-02-16_045120.md:133`)
- usados en código pero faltantes en secrets Supabase (backend compare):
  - `API_PROVEEDOR_READ_MODE`, `EMAIL_FROM`, `ENVIRONMENT`, `INTERNAL_ORIGINS_ALLOWLIST`, `LOG_LEVEL`, `REQUIRE_ORIGIN`, `SCRAPER_READ_MODE`, `SLACK_WEBHOOK_URL`, `TEST_ENVIRONMENT`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `WEBHOOK_URL` (`docs/closure/ENV_AUDIT_2026-02-16_045120.md:139`)

### 1.8 Base de datos: tipo, esquema, tablas/colecciones, relaciones
- Motor: PostgreSQL Supabase (`supabase/config.toml:31`)
- Migraciones en repo: `41` (`supabase/migrations/*`)
- Tablas detectadas por DDL: `38`
- Vistas/materializadas y funciones/procedimientos: ver Sección 2.6 y 2.7

### 1.9 Servicios externos / APIs de terceros integradas
- Supabase (Auth, PostgREST, RPC, Edge Functions, pg_cron, pg_net)
- SendGrid/SMTP (`SENDGRID_API_KEY`, `SMTP_*`) (`supabase/functions/cron-notifications/index.ts:518`)
- Slack webhook (`SLACK_WEBHOOK_URL`) (`supabase/functions/cron-notifications/index.ts:573`)
- Twilio (`TWILIO_*`) (`supabase/functions/cron-notifications/index.ts:556`)
- Sentry (`VITE_SENTRY_DSN`) (`minimarket-system/src/main.tsx:8`)
- Sitio proveedor Maxiconsumo (scraper/crawler) (`supabase/functions/scraper-maxiconsumo/*`)

### 1.10 Sistema de autenticacion/autorizacion implementado
- `api-minimarket`:
  - JWT de usuario (Supabase Auth) validado contra `/auth/v1/user` (`supabase/functions/api-minimarket/helpers/auth.ts:174`)
  - control de roles server-side (`admin`, `deposito`, `ventas`) con `requireRole` (`supabase/functions/api-minimarket/helpers/auth.ts:33`, `:294`)
- `api-proveedor`:
  - shared secret `x-api-secret` con comparación timing-safe (`supabase/functions/api-proveedor/utils/auth.ts:45`, `:25`)
  - validación de origen interno (`supabase/functions/api-proveedor/utils/auth.ts:99`)
- Frontend:
  - Supabase Auth (`signInWithPassword`, `signUp`, `signOut`) (`minimarket-system/src/contexts/AuthContext.tsx:52`)
  - rol verificado desde tabla `personal` (`minimarket-system/src/hooks/useVerifiedRole.ts:55`)

---

## 2. ARQUITECTURA Y FLUJO

### 2.1 Arquitectura general
- Arquitectura principal: **monorepo fullstack** con frontend SPA + backend serverless sobre Supabase Edge Functions + PostgreSQL.
- Estilo de backend: **gateway + funciones especializadas**.
  - Gateway de negocio: `supabase/functions/api-minimarket/index.ts`
  - API interna proveedor: `supabase/functions/api-proveedor/index.ts`
  - funciones de automatización/cron: `cron-*`, `alertas-*`, `reportes-automaticos`, `reposicion-sugerida`.

### 2.2 Patrones de diseño utilizados (evidencia en código)
- Circuit Breaker:
  - `api-minimarket` (`supabase/functions/api-minimarket/index.ts:250`)
  - `api-proveedor` (`supabase/functions/api-proveedor/index.ts:319`)
  - shared breaker RPC state (`supabase/functions/_shared/circuit-breaker.ts`)
- Rate Limiting:
  - `api-minimarket` `60 req/min` (`supabase/functions/api-minimarket/index.ts:115`)
  - `api-proveedor` `120 req/min` por `endpoint+client` (`supabase/functions/api-proveedor/index.ts:65`, `:218`)
- Idempotencia:
  - reservas (`supabase/functions/api-minimarket/handlers/reservas.ts:72`)
  - ventas POS (`supabase/functions/api-minimarket/handlers/ventas.ts:131`)
- Caching:
  - cache in-memory + persistente en `cache_proveedor` (`supabase/functions/api-proveedor/utils/cache.ts:19`)
- Validacion defensiva:
  - helpers y validadores dedicados (`supabase/functions/api-minimarket/helpers/validation.ts`, `supabase/functions/api-proveedor/validators.ts`)

### 2.3 Flujo de datos (usuario -> respuesta)
1. Frontend obtiene token de sesión (`supabase.auth.getSession`) y llama al gateway (`minimarket-system/src/lib/apiClient.ts:75`, `:127`).
2. `api-minimarket` valida CORS/origen (`supabase/functions/api-minimarket/index.ts:162`), rate-limit (`:299`), y autentica JWT (`:281`).
3. Se aplica autorización por rol por endpoint (`checkRole`, `:319`).
4. Se consulta PostgREST/RPC con headers de usuario o service role según caso (`supabase/functions/api-minimarket/helpers/supabase.ts:89`, `:197`).
5. Respuesta uniforme `ok()/fail()` con `requestId` (`supabase/functions/_shared/response.ts:33`, `:101`).
6. En frontend, 401 dispara `auth_required` y cierre de sesión (`minimarket-system/src/lib/apiClient.ts:139`, `minimarket-system/src/contexts/AuthContext.tsx:41`).

### 2.4 Endpoints / rutas disponibles (TODOS)

- Criterio actualizado para `api-minimarket`: `55` guards de enrutamiento (`35` literales + `20` regex), derivados de `index.ts`. Se conserva en Apéndice B el inventario normalizado histórico de `52` operaciones para trazabilidad.

#### API minimarket (OpenAPI 3.1 parseable)

| Método | Ruta | Parámetros esperados | Qué hace |
|---|---|---|---|
| GET | `/bitacora` | query:limit(opt); query:offset(opt) | Listar notas de bitácora |
| POST | `/bitacora` | body:application/json | Crear nota de turno (bitácora) |
| GET | `/categorias` | - | Listar todas las categorías |
| GET | `/categorias/{id}` | path:id(req) | Obtener detalle de categoría |
| GET | `/clientes` | query:q(opt); query:limit(opt); query:offset(opt) | Listar clientes (incluye saldo de cuenta corriente) |
| POST | `/clientes` | body:application/json | Crear cliente |
| PUT | `/clientes/{id}` | path:id(req); body:application/json | Actualizar cliente |
| POST | `/cuentas-corrientes/pagos` | body:application/json | Registrar pago de cuenta corriente |
| GET | `/cuentas-corrientes/resumen` | - | Resumen de cuenta corriente ("dinero en la calle") |
| GET | `/cuentas-corrientes/saldos` | query:q(opt); query:solo_deuda(opt); query:limit(opt); query:offset(opt) | Saldos por cliente (cuenta corriente) |
| POST | `/deposito/ingreso` | body:producto_id(req),cantidad(req),proveedor_id(opt),precio_compra(opt) | Ingreso de mercadería al depósito |
| POST | `/deposito/movimiento` | body:producto_id(opt),tipo(opt),tipo_movimiento(opt),cantidad(opt),origen(opt),destino(opt),motivo(opt),proveedor_id(opt),observaciones(opt) | Registrar movimiento de inventario |
| GET | `/deposito/movimientos` | query:producto_id(opt); query:tipo_movimiento(opt); query:limit(opt) | Historial de movimientos de depósito |
| GET | `/health` | - | Health check del gateway |
| GET | `/insights/arbitraje` | - | Insights de arbitraje (riesgo de pérdida / margen bajo) |
| GET | `/insights/compras` | - | Insights de compras (stock bajo + caída de costo) |
| GET | `/insights/producto/{id}` | path:id(req) | Insight unificado de arbitraje por producto |
| POST | `/ofertas/aplicar` | body:application/json | Aplicar oferta por stock_id |
| GET | `/ofertas/sugeridas` | - | Ofertas sugeridas (<= 7 días) |
| POST | `/ofertas/{id}/desactivar` | path:id(req) | Desactivar oferta por id |
| GET | `/pedidos` | query:estado(opt); query:estado_pago(opt); query:fecha_desde(opt); query:fecha_hasta(opt); query:limit(opt); query:offset(opt) | Listar pedidos con filtros opcionales |
| POST | `/pedidos` | body:application/json | Crear un nuevo pedido |
| PUT | `/pedidos/items/{id}` | path:id(req); body:preparado(req) | Marcar item como preparado/no preparado |
| GET | `/pedidos/{id}` | path:id(req) | Obtener detalle de un pedido |
| PUT | `/pedidos/{id}/estado` | path:id(req); body:estado(req) | Actualizar estado del pedido |
| PUT | `/pedidos/{id}/pago` | path:id(req); body:monto_pagado(req) | Registrar pago del pedido |
| POST | `/precios/aplicar` | body:producto_id(req),precio_compra(req),margen_ganancia(opt) | Aplicar precio a producto con redondeo automático |
| GET | `/precios/margen-sugerido/{id}` | path:id(req) | Calcular margen sugerido para producto |
| GET | `/precios/producto/{id}` | path:id(req) | Historial de precios de un producto |
| POST | `/precios/redondear` | body:precio(req) | Redondear un precio (función de utilidad) |
| GET | `/productos` | query:categoria(opt); query:marca(opt); query:activo(opt); query:search(opt) | Listar productos con filtros opcionales |
| POST | `/productos` | body:sku(opt),nombre(req),categoria_id(opt),marca(opt),contenido_neto(opt) | Crear nuevo producto |
| GET | `/productos/dropdown` | - | Lista mínima de productos para selectores |
| DELETE | `/productos/{id}` | path:id(req) | Eliminar producto (soft delete) |
| GET | `/productos/{id}` | path:id(req) | Obtener detalle de producto |
| PUT | `/productos/{id}` | path:id(req); body:application/json | Actualizar producto |
| GET | `/proveedores` | - | Listar proveedores activos |
| GET | `/proveedores/dropdown` | - | Lista mínima de proveedores para selectores |
| GET | `/proveedores/{id}` | path:id(req) | Obtener detalle de proveedor |
| GET | `/reportes/efectividad-tareas` | query:usuario_id(opt); query:fecha_desde(opt); query:fecha_hasta(opt) | Reporte de efectividad de tareas por usuario |
| POST | `/reservas` | header:Idempotency-Key(req); body:producto_id(req),cantidad(req),referencia(opt),deposito(opt) | Crear reserva de stock |
| POST | `/reservas/{id}/cancelar` | path:id(req) | Cancelar una reserva |
| GET | `/search` | query:q(req); query:limit(opt) | Búsqueda global (productos, proveedores, tareas, pedidos, clientes) |
| GET | `/stock` | - | Consultar stock general de todos los productos |
| GET | `/stock/minimo` | - | Productos con stock bajo mínimo |
| GET | `/stock/producto/{id}` | path:id(req) | Stock específico de un producto |
| POST | `/tareas` | body:titulo(req),descripcion(opt),prioridad(opt),asignado_a(opt),fecha_limite(opt) | Crear nueva tarea |
| PUT | `/tareas/{id}/cancelar` | path:id(req) | Cancelar tarea |
| PUT | `/tareas/{id}/completar` | path:id(req) | Marcar tarea como completada |
| GET | `/ventas` | query:limit(opt); query:offset(opt) | Listar ventas |
| POST | `/ventas` | header:Idempotency-Key(req); body:application/json | Crear venta POS (idempotente) |
| GET | `/ventas/{id}` | path:id(req) | Obtener detalle de venta |
#### API minimarket - endpoints detectados en runtime y no documentados/derivados
- `POST /proveedores` y `PUT /proveedores/{id}` existen en runtime (`supabase/functions/api-minimarket/index.ts:848`, `supabase/functions/api-minimarket/index.ts:866`) pero no están en OpenAPI (`docs/api-openapi-3.1.yaml:903` solo define `GET`).
- `POST /compras/recepcion` existe en runtime (`supabase/functions/api-minimarket/index.ts:1683`) y NO ENCONTRADO en OpenAPI (`docs/api-openapi-3.1.yaml`).
- Runtime soporta compatibilidad `PUT /pedidos/items/{id}/preparado` vía regex opcional (`supabase/functions/api-minimarket/index.ts:1856`) y OpenAPI solo documenta `/pedidos/items/{id}` (`docs/api-openapi-3.1.yaml:1839`).

#### API proveedor (runtime real)
- La especificación `docs/api-proveedor-openapi-3.1.yaml` parsea OK en la revalidación actual, pero no refleja completamente el runtime.
- Endpoints runtime inferidos por último segmento de path (`supabase/functions/api-proveedor/index.ts:70`) y `endpointSchemas` (`supabase/functions/api-proveedor/schemas.ts:33`).

| Método real en runtime | Ruta resuelta por segmento final | Parámetros esperados | Qué hace |
|---|---|---|---|
| `ANY` (no se valida método) | `/precios` | query: `categoria`(opt), `limit`(opt, 1..500), `offset`(opt, >=0), `activo`(opt `true/false`) | Lista precios actuales del proveedor con paginación y estadísticas. |
| `ANY` | `/productos` | query: `busqueda`(opt), `categoria`(opt), `marca`(opt), `limit`(opt, 1..1000), `solo_con_stock`(opt bool), `ordenar_por`(opt) | Lista productos proveedor con filtros/facetas. |
| `ANY` | `/comparacion` | query: `solo_oportunidades`(opt bool), `min_diferencia`(opt >=0), `limit`(opt, 1..500), `orden`(opt), `incluir_analisis`(opt bool) | Compara precios proveedor vs sistema y calcula oportunidades. |
| `ANY` | `/sincronizar` | query: `categoria`(opt), `force_full`(opt bool), `priority`(opt) | Dispara scraping y comparación manual del proveedor. |
| `ANY` | `/status` | sin params relevantes | Estado operativo y métricas internas del módulo proveedor. |
| `ANY` | `/alertas` | query: `severidad`(opt), `tipo`(opt), `limit`(opt, 1..100), `solo_no_procesadas`(opt bool), `incluir_analisis`(opt bool) | Alertas de cambios y análisis de riesgo. |
| `ANY` | `/estadisticas` | query: `dias`(opt, 1..90), `categoria`(opt), `granularidad`(opt), `incluir_predicciones`(opt bool) | Métricas temporales y KPIs de scraping. |
| `ANY` | `/configuracion` | sin params relevantes | Configuración proveedor + análisis de salud/config score. |
| `ANY` | `/health` | sin params relevantes | Health check extendido (DB, scraper, cache, deps externas). |

#### API proveedor - drift doc/runtime confirmado
- Runtime soporta `/health` (`supabase/functions/api-proveedor/schemas.ts:10`, `:42`) y el OpenAPI no lo publica (`docs/api-proveedor-openapi-3.1.yaml`, listado de paths en `:301`,`:322`,`:391`,`:464`,`:531`,`:573`,`:639`,`:692`,`:735`,`:792`,`:816`).
- OpenAPI publica `/scrape`, `/compare`, `/alerts` (`docs/api-proveedor-openapi-3.1.yaml:735`, `:792`, `:816`) que NO están en `endpointList` runtime (`supabase/functions/api-proveedor/schemas.ts:12`).

#### Frontend (rutas SPA)
- Rutas principales en `minimarket-system/src/App.tsx`: `/login`, `/`, `/deposito`, `/kardex`, `/stock`, `/rentabilidad`, `/tareas`, `/productos`, `/proveedores`, `/ventas`, `/pedidos`, `/pocket`, `/pos`, `/clientes`, `*`.

### 2.5 Middleware implementado (lista y función)

| Middleware / Guardia | Ubicación | Función |
|---|---|---|
| CORS validate + preflight | `supabase/functions/_shared/cors.ts:47`, `:19` | valida `Origin`, arma headers CORS y responde `OPTIONS` |
| Origin required (browser) | `supabase/functions/api-minimarket/index.ts:171` | bloquea browser requests sin `Origin` (configurable con `REQUIRE_ORIGIN`) |
| Origin allowlist interna | `supabase/functions/api-proveedor/utils/auth.ts:99` | bloquea orígenes no internos para API proveedor |
| Auth JWT usuario | `supabase/functions/api-minimarket/index.ts:281`, `supabase/functions/api-minimarket/helpers/auth.ts:174` | valida token vía `/auth/v1/user` |
| Auth shared secret | `supabase/functions/api-proveedor/index.ts:296`, `supabase/functions/api-proveedor/utils/auth.ts:45` | valida `x-api-secret` timing-safe |
| Service-role guard cron/internal | `supabase/functions/_shared/internal-auth.ts:30` | exige token `service_role` para cron/internal endpoints |
| Role guard | `supabase/functions/api-minimarket/index.ts:319`, `supabase/functions/api-minimarket/helpers/auth.ts:294` | autorización por rol (`admin`, `deposito`, `ventas`) |
| Rate limit | `supabase/functions/api-minimarket/index.ts:299`, `supabase/functions/api-proveedor/index.ts:314` | limita requests por ventana y devuelve `429` |
| Circuit breaker | `supabase/functions/api-minimarket/index.ts:250`, `supabase/functions/api-proveedor/index.ts:319` | evita cascadas cuando servicios subyacentes fallan |
| Global error handler | `supabase/functions/api-minimarket/index.ts:2189`, `supabase/functions/api-proveedor/index.ts:332` | normaliza y responde errores unificados |

### 2.6 Modelos / esquemas de datos

#### Modelos de API proveedor (schema runtime)

| Endpoint | requiresAuth | Fuente |
|---|---:|---|
| `precios` | `true` | `supabase/functions/api-proveedor/schemas.ts:34` |
| `productos` | `true` | `supabase/functions/api-proveedor/schemas.ts:35` |
| `comparacion` | `true` | `supabase/functions/api-proveedor/schemas.ts:36` |
| `sincronizar` | `true` | `supabase/functions/api-proveedor/schemas.ts:37` |
| `status` | `true` | `supabase/functions/api-proveedor/schemas.ts:38` |
| `alertas` | `true` | `supabase/functions/api-proveedor/schemas.ts:39` |
| `estadisticas` | `true` | `supabase/functions/api-proveedor/schemas.ts:40` |
| `configuracion` | `true` | `supabase/functions/api-proveedor/schemas.ts:41` |
| `health` | `false` | `supabase/functions/api-proveedor/schemas.ts:42` |

#### Modelo de datos SQL (estructura completa por tabla)

| Tabla | Columnas (estructura) | Fuente |
|---|---|---|
| `alertas_cambios_precios` | id, producto_id, nombre_producto, tipo_cambio, valor_anterior, valor_nuevo, porcentaje_cambio, severidad, mensaje, accion_recomendada, fecha_alerta, procesada, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:64` |
| `categorias` | id, codigo, nombre, descripcion, parent_id, nivel, margen_minimo, margen_maximo, activo, created_at, updated_at | `supabase/migrations/20260109070000_create_core_tables.sql:4` |
| `circuit_breaker_state` | breaker_key, state, failure_count, success_count, opened_at, last_failure_at, updated_at | `supabase/migrations/20260208030000_add_circuit_breaker_state.sql:7` |
| `comparacion_precios` | id, producto_id, nombre_producto, precio_actual, precio_proveedor, diferencia_absoluta, diferencia_porcentual, fuente, fecha_comparacion, es_oportunidad_ahorro, recomendacion, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:42` |
| `configuracion_proveedor` | id, nombre, frecuencia_scraping, umbral_cambio_precio, proxima_sincronizacion, ultima_sincronizacion, configuraciones, activo, created_at, updated_at | `supabase/migrations/20260104020000_create_missing_objects.sql:7` |
| `cron_jobs_alerts` | id, job_id, execution_id, tipo_alerta, severidad, titulo, descripcion, accion_recomendada, canales_notificacion, fecha_envio, estado_alerta, fecha_resolucion, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:218` |
| `cron_jobs_config` | id, job_id, cron_expression, edge_function_name, cron_job_name, descripcion, parametros, is_active, created_at, updated_at | `supabase/migrations/20260104020000_create_missing_objects.sql:307` |
| `cron_jobs_execution_log` | id, job_id, execution_id, start_time, end_time, duracion_ms, estado, request_id, parametros_ejecucion, resultado, error_message, memory_usage_start, productos_procesados, productos_exitosos, productos_fallidos, alertas_generadas, emails_enviados, sms_enviad... | `supabase/migrations/20260104020000_create_missing_objects.sql:191` |
| `cron_jobs_health_checks` | id, job_id, status, response_time_ms, last_success, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:292` |
| `cron_jobs_metrics` | id, job_id, fecha_metricas, ejecuciones_totales, disponibilidad_porcentual, tiempo_promedio_ms, alertas_generadas_total, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:259` |
| `cron_jobs_monitoring_history` | id, timestamp, uptime_percentage, response_time_ms, memory_usage_percent, active_jobs_count, success_rate, alerts_generated, health_score, details, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:275` |
| `cron_jobs_notification_preferences` | id, user_id, channel_id, enabled, preferences, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:323` |
| `cron_jobs_notifications` | id, template_id, channel_id, priority, source, recipients, data, status, message_id, error_message, sent_at, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:241` |
| `cron_jobs_tracking` | id, job_id, nombre_job, descripcion, activo, estado_job, ultima_ejecucion, proxima_ejecucion, duracion_ejecucion_ms, intentos_ejecucion, resultado_ultima_ejecucion, error_ultima_ejecucion, circuit_breaker_state, created_at, updated_at | `supabase/migrations/20260104020000_create_missing_objects.sql:168` |
| `estadisticas_scraping` | id, fuente, categoria, granularidad, productos_totales, productos_actualizados, productos_nuevos, productos_fallidos, comparaciones_realizadas, duracion_ms, errores, detalle, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:23` |
| `movimientos_deposito` | id, producto_id, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, motivo, usuario_id, proveedor_id, observaciones, fecha_movimiento, created_at | `supabase/migrations/20260109070000_create_core_tables.sql:120` |
| `notificaciones_tareas` | id, tarea_id, tipo, mensaje, usuario_destino_id, usuario_destino_nombre, fecha_envio, leido, created_at, updated_at | `supabase/migrations/20260109070000_create_core_tables.sql:218` |
| `ordenes_compra` | id, producto_id, proveedor_id, cantidad, cantidad_recibida, estado, fecha_creacion, fecha_estimada, created_at, updated_at | `supabase/migrations/20260104020000_create_missing_objects.sql:105` |
| `personal` | id, user_auth_id, nombre, email, telefono, rol, departamento, activo, fecha_ingreso, direccion, created_at, updated_at | `supabase/migrations/20260109070000_create_core_tables.sql:242` |
| `precios_historicos` | id, producto_id, precio_anterior, precio_nuevo, fecha_cambio, motivo_cambio, usuario_id, precio, fuente, fecha, cambio_porcentaje, created_at | `supabase/migrations/20260109070000_create_core_tables.sql:154` |
| `precios_proveedor` | id, sku, nombre, marca, categoria, precio_unitario, precio_promocional, precio_actual, precio_anterior, stock_disponible, stock_nivel_minimo, codigo_barras, url_producto, imagen_url, descripcion, hash_contenido, score_confiabilidad, ultima_actualizacion, fu... | `supabase/migrations/20260109060000_create_precios_proveedor.sql:1` |
| `productos` | id, nombre, descripcion, categoria, categoria_id, marca, contenido_neto, dimensiones, codigo_barras, sku, precio_actual, precio_costo, precio_sugerido, margen_ganancia, proveedor_principal_id, observaciones, activo, created_by, updated_by, created_at, updat... | `supabase/migrations/20260109070000_create_core_tables.sql:51` |
| `productos_faltantes` | id, producto_id, producto_nombre, fecha_reporte, reportado_por_id, reportado_por_nombre, proveedor_asignado_id, resuelto, fecha_resolucion, observaciones, cantidad_faltante, prioridad, estado, fecha_deteccion, cantidad_pedida, precio_estimado, created_at, u... | `supabase/migrations/20260109070000_create_core_tables.sql:180` |
| `proveedores` | id, nombre, contacto, email, telefono, productos_ofrecidos, direccion, cuit, sitio_web, activo, created_at, updated_at | `supabase/migrations/20260109070000_create_core_tables.sql:31` |
| `public.bitacora_turnos` | id, usuario_id, usuario_nombre, usuario_email, usuario_rol, nota, created_at | `supabase/migrations/20260207030000_create_bitacora_turnos.sql:14` |
| `public.cache_proveedor` | endpoint, payload, updated_at, ttl_seconds | `supabase/migrations/20251103_create_cache_proveedor.sql:1` |
| `public.clientes` | id, nombre, telefono, email, direccion_default, edificio, piso, departamento, observaciones, activo, created_at, updated_at | `supabase/migrations/20260206000000_create_clientes.sql:8` |
| `public.cron_jobs_locks` | job_id, locked_until, locked_by, updated_at | `supabase/migrations/20260204110000_add_cron_job_locks.sql:3` |
| `public.cuentas_corrientes_movimientos` | id, cliente_id, venta_id, usuario_id, tipo, monto, descripcion, created_at | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:139` |
| `public.detalle_pedidos` | id, pedido_id, producto_id, producto_nombre, producto_sku, cantidad, precio_unitario, subtotal, preparado, fecha_preparado, preparado_por_id, observaciones, created_at | `supabase/migrations/20260206020000_create_detalle_pedidos.sql:8` |
| `public.ofertas_stock` | id, stock_id, descuento_pct, precio_oferta, activa, created_by, created_at, updated_at, deactivated_by, deactivated_at | `supabase/migrations/20260207020000_create_ofertas_stock.sql:18` |
| `public.pedidos` | id, numero_pedido, cliente_id, cliente_nombre, cliente_telefono, tipo_entrega, direccion_entrega, edificio, piso, departamento, horario_entrega_preferido, estado, estado_pago, monto_total, monto_pagado, observaciones, observaciones_internas, audio_url, tran... | `supabase/migrations/20260206010000_create_pedidos.sql:8` |
| `public.venta_items` | id, venta_id, producto_id, producto_nombre_snapshot, producto_sku_snapshot, cantidad, precio_unitario, subtotal, created_at | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:116` |
| `public.ventas` | id, idempotency_key, usuario_id, cliente_id, metodo_pago, monto_total, created_at, updated_at | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:89` |
| `rate_limit_state` | key, count, window_start, updated_at | `supabase/migrations/20260208020000_add_rate_limit_state.sql:7` |
| `stock_deposito` | id, producto_id, cantidad_actual, stock_minimo, stock_maximo, ubicacion, lote, fecha_vencimiento, created_at, updated_at | `supabase/migrations/20260109070000_create_core_tables.sql:96` |
| `stock_reservado` | id, producto_id, cantidad, estado, referencia, usuario, fecha_reserva, fecha_cancelacion, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:90` |
| `tareas_pendientes` | id, titulo, descripcion, tipo, prioridad, estado, datos, asignado_a_id, asignada_a_id, asignada_a_nombre, creada_por_id, creada_por_nombre, fecha_creacion, fecha_vencimiento, fecha_completado, fecha_completada, completado_por_id, completada_por_id, completa... | `supabase/migrations/20260104020000_create_missing_objects.sql:124` |
### 2.7 Relaciones entre entidades

| Relación | Fuente |
|---|---|
| `categorias.parent_id -> categorias.id` | `supabase/migrations/20260109070000_create_core_tables.sql:20` |
| `productos.categoria_id -> categorias.id` | `supabase/migrations/20260109070000_create_core_tables.sql:77` |
| `productos.proveedor_principal_id -> proveedores.id` | `supabase/migrations/20260109070000_create_core_tables.sql:83` |
| `stock_deposito.producto_id -> productos.id` | `supabase/migrations/20260109070000_create_core_tables.sql:111` |
| `movimientos_deposito.producto_id -> productos.id` | `supabase/migrations/20260109070000_create_core_tables.sql:137` |
| `movimientos_deposito.proveedor_id -> proveedores.id` | `supabase/migrations/20260109070000_create_core_tables.sql:143` |
| `precios_historicos.producto_id -> productos.id` | `supabase/migrations/20260109070000_create_core_tables.sql:171` |
| `productos_faltantes.producto_id -> productos.id` | `supabase/migrations/20260109070000_create_core_tables.sql:203` |
| `productos_faltantes.proveedor_asignado_id -> proveedores.id` | `supabase/migrations/20260109070000_create_core_tables.sql:209` |
| `notificaciones_tareas.tarea_id -> tareas_pendientes.id` | `supabase/migrations/20260109070000_create_core_tables.sql:233` |
| `ordenes_compra.producto_id -> productos.id` | `supabase/migrations/20260110000000_fix_constraints_and_indexes.sql:38` |
| `ordenes_compra.proveedor_id -> proveedores.id` | `supabase/migrations/20260110000000_fix_constraints_and_indexes.sql:58` |
| `stock_reservado.producto_id -> productos.id` | `supabase/migrations/20260110000000_fix_constraints_and_indexes.sql:18` |
| `pedidos.cliente_id -> clientes.id` | `supabase/migrations/20260206010000_create_pedidos.sql:15` |
| `detalle_pedidos.pedido_id -> pedidos.id` | `supabase/migrations/20260206020000_create_detalle_pedidos.sql:12` |
| `detalle_pedidos.producto_id -> productos.id` | `supabase/migrations/20260206020000_create_detalle_pedidos.sql:15` |
| `ventas.cliente_id -> clientes.id` | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:93` |
| `venta_items.venta_id -> ventas.id` | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:118` |
| `venta_items.producto_id -> productos.id` | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:119` |
| `cuentas_corrientes_movimientos.cliente_id -> clientes.id` | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:141` |
| `cuentas_corrientes_movimientos.venta_id -> ventas.id` | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:142` |
| `ofertas_stock.stock_id -> stock_deposito.id` | `supabase/migrations/20260207020000_create_ofertas_stock.sql:20` |

### 2.8 Flujos de negocio principales (paso a paso)

#### Flujo A - Venta POS (con idempotencia)
1. Frontend envía `POST /ventas` con `Idempotency-Key` (`supabase/functions/api-minimarket/index.ts:2037`).
2. Handler valida método de pago, cliente y items (`supabase/functions/api-minimarket/handlers/ventas.ts:83`, `:106`, `:131`).
3. Gateway invoca RPC `sp_procesar_venta_pos` (`supabase/functions/api-minimarket/handlers/ventas.ts:140`).
4. RPC aplica idempotencia y locking (`supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:274`, `:360`).
5. Responde `201` o `200 idempotent=true` (`supabase/functions/api-minimarket/handlers/ventas.ts:154`).

#### Flujo B - Reserva de stock (doble submit protegido)
1. Frontend llama `POST /reservas` con `Idempotency-Key` (`supabase/functions/api-minimarket/index.ts:1641`).
2. Handler valida UUID/cantidad/key (`supabase/functions/api-minimarket/handlers/reservas.ts:61`, `:65`, `:74`).
3. RPC `sp_reservar_stock` hace lock y deduplicación por `idempotency_key` (`supabase/migrations/20260204120000_add_sp_reservar_stock.sql:40`, `:81`, `:89`).
4. Devuelve reserva nueva o existente (`supabase/functions/api-minimarket/handlers/reservas.ts:96`).

#### Flujo C - Pedidos y preparación
1. Creación pedido por `POST /pedidos` (`supabase/functions/api-minimarket/index.ts:1784`).
2. Cambio de estado por `PUT /pedidos/{id}/estado` (`supabase/functions/api-minimarket/index.ts:1802`).
3. Registro de pago por `PUT /pedidos/{id}/pago` (`supabase/functions/api-minimarket/index.ts:1827`).
4. Preparación de ítems por `PUT /pedidos/items/{id}` (`supabase/functions/api-minimarket/index.ts:1856`).

#### Flujo D - Sincronización proveedor y análisis
1. Gateway interno llama `api-proveedor` con `x-api-secret` (`supabase/functions/api-proveedor/utils/auth.ts:45`).
2. API proveedor enruta por endpoint (`supabase/functions/api-proveedor/index.ts:275`, `supabase/functions/api-proveedor/router.ts:21`).
3. Usa caché en memoria + persistente (`supabase/functions/api-proveedor/utils/cache.ts:19`, `:120`).
4. Retorna métricas/alertas/comparaciones para decisiones de compra.

#### Flujo E - Alertas automáticas (cron)
1. `pg_cron` dispara procedimientos `*_invoke` (migración) (`supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql:102`).
2. Procedimiento usa `net.http_post` hacia Edge Functions (`supabase/migrations/20260211062617_cron_jobs_use_vault_secret.sql:21`).
3. Edge Function valida token de servicio (`supabase/functions/_shared/internal-auth.ts:30`).
4. Registra/loguea resultados y alertas (`supabase/functions/cron-health-monitor/index.ts:91`).

### 2.9 Procesos en background / cron jobs

| Job | Cron | Acción | Fuente |
|---|---|---|---|
| `notificaciones-tareas_invoke` | `0 */2 * * *` | `CALL notificaciones_tareas_5492c915()` -> Edge Function `notificaciones-tareas` | `supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql:102` |
| `alertas-stock_invoke` | `0 * * * *` | `CALL alertas_stock_38c42a40()` -> Edge Function `alertas-stock` | `supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql:108` |
| `reportes-automaticos_invoke` | `0 8 * * *` | `CALL reportes_automaticos_523bf055()` -> Edge Function `reportes-automaticos` | `supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql:114` |
| `maintenance_cleanup` | `0 4 * * 0` | `CALL maintenance_cleanup_7b3e9d1f()` -> Edge Function `cron-jobs-maxiconsumo` action `maintenance_cleanup` | `supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql:148` |
| `refresh_stock_views_hourly` (opcional) | `0 * * * *` | `SELECT fn_refresh_stock_views()` | `supabase/migrations/20260208010000_add_refresh_stock_views_rpc_and_cron.sql:51` |
| `daily_price_update` (legacy SQL) | `0 2 * * *` | `CALL daily_price_update_9f7c2a8b()` | `supabase/cron_jobs/deploy_all_cron_jobs.sql:34` |
| `weekly_trend_analysis` (legacy SQL) | `0 3 * * 0` | `CALL weekly_trend_analysis_3d8e5f7c()` | `supabase/cron_jobs/deploy_all_cron_jobs.sql:63` |
| `realtime_change_alerts` (legacy SQL) | `*/15 * * * *` | `CALL realtime_change_alerts_5a9b4c2d()` | `supabase/cron_jobs/deploy_all_cron_jobs.sql:93` |

### 2.10 WebSockets / eventos en tiempo real
- WebSockets: **NO IMPLEMENTADO** (NO ENCONTRADO uso de `WebSocket`/Realtime channels en frontend/backend).
- Eventos internos frontend: `authEvents` por pub/sub local (`minimarket-system/src/lib/authEvents.ts:1`).

---

## 3. MANEJO DE ERRORES Y VALIDACIONES

### 3.1 Manejo global de errores
- `api-minimarket`: catch global con `toAppError` y `fail(...)` (`supabase/functions/api-minimarket/index.ts:2189-2228`).
- `api-proveedor`: catch global con `toAppError` y `fail(...)` (`supabase/functions/api-proveedor/index.ts:332-347`).
- Edge Functions restantes: todas las `index.ts` de funciones deployables tienen `try/catch` top-level (13/13 verificadas).

### 3.2 Manejo por endpoint / función individual
- `api-minimarket`: mayormente sin `try/catch` por endpoint; depende del catch global + handlers específicos.
- `api-proveedor`: sin `try/catch` por endpoint en router; depende del catch global (`supabase/functions/api-proveedor/router.ts:21`).
- Handlers con manejo interno explícito: por ejemplo `ventas`, `reservas`, `notificaciones-tareas` (`supabase/functions/api-minimarket/handlers/ventas.ts:139`, `supabase/functions/api-minimarket/handlers/reservas.ts:81`, `supabase/functions/notificaciones-tareas/index.ts:110`).

### 3.3 Datos vacíos/nulos/undefined/formato incorrecto
- Validación robusta en gateway:
  - UUID/int/number helpers (`supabase/functions/api-minimarket/helpers/validation.ts:16`, `:41`, `:50`).
  - Paginación segura (`supabase/functions/api-minimarket/helpers/pagination.ts:30`).
- API proveedor valida rango/tipos y sanea params (`supabase/functions/api-proveedor/validators.ts:18`, `:39`, `:60`, `:96`, `:116`).
- Casos frágiles detectados:
  - `warning_days` y `urgent_days` pueden resultar `NaN` (no guard explícito) en `alertas-vencimientos` (`supabase/functions/alertas-vencimientos/index.ts:40-41`).
  - `parseInt` sin fallback explícito en `reposicion-sugerida` (`supabase/functions/reposicion-sugerida/index.ts:82-83`).

### 3.4 Qué pasa si DB no responde o se cae
- Se convierte error a `503`/`500` según tipo (`supabase/functions/_shared/errors.ts:91`, `:99`, `:190`).
- `api-minimarket` usa circuit breaker + fallback en memoria (`supabase/functions/api-minimarket/index.ts:250`, `:267`).
- `api-proveedor` corta con `CIRCUIT_OPEN` (`supabase/functions/api-proveedor/index.ts:319-322`).

### 3.5 Qué pasa si API externa/tercero falla
- `api-proveedor` clasifica errores reintentables (`supabase/functions/api-proveedor/index.ts:337`).
- `alertas-stock` captura errores por item y continúa (`supabase/functions/alertas-stock/index.ts:144`).
- `notificaciones-tareas` acumula errores por tarea y devuelve resumen (`supabase/functions/notificaciones-tareas/index.ts:155`).

### 3.6 Validaciones de entrada (dónde y cuáles)
- Gateway minimarket: UUIDs, enteros positivos/no negativos, booleans, ISO dates, allowlist de campos (`supabase/functions/api-minimarket/helpers/validation.ts:16-130`).
- API proveedor: límites de `limit`, `offset`, `dias`, enums de orden/severidad/prioridad (`supabase/functions/api-proveedor/validators.ts:21-123`).
- CORS/origen/secret: `validateOrigin`, `validateInternalOrigin`, `validateApiSecret` (`supabase/functions/_shared/cors.ts:47`, `supabase/functions/api-proveedor/utils/auth.ts:99`, `:45`).

### 3.7 Respuestas de error al usuario (formato y códigos)
- Formato estándar: `{ success:false, error:{ code, message, details? }, requestId? }` (`supabase/functions/_shared/response.ts:14`, `:155`).
- Códigos HTTP observados: `400`, `401`, `403`, `404`, `409`, `429`, `500`, `503`.
- Frontend convierte errores en `ApiError` con `requestId` (`minimarket-system/src/lib/apiClient.ts:30`, `:142`).

### 3.8 Logs de errores y almacenamiento
- Backend: logger estructurado `_shared/logger.ts` y salida de runtime (`supabase/functions/api-minimarket/index.ts:2211`, `supabase/functions/api-proveedor/index.ts:338`).
- Frontend: `localStorage` (`mm_error_reports_v1`) + Sentry opcional (`minimarket-system/src/lib/observability.ts:45`, `:154`).
- No hay evidencia de centralización SIEM externa obligatoria en repo: **NO IMPLEMENTADO / NO ENCONTRADO**.

### 3.9 Funciones/endpoints SIN manejo de errores individual
- Endpoints `api-minimarket` listados en **Apéndice B** (inventario normalizado histórico de 52): no tienen `try/catch` individual por ruta; dependen del catch global de `index.ts`.
- Endpoints `api-proveedor` listados en **Apéndice C** (9 runtime): idem, manejados por catch global de `index.ts`.
- Nota: manejo global existe en ambos, por lo tanto **NO se detectaron endpoints totalmente sin manejo de errores**.

---

## 4. SEGURIDAD

### 4.1 Autenticación
- Frontend: Supabase Auth (`signInWithPassword`, `signUp`, `signOut`) (`minimarket-system/src/contexts/AuthContext.tsx:53`, `:63`, `:82`).
- Backend `api-minimarket`: JWT usuario vía `/auth/v1/user` (`supabase/functions/api-minimarket/helpers/auth.ts:174`).
- Backend `api-proveedor`: shared secret `x-api-secret` timing-safe (`supabase/functions/api-proveedor/utils/auth.ts:45`, `:25`).

### 4.2 Autorización por roles/permisos
- Gateway: `requireRole` (`supabase/functions/api-minimarket/helpers/auth.ts:294`).
- RLS DB: función `public.has_personal_role(...)` + políticas (`supabase/migrations/20260212130000_rls_fine_validation_lockdown.sql:22`).

### 4.3 Sanitización de inputs
- Sanitización básica texto/query en gateway y proveedor (`supabase/functions/api-minimarket/helpers/validation.ts:59`, `supabase/functions/api-proveedor/validators.ts:19`).
- SQL injection mitigado por uso de PostgREST parametrizado y RPC (sin SQL raw dinámico expuesto en HTTP).

### 4.4 Hash de contraseñas
- No hay hashing custom en repo para credenciales de usuario final.
- Gestión de password delegada a Supabase Auth: **IMPLEMENTADO EXTERNAMENTE (Supabase)**.

### 4.5 Rate limiting
- `api-minimarket`: `60 req/min` (`supabase/functions/api-minimarket/index.ts:115`).
- `api-proveedor`: `120 req/min` por `endpoint:client` (`supabase/functions/api-proveedor/index.ts:65`, `:218`).

### 4.6 CORS
- CORS centralizado con allowlist por `ALLOWED_ORIGINS` (`supabase/functions/_shared/cors.ts:30`, `:47`).
- Bloqueo de orígenes no permitidos y browser sin `Origin` cuando aplica (`supabase/functions/api-minimarket/index.ts:171`, `:193`).

### 4.7 Security headers (Helmet/CSP/etc.)
- `Helmet`/`CSP`/`HSTS`/`X-Frame-Options`: **NO IMPLEMENTADO / NO ENCONTRADO** en código servidor/frontend.

### 4.8 Endpoints expuestos sin protección
- `GET /health` en `api-minimarket` es público (`supabase/functions/api-minimarket/index.ts:2176`).
- `health` en `api-proveedor` tiene `requiresAuth=false` (`supabase/functions/api-proveedor/schemas.ts:42`).
- Riesgo: exposición de estado operacional si no hay filtrado perimetral.

### 4.9 Manejo de tokens
- Expiración JWT `3600s` y refresh rotation habilitada en Supabase config (`supabase/config.toml:127`, `:133`).
- Frontend propaga `Authorization: Bearer <token>` y corta sesión ante `401` (`minimarket-system/src/lib/apiClient.ts:107`, `:139`).

### 4.10 Datos sensibles hardcodeados
- No se encontraron secretos productivos hardcodeados en código fuente principal.
- Sí hay default test secret en scripts locales:
  - `scripts/run-integration-tests.sh:119`
  - `scripts/run-e2e-tests.sh:116`

### 4.11 `.env` en `.gitignore`
- Confirmado: `.env` ignorado (`.gitignore:118`, `.gitignore:219`).

### 4.12 Dependencias con vulnerabilidades conocidas
- Root (`npm audit`):
  - `@modelcontextprotocol/sdk` HIGH (GHSA-345p-7cg4-v4c7) (`/tmp/npm-audit-root.json`).
  - `qs` LOW (GHSA-w7fw-mjwx-w883).
- Frontend (`pnpm audit`):
  - `@remix-run/router` HIGH (GHSA-2w69-qvjg-hvjx) (`/tmp/pnpm-audit-frontend.json`).
  - `lodash` MODERATE (GHSA-xxjr-mmjv-4gpg).

---

## 5. RENDIMIENTO Y ESCALABILIDAD

### 5.1 Consultas potencialmente lentas / sin índice / costosas
- Varias funciones consultan tablas completas sin paginación:
  - `stock_deposito?select=*` en `alertas-stock` (`supabase/functions/alertas-stock/index.ts:36`).
  - `stock_deposito?select=*` en `reportes-automaticos` (`supabase/functions/reportes-automaticos/index.ts:42`).
- [HISTORICO SUPERADO] `reportes-automaticos` ya usa `fecha_movimiento` y `tipo_movimiento` en codigo actual (`supabase/functions/reportes-automaticos/index.ts:68-80`).

### 5.2 N+1 queries
- `alertas-stock`: por cada item consulta producto y luego proveedor (`supabase/functions/alertas-stock/index.ts:53-99`).
- `notificaciones-tareas`: por cada tarea consulta última notificación (`supabase/functions/notificaciones-tareas/index.ts:110-127`).

### 5.3 Paginación
- Implementada en varios listados de gateway (`parsePagination`) (`supabase/functions/api-minimarket/helpers/pagination.ts:30`).
- Parcial/no uniforme: algunos endpoints masivos no paginan (`/stock`, procesos cron).

### 5.4 Caché
- `api-proveedor`: caché en memoria + persistente en `cache_proveedor` (`supabase/functions/api-proveedor/utils/cache.ts:19`, `:120`).
- TTLs definidos por endpoint (`supabase/functions/api-proveedor/utils/cache.ts:22`, `:31`).

### 5.5 Operaciones síncronas que deberían ser asíncronas
- No se detectaron bloqueos críticos por I/O síncrono en path serverless principal.
- Sí existen loops secuenciales con múltiples `await fetch` (impacto en latencia bajo carga): `alertas-stock`, `notificaciones-tareas`.

### 5.6 Archivos/imágenes y uploads
- App no implementa upload directo de archivos en rutas auditadas: **NO ENCONTRADO**.
- Supabase Storage tiene límite `50MiB` (`supabase/config.toml:106`).

### 5.7 Pool de conexiones a BD
- Local config: `db.pooler.enabled=false` (`supabase/config.toml:37`).
- Runtime principal usa HTTP PostgREST/RPC (no cliente PG persistente desde Node/Deno).

### 5.8 Memory leaks potenciales
- Riesgo en `api-proveedor`: `RATE_LIMITERS` map sin evicción (`supabase/functions/api-proveedor/index.ts:59`, `:62-67`).
- Riesgo en `_shared/rate-limit`: buckets no eliminan claves inactivas automáticamente (`supabase/functions/_shared/rate-limit.ts:73`, `:80-97`).
- `cron-health-monitor` sí limita historial a 144 entradas (`supabase/functions/cron-health-monitor/index.ts:598-600`).

### 5.9 Comportamiento con 100 y 1000 usuarios simultáneos (estimado)
- 100 usuarios:
  - Gateway debería sostener carga moderada por rate limiting + circuit breaker, con posible degradación en endpoints N+1.
- 1000 usuarios:
  - Alto riesgo de latencia/errores en endpoints con loops secuenciales y consultas full-table.
  - Riesgo de presión de memoria por maps in-memory de rate-limit en instancias largas.
  - [HISTORICO SUPERADO] El mismatch de esquema previamente reportado en `reportes-automaticos` no aplica al codigo actual.

---

## 6. CASOS BORDE Y ESCENARIOS CRÍTICOS

| Escenario | Resultado observado/inferido | Evidencia |
|---|---|---|
| Formulario vacío | Validaciones devuelven `400 VALIDATION_ERROR` en rutas críticas | `supabase/functions/api-minimarket/handlers/ventas.ts:107`, `supabase/functions/api-minimarket/handlers/reservas.ts:61` |
| Formato inesperado | parse/guards bloquean (UUID, ints, booleans, rangos) | `supabase/functions/api-minimarket/helpers/validation.ts:16-54`, `supabase/functions/api-proveedor/validators.ts:21-123` |
| Doble submit | Protegido en `reservas` y `ventas` por idempotency key | `supabase/functions/api-minimarket/handlers/reservas.ts:74`, `supabase/functions/api-minimarket/handlers/ventas.ts:131` |
| Sesión expirada en operación | `401` dispara `auth_required` y signOut | `minimarket-system/src/lib/apiClient.ts:139-141`, `minimarket-system/src/contexts/AuthContext.tsx:42-44` |
| Pérdida de internet del usuario | `fetch` lanza error; no hay UX offline global unificado | `minimarket-system/src/lib/apiClient.ts:152-165` |
| Dos usuarios modifican mismo recurso | En ventas/reservas hay locking transaccional; en updates simples prevalece último write | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:360-377`, `supabase/migrations/20260204120000_add_sp_reservar_stock.sql:40-55` |
| Recurso inexistente | `404` estandarizado | `supabase/functions/api-minimarket/index.ts:2188`, `supabase/functions/api-proveedor/index.ts:277-283` |
| Acceso sin permisos | `401/403` por auth/roles | `supabase/functions/api-minimarket/helpers/auth.ts:294-310`, `supabase/functions/api-proveedor/index.ts:299-302` |
| Valores extremos (largos/especiales/emojis/scripts) | Parcial: saneo básico texto en algunos flujos; no validación homogénea global de longitud | `supabase/functions/api-minimarket/helpers/validation.ts:59`, `supabase/functions/api-proveedor/validators.ts:19` |
| Diferencias de timezone | Uso mayoritario de ISO UTC (`toISOString`), pero sin estrategia TZ de negocio explícita | `supabase/functions/api-minimarket/index.ts:2179`, `supabase/functions/notificaciones-tareas/index.ts:112` |
| Campos opcionales vs obligatorios | Bien definidos en endpoints principales; inconsistencias puntuales en docs OpenAPI vs runtime | `supabase/functions/api-minimarket/handlers/ventas.ts:83-109`, `docs/api-openapi-3.1.yaml:903` |

---

## 7. TESTING Y CALIDAD

### 7.1 Tests existentes (tipo y cantidad)
- Unitarios backend/frontend core: `58` archivos (`tests/unit`).
- Integración: `0` archivos en `tests/integration` (pipeline usa script de integración con Vitest config dedicado).
- E2E backend smoke: `1` (`tests/e2e`).
- Contracts/Security/Performance: `1` archivo por suite (`tests/api-contracts`, `tests/security`, `tests/performance`).
- Frontend component/hook tests: `30` (`minimarket-system/src/**/*.test.ts[x]`).

### 7.2 Cobertura aproximada
- Statements: `89.20%`
- Functions: `93.29%`
- Branches: `80.92%`
- Threshold global requerido: `80%` (`vitest.config.ts:44-50`)

### 7.3 Partes sin tests / gaps
- Integración real depende de `.env.test` y actualmente falla si no existe (`scripts/run-integration-tests.sh:26-45`).
- Cobertura de flujos de deployment/ops y scripts bash es parcial/no automatizada.

### 7.4 Linter/formatter
- Linter: **IMPLEMENTADO** (ESLint frontend) (`minimarket-system/eslint.config.js:1`).
- Formatter: **NO ENCONTRADO** config dedicada (`.prettierrc`/equivalente).

### 7.5 CI/CD
- CI implementado con GitHub Actions (`.github/workflows/ci.yml`).
- Backup diario implementado (`.github/workflows/backup.yml:4-7`).
- Estado último quality-gates local auditado: unit pass + fallo integración por `.env.test` ausente (`test-reports/quality-gates_20260217-032720.log:463-470`).

---

## 8. DEPLOYMENT Y PRODUCCIÓN

### 8.1 Configuración prod vs dev
- Sí existe diferenciación por scripts (`deploy.sh`, `setup.sh`, `migrate.sh`) y `BUILD_MODE=prod` en frontend (`minimarket-system/vite.config.ts:7`).

### 8.2 Docker
- `Dockerfile` / `docker-compose`: **NO ENCONTRADO**.

### 8.3 Scripts de build/deploy
- Build frontend: `minimarket-system/package.json` scripts `build`, `build:prod`.
- Deploy: `deploy.sh` con `dev/staging/production` (`deploy.sh:8`, `:23`).

### 8.4 Versionamiento
- Versiones en `package.json` (`1.0.0`) y frontend (`0.0.0`).
- No se observó estrategia de release semver automatizada: **NO IMPLEMENTADO / NO ENCONTRADO**.

### 8.5 HTTPS
- Local Supabase TLS deshabilitado (`supabase/config.toml:22`).
- Producción en Supabase usa endpoints HTTPS administrados por plataforma (inferido por URLs `https://...supabase.co`).

### 8.6 Health checks
- `GET /health` en gateway (`supabase/functions/api-minimarket/index.ts:2176`).
- `api-proveedor/health` runtime (`supabase/functions/api-proveedor/schemas.ts:10`).
- `cron-health-monitor` dedicado (`supabase/functions/cron-health-monitor/index.ts:82`).

### 8.7 Monitoreo
- Monitoreo cron interno (`cron-health-monitor`, `cron-dashboard`).
- Sentry frontend condicional por DSN (`minimarket-system/src/main.tsx:10`): si no hay DSN, opera sin envío externo.

### 8.8 Backups BD
- Workflow de backup diario + script `db-backup.sh` (`.github/workflows/backup.yml:4-34`).

### 8.9 Migraciones BD
- Gestionadas con `supabase db push/reset` y carpeta `supabase/migrations` (`migrate.sh:129`, `:255`).

---

## 9. INVENTARIO DE PROBLEMAS DETECTADOS

### 🔴 CRÍTICOS (pueden causar fallos graves en producción)
- `api-proveedor` no valida método HTTP por endpoint (routing por último segmento). Permite invocaciones con verbos no esperados y amplía superficie de abuso.
  - `supabase/functions/api-proveedor/index.ts:70-73`, `:275-277`
  - `supabase/functions/api-proveedor/router.ts:21-31`
- Especificación `api-proveedor` con drift runtime/spec (YAML parseable, contrato no alineado). Bloquea validación confiable de contratos API.
  - `docs/api-proveedor-openapi-3.1.yaml`
  - `supabase/functions/api-proveedor/schemas.ts`

### 🟡 IMPORTANTES (pueden causar problemas bajo ciertas condiciones)
- Drift OpenAPI/runtime en `api-minimarket` (`POST/PUT proveedores`, `POST /compras/recepcion`, compatibilidad `/preparado`).
  - `supabase/functions/api-minimarket/index.ts:848`, `:866`, `:1683`, `:1856`
  - `docs/api-openapi-3.1.yaml:903`
- SQL legacy de cron sin header Authorization (si se usa ese deploy manual, jobs pueden fallar autenticación).
  - `supabase/cron_jobs/deploy_all_cron_jobs.sql:103-106`, `:123-126`, `:143-146`
  - comparación con patrón correcto: `supabase/migrations/20260211062617_cron_jobs_use_vault_secret.sql:23-26`, `:41-44`, `:59-62`
- Riesgo N+1/latencia en alertas y notificaciones.
  - `supabase/functions/alertas-stock/index.ts:53-99`
  - `supabase/functions/notificaciones-tareas/index.ts:110-127`
- [RESUELTO en commit `d8d829d`] ~~Mismatch ACL frontend: existe ruta/nav `/ventas` pero falta en `ROUTE_CONFIG`.~~ Ruta `/ventas` agregada a `ROUTE_CONFIG` con `['admin', 'ventas']` y tests actualizados.
  - `minimarket-system/src/lib/roles.ts:36`
- Vulnerabilidades de dependencias (1 HIGH root + 1 HIGH frontend + 1 MODERATE frontend).
  - `/tmp/npm-audit-root.json`
  - `/tmp/pnpm-audit-frontend.json`
- Quality gates de integración no ejecutables sin `.env.test`.
  - `scripts/run-integration-tests.sh:26-45`
  - `test-reports/quality-gates_20260217-032720.log:463-470`

### 🟢 MENORES (mejoras recomendadas)
- No se encontraron headers de seguridad explícitos (`CSP`, `HSTS`, etc.).
- Formateador dedicado (Prettier/equivalente) no encontrado.
- Endpoints de health públicos sin hardening adicional de exposición.
- `api-proveedor` `RATE_LIMITERS` map sin política de evicción explícita.
  - `supabase/functions/api-proveedor/index.ts:59`, `:62-67`

### ⚪ OBSERVACIONES GENERALES
- El proyecto tiene buena base técnica: RLS, idempotencia en flujos críticos, circuit breaker y rate limiting.
- Hay fuerte madurez documental, pero con desincronización puntual entre docs OpenAPI y runtime.
- La mayor parte del riesgo actual es de consistencia operativa y hardening final pre-go-live.
- [HISTORICO SUPERADO] La alerta anterior de `reportes-automaticos` por columnas `fecha/tipo` no aplica al codigo vigente (`fecha_movimiento/tipo_movimiento`).

---

## 10. RESUMEN EJECUTIVO

- **Estado general de preparación para producción:** `7.5/10` (ajustado de `6.5/10` tras fixes en commit `d8d829d`: reportes-automaticos, /ventas ACL, OpenAPI YAML, y correccion de hallazgo incorrecto alertas-vencimientos)
- **Top 5 riesgos principales (vigentes):**
  1. API proveedor acepta métodos HTTP no restringidos.
  2. Drift entre especificación y runtime en endpoints críticos del proveedor.
  3. Quality gates incompletos localmente por falta de `.env.test`.
  4. Vulnerabilidades HIGH/MODERATE en dependencias transitivas.
  5. Drift OpenAPI/runtime en `api-minimarket` (`POST/PUT proveedores`, `POST /compras/recepcion`).
- **Riesgos resueltos desde auditoria original:**
  - ~~Mismatch ACL `/ventas`~~ (commit `d8d829d`)
  - ~~Columnas incorrectas en `reportes-automaticos`~~ (commit `d8d829d`)
  - ~~Error parseo OpenAPI YAML~~ (commit `d8d829d`)
  - ~~Riesgo NaN en alertas-vencimientos~~ (hallazgo incorrecto; `Math.max` lo previene)
- **Top 5 acciones prioritarias antes de producción:**
  1. Enforzar método HTTP por endpoint en `api-proveedor` + tests de rechazo `405`.
  2. Alinear `docs/api-proveedor-openapi-3.1.yaml` con runtime real (`/health`, aliases legacy, metodos).
  3. Configurar `.env.test` y habilitar pipeline integration/e2e real en entorno controlado.
  4. Sincronizar OpenAPI de `api-minimarket` con rutas efectivas (agregar faltantes y remover drift).
  5. Aplicar upgrades de dependencias vulnerables y volver a correr quality gates completos (incluyendo integración).
- **¿Está listo para producción?** `NO` (pero más cerca tras fixes).
  - Condición de salida: resolver críticos restantes y revalidar gates (`unit + integration + security + smoke cron`).

---

## APÉNDICES

### Apéndice A - Árbol completo versionado (`git ls-files`, 606 archivos)

```text
.agent/PROTOCOL_ZERO_KERNEL.md
.agent/scripts/baseline_capture.sh
.agent/scripts/bootstrap.sh
.agent/scripts/dependabot_autopilot.sh
.agent/scripts/env_audit.py
.agent/scripts/extract_reports.py
.agent/scripts/generate_agents_yaml.py
.agent/scripts/install_curated_skills.py
.agent/scripts/kickoff.sh
.agent/scripts/lint_skills.py
.agent/scripts/mega_plan_template.py
.agent/scripts/p0.sh
.agent/scripts/quality_gates.sh
.agent/scripts/session_end.sh
.agent/scripts/session_start.sh
.agent/scripts/skill_orchestrator.py
.agent/scripts/sync_codex_skills.py
.agent/scripts/verify_endpoint.js
.agent/sessions/.gitignore
.agent/sessions/current/.gitkeep
.agent/sessions/current/BRIEFING.md
.agent/sessions/current/SESSION_REPORT.md
.agent/skills/APISync/SKILL.md
.agent/skills/APISync/agents/openai.yaml
.agent/skills/BaselineOps/SKILL.md
.agent/skills/BaselineOps/agents/openai.yaml
.agent/skills/CodeCraft/SKILL.md
.agent/skills/CodeCraft/agents/openai.yaml
.agent/skills/CronFixOps/SKILL.md
.agent/skills/CronFixOps/agents/openai.yaml
.agent/skills/DebugHound/SKILL.md
.agent/skills/DebugHound/agents/openai.yaml
.agent/skills/DependabotOps/SKILL.md
.agent/skills/DependabotOps/agents/openai.yaml
.agent/skills/DeployOps/SKILL.md
.agent/skills/DeployOps/agents/openai.yaml
.agent/skills/DocuGuard/SKILL.md
.agent/skills/DocuGuard/agents/openai.yaml
.agent/skills/DocuGuard/references/playbook.md
.agent/skills/EnvAuditOps/SKILL.md
.agent/skills/EnvAuditOps/agents/openai.yaml
.agent/skills/ExtractionOps/SKILL.md
.agent/skills/ExtractionOps/agents/openai.yaml
.agent/skills/MegaPlanner/SKILL.md
.agent/skills/MegaPlanner/agents/openai.yaml
.agent/skills/MigrationOps/SKILL.md
.agent/skills/MigrationOps/agents/openai.yaml
.agent/skills/ORCHESTRATOR.md
.agent/skills/PerformanceWatch/SKILL.md
.agent/skills/PerformanceWatch/agents/openai.yaml
.agent/skills/ProductionGate/SKILL.md
.agent/skills/ProductionGate/agents/openai.yaml
.agent/skills/RealityCheck/SKILL.md
.agent/skills/RealityCheck/agents/openai.yaml
.agent/skills/SecretRotationOps/SKILL.md
.agent/skills/SecretRotationOps/agents/openai.yaml
.agent/skills/SecurityAudit/SKILL.md
.agent/skills/SecurityAudit/agents/openai.yaml
.agent/skills/SendGridOps/SKILL.md
.agent/skills/SendGridOps/agents/openai.yaml
.agent/skills/SentryOps/SKILL.md
.agent/skills/SentryOps/agents/openai.yaml
.agent/skills/SessionOps/SKILL.md
.agent/skills/SessionOps/agents/openai.yaml
.agent/skills/TestMaster/SKILL.md
.agent/skills/TestMaster/agents/openai.yaml
.agent/skills/UXFixOps/SKILL.md
.agent/skills/UXFixOps/agents/openai.yaml
.agent/skills/project_config.yaml
.agent/workflows/ROUTER.md
.agent/workflows/audit-codebase.md
.agent/workflows/code-change.md
.agent/workflows/error-recovery.md
.agent/workflows/feature-development.md
.agent/workflows/full-audit.md
.agent/workflows/pre-release-audit.md
.agent/workflows/production-hardening.md
.agent/workflows/session-end.md
.agent/workflows/session-start.md
.agent/workflows/session-workflow.md
.agent/workflows/test-before-deploy.md
.env.example
.env.test.example
.github/CODEOWNERS
.github/copilot-instructions.md
.github/dependabot.yml
.github/workflows/backup.yml
.github/workflows/ci.yml
.gitignore
.husky/pre-commit
.worktrees/docuguard
.worktrees/main-clean
.worktrees/main-latest
AGENTS.md
CHANGELOG.md
CLAUDE.md
IA_USAGE_GUIDE.md
LICENSE
README.md
SECURITY.md
check_supabase.ts
deno.json
deploy.sh
docs/AGENTS.md
docs/ANALISIS_COMPARATIVO_MODULO_PRECIOS.md
docs/API_README.md
docs/ARCHITECTURE_DOCUMENTATION.md
docs/AUDITORIA_DOCS_VS_REALIDAD_2026-02-09.md
docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md
docs/AUDITORIA_RLS_CHECKLIST.md
docs/AUDIT_SKILLS_REPORT_2026-02-12.md
docs/BACKLOG_PRIORIZADO.md
docs/C0_COMMUNICATION_PLAN_MINIMARKET_TEC.md
docs/C0_RISK_REGISTER_MINIMARKET_TEC.md
docs/C0_STAKEHOLDERS_MINIMARKET_TEC.md
docs/C4_HANDOFF_MINIMARKET_TEC.md
docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md
docs/C4_SLA_SLO_MINIMARKET_TEC.md
docs/CHECKLIST_CIERRE.md
docs/CHECKLIST_PREFLIGHT_PREMORTEM.md
docs/CONSTITUCION_UNIVERSAL_SKILLS_WORKFLOWS_v1.0.0.md
docs/CONTRATOS_FRONTEND_BACKEND.md
docs/CRON_JOBS_COMPLETOS.md
docs/DB_GAPS.md
docs/DECISION_LOG.md
docs/DEPLOYMENT_GUIDE.md
docs/E2E_SETUP.md
docs/ESQUEMA_BASE_DATOS_ACTUAL.md
docs/ESTADO_ACTUAL.md
docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md
docs/IA_USAGE_GUIDE.md
docs/INFORME_CHAT_2026-01-23.md
docs/METRICS.md
docs/OBJETIVOS_Y_KPIS.md
docs/OBTENER_SECRETOS.md
docs/OPERATIONS_RUNBOOK.md
docs/PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md
docs/REALITY_CHECK_UX.md
docs/REPORTE_ANALISIS_PROYECTO.md
docs/ROLLBACK_SQL_TEMPLATE.md
docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md
docs/SECRET_ROTATION_PLAN.md
docs/SECURITY.md
docs/SECURITY_AUDIT_REPORT.md
docs/SECURITY_ENDPOINT_AUDIT.md
docs/SECURITY_RECOMMENDATIONS.md
docs/SENDGRID_VERIFICATION.md
docs/SENTRY_INTEGRATION_PLAN.md
docs/VERIFICACION_AUDITORIA_FORENSE_2026-02-15.md
docs/api-openapi-3.1.yaml
docs/api-proveedor-openapi-3.1.yaml
docs/archive/README.md
docs/archive/ROADMAP.md
docs/archive/ROLLBACK_DRILL_STAGING.md
docs/audit/00_EVIDENCE_REPORT.md
docs/audit/02_GAP_MATRIX.md
docs/audit/EVIDENCIA_SP-A.md
docs/audit/EVIDENCIA_SP-B.md
docs/audit/EVIDENCIA_SP-C.md
docs/audit/EVIDENCIA_SP-D.md
docs/audit/EVIDENCIA_SP-E.md
docs/audit/EVIDENCIA_SP-F.md
docs/audit/EVIDENCIA_SP-OMEGA.md
docs/audit/EXECUTION_LOG_AUDITORIA_2026-02-10.md
docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md
docs/closure/ANTIGRAVITY_PLANNING_RUNBOOK.md
docs/closure/AUDITORIA_DOCUMENTAL_ABSOLUTA_2026-02-13.md
docs/closure/BASELINE_LOG_2026-02-12_161515.md
docs/closure/BASELINE_LOG_2026-02-16_034546.md
docs/closure/BUILD_VERIFICATION.md
docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md
docs/closure/CIERRE_5PASOS_2026-02-12.md
docs/closure/CLAUDE_CODE_CONTEXT_PROMPT_EXECUTOR_AUDITORIA_2026-02-10.md
docs/closure/CONTEXTO_CANONICO_AUDITORIA_2026-02-11.md
docs/closure/CONTEXT_PROMPT_COVERAGE_AND_HARDENING_2026-02-16.md
docs/closure/CONTEXT_PROMPT_EJECUTOR_MEGA_PLAN_2026-02-13.md
docs/closure/CONTINUIDAD_SESIONES.md
docs/closure/DOCUGUARD_SYNC_REPORT_2026-02-10.md
docs/closure/DOCUGUARD_SYNC_REPORT_2026-02-16.md
docs/closure/ENV_AUDIT_2026-02-16_045120.md
docs/closure/EVIDENCIA_CHANNEL_MATRIX_2026-02-16.md
docs/closure/EVIDENCIA_GATE15_2026-02-12.md
docs/closure/EVIDENCIA_GATE16_2026-02-12.md
docs/closure/EVIDENCIA_GATE16_2026-02-14.md
docs/closure/EVIDENCIA_GATE18_2026-02-12.md
docs/closure/EVIDENCIA_GATE3_2026-02-12.md
docs/closure/EVIDENCIA_GATE4_2026-02-12.md
docs/closure/EVIDENCIA_M2_S1_2026-02-13.md
docs/closure/EVIDENCIA_M2_S2_2026-02-13.md
docs/closure/EVIDENCIA_M3_S1_2026-02-13.md
docs/closure/EVIDENCIA_M3_S2_2026-02-13.md
docs/closure/EVIDENCIA_M5_S1_2026-02-13.md
docs/closure/EVIDENCIA_M5_S2_2026-02-13.md
docs/closure/EVIDENCIA_M6_S1_2026-02-13.md
docs/closure/EVIDENCIA_M6_S2_2026-02-13.md
docs/closure/EVIDENCIA_M7_CIERRE_2026-02-13.md
docs/closure/EVIDENCIA_M8_S1_2026-02-13.md
docs/closure/EVIDENCIA_P2_FIXES_2026-02-16_REMOTE.md
docs/closure/EVIDENCIA_PLAN_OPTIMIZACION_PRECIOS_2026-02-13.md
docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-12.log
docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_POST_FIX.md
docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTE_POST_FIX.md
docs/closure/EVIDENCIA_RLS_FINE_2026-02-12.log
docs/closure/EVIDENCIA_RLS_REVALIDACION_2026-02-13.md
docs/closure/EVIDENCIA_RLS_SMOKE_ROLES_2026-02-13.md
docs/closure/EVIDENCIA_SENDGRID_COMET_2026-02-14.md
docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-14.md
docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md
docs/closure/INVENTORY_REPORT_2026-02-12_160305.md
docs/closure/INVENTORY_REPORT_2026-02-16_034609.md
docs/closure/OPEN_ISSUES.md
docs/closure/PROJECT_CLOSURE_REPORT.md
docs/closure/PROMPTS_P0_DESBLOQUEO_GATES_2026-02-11.md
docs/closure/PROMPT_UNICO_EJECUCION_RESTANTE_2026-02-12.md
docs/closure/README_CANONICO.md
docs/closure/RESTOS_CIERRE_2026-02-13.md
docs/closure/SKILLS_SYSTEM_UPGRADE_2026-02-09.md
docs/closure/SKILLS_WORKFLOWS_AUTOMATION_AUDIT_2026-02-11.md
docs/closure/TECHNICAL_ANALYSIS_2026-02-12_160211.md
docs/closure/TECHNICAL_ANALYSIS_2026-02-16_034552.md
docs/closure/VERIFICACION_FINAL_SKILLS_WORKFLOWS_2026-02-11.md
docs/db/README.md
docs/db/README_20260116_stock_aggregations.md
docs/mpc/C0_DISCOVERY.md
docs/mpc/C1_MEGA_PLAN_v1.1.0.md
docs/mpc/C2_SUBPLAN_E1_v1.1.0.md
docs/mpc/C2_SUBPLAN_E2_v1.1.0.md
docs/mpc/C2_SUBPLAN_E3_v1.1.0.md
docs/mpc/C2_SUBPLAN_E4_v1.1.0.md
docs/mpc/C2_SUBPLAN_E5_v1.1.0.md
docs/mpc/C2_SUBPLAN_E6_v1.1.0.md
docs/mpc/C2_SUBPLAN_E7_v1.1.0.md
docs/mpc/C2_SUBPLAN_E8_v1.1.0.md
docs/mpc/C2_SUBPLAN_E9_v1.1.0.md
docs/mpc/C3_EXECUTION_LOG.md
docs/mpc/C4_CLOSURE.md
docs/mpc/MEGA_PLAN_CONSOLIDADO.md
docs/mpc/README.md
docs/postman-collection-proveedor.json
docs/postman-collection.json
migrate.sh
minimarket-system/.env.example
minimarket-system/.gitignore
minimarket-system/.npmrc
minimarket-system/README.md
minimarket-system/components.json
minimarket-system/e2e/README.md
minimarket-system/e2e/app.smoke.spec.ts
minimarket-system/e2e/auth.real.spec.ts
minimarket-system/e2e/helpers/auth.ts
minimarket-system/e2e/pos.e2e.spec.ts
minimarket-system/e2e/tareas.proveedores.spec.ts
minimarket-system/eslint.config.js
minimarket-system/index.html
minimarket-system/package-lock.json
minimarket-system/package.json
minimarket-system/playwright.config.ts
minimarket-system/pnpm-lock.yaml
minimarket-system/postcss.config.js
minimarket-system/src/App.css
minimarket-system/src/App.test.tsx
minimarket-system/src/App.tsx
minimarket-system/src/components/AlertsDrawer.tsx
minimarket-system/src/components/BarcodeScanner.tsx
minimarket-system/src/components/ErrorBoundary.test.tsx
minimarket-system/src/components/ErrorBoundary.tsx
minimarket-system/src/components/ErrorMessage.test.tsx
minimarket-system/src/components/ErrorMessage.tsx
minimarket-system/src/components/GlobalSearch.tsx
minimarket-system/src/components/Layout.test.tsx
minimarket-system/src/components/Layout.tsx
minimarket-system/src/components/Skeleton.tsx
minimarket-system/src/components/errorMessageUtils.ts
minimarket-system/src/contexts/AuthContext.tsx
minimarket-system/src/contexts/auth-context.ts
minimarket-system/src/database.types.ts
minimarket-system/src/hooks/queries/index.ts
minimarket-system/src/hooks/queries/useDashboardStats.test.tsx
minimarket-system/src/hooks/queries/useDashboardStats.ts
minimarket-system/src/hooks/queries/useDeposito.test.tsx
minimarket-system/src/hooks/queries/useDeposito.ts
minimarket-system/src/hooks/queries/useKardex.test.tsx
minimarket-system/src/hooks/queries/useKardex.ts
minimarket-system/src/hooks/queries/usePedidos.test.ts
minimarket-system/src/hooks/queries/usePedidos.ts
minimarket-system/src/hooks/queries/useProductos.test.tsx
minimarket-system/src/hooks/queries/useProductos.ts
minimarket-system/src/hooks/queries/useProveedores.test.tsx
minimarket-system/src/hooks/queries/useProveedores.ts
minimarket-system/src/hooks/queries/useRentabilidad.test.tsx
minimarket-system/src/hooks/queries/useRentabilidad.ts
minimarket-system/src/hooks/queries/useStock.test.tsx
minimarket-system/src/hooks/queries/useStock.ts
minimarket-system/src/hooks/queries/useTareas.test.tsx
minimarket-system/src/hooks/queries/useTareas.ts
minimarket-system/src/hooks/use-mobile.tsx
minimarket-system/src/hooks/useAlertas.ts
minimarket-system/src/hooks/useAuth.ts
minimarket-system/src/hooks/useGlobalSearch.ts
minimarket-system/src/hooks/useScanListener.ts
minimarket-system/src/hooks/useUserRole.ts
minimarket-system/src/hooks/useVerifiedRole.ts
minimarket-system/src/index.css
minimarket-system/src/lib/apiClient.test.ts
minimarket-system/src/lib/apiClient.ts
minimarket-system/src/lib/authEvents.ts
minimarket-system/src/lib/observability.ts
minimarket-system/src/lib/queryClient.ts
minimarket-system/src/lib/roles.test.ts
minimarket-system/src/lib/roles.ts
minimarket-system/src/lib/supabase.ts
minimarket-system/src/main.tsx
minimarket-system/src/mocks/data.ts
minimarket-system/src/mocks/supabaseMock.ts
minimarket-system/src/pages/Clientes.test.tsx
minimarket-system/src/pages/Clientes.tsx
minimarket-system/src/pages/Dashboard.test.tsx
minimarket-system/src/pages/Dashboard.tsx
minimarket-system/src/pages/Deposito.test.tsx
minimarket-system/src/pages/Deposito.tsx
minimarket-system/src/pages/Kardex.test.tsx
minimarket-system/src/pages/Kardex.tsx
minimarket-system/src/pages/Login.test.tsx
minimarket-system/src/pages/Login.tsx
minimarket-system/src/pages/NotFound.tsx
minimarket-system/src/pages/Pedidos.test.tsx
minimarket-system/src/pages/Pedidos.tsx
minimarket-system/src/pages/Pocket.test.tsx
minimarket-system/src/pages/Pocket.tsx
minimarket-system/src/pages/Pos.test.tsx
minimarket-system/src/pages/Pos.tsx
minimarket-system/src/pages/Productos.test.tsx
minimarket-system/src/pages/Productos.tsx
minimarket-system/src/pages/Proveedores.test.tsx
minimarket-system/src/pages/Proveedores.tsx
minimarket-system/src/pages/Rentabilidad.test.tsx
minimarket-system/src/pages/Rentabilidad.tsx
minimarket-system/src/pages/Stock.test.tsx
minimarket-system/src/pages/Stock.tsx
minimarket-system/src/pages/Tareas.optimistic.test.tsx
minimarket-system/src/pages/Tareas.test.tsx
minimarket-system/src/pages/Tareas.tsx
minimarket-system/src/pages/Ventas.test.tsx
minimarket-system/src/pages/Ventas.tsx
minimarket-system/src/setupTests.ts
minimarket-system/src/types/database.ts
minimarket-system/src/utils/currency.ts
minimarket-system/src/vite-env.d.ts
minimarket-system/tailwind.config.js
minimarket-system/tsconfig.app.json
minimarket-system/tsconfig.json
minimarket-system/tsconfig.node.json
minimarket-system/vite.config.ts
minimarket-system/vitest.config.ts
package-lock.json
package.json
scripts/apply-sendgrid-secrets-from-env.sh
scripts/db-backup.sh
scripts/db-restore-drill.sh
scripts/metrics.mjs
scripts/perf-baseline.mjs
scripts/rls_audit.sql
scripts/rls_fine_validation.sql
scripts/run-e2e-tests.sh
scripts/run-integration-tests.sh
scripts/run_security_advisor_check.sh
scripts/security_advisor_check.sql
scripts/security_advisor_fix_rls.sql
scripts/seed-test-product.mjs
scripts/sentry-smoke-event.mjs
scripts/set-supabase-secrets.sh
scripts/smoke-efectividad-tareas.mjs
scripts/smoke-minimarket-features.mjs
scripts/smoke-notifications.mjs
scripts/smoke-reservas.mjs
scripts/supabase-admin-ensure-admin-user.mjs
scripts/supabase-admin-sync-role.mjs
scripts/validate-doc-links.mjs
scripts/validate-paths.sh
scripts/verify-cors.sh
scripts/verify_5steps.sh
setup.sh
supabase/.gitignore
supabase/config.toml
supabase/cron_jobs/IMPLEMENTACION_COMPLETADA.md
supabase/cron_jobs/README.md
supabase/cron_jobs/deploy_all_cron_jobs.sql
supabase/cron_jobs/deploy_master.sh
supabase/cron_jobs/job_2.json
supabase/cron_jobs/job_3.json
supabase/cron_jobs/job_4.json
supabase/cron_jobs/job_daily_price_update.json
supabase/cron_jobs/job_realtime_alerts.json
supabase/cron_jobs/job_weekly_trend_analysis.json
supabase/functions/CRON_AUXILIARES.md
supabase/functions/_shared/audit.ts
supabase/functions/_shared/circuit-breaker.ts
supabase/functions/_shared/cors.ts
supabase/functions/_shared/errors.ts
supabase/functions/_shared/internal-auth.ts
supabase/functions/_shared/logger.ts
supabase/functions/_shared/rate-limit.ts
supabase/functions/_shared/response.ts
supabase/functions/alertas-stock/index.ts
supabase/functions/alertas-vencimientos/index.ts
supabase/functions/api-minimarket/handlers/bitacora.ts
supabase/functions/api-minimarket/handlers/clientes.ts
supabase/functions/api-minimarket/handlers/cuentas_corrientes.ts
supabase/functions/api-minimarket/handlers/insights.ts
supabase/functions/api-minimarket/handlers/ofertas.ts
supabase/functions/api-minimarket/handlers/pedidos.ts
supabase/functions/api-minimarket/handlers/proveedores.ts
supabase/functions/api-minimarket/handlers/reservas.ts
supabase/functions/api-minimarket/handlers/search.ts
supabase/functions/api-minimarket/handlers/utils.ts
supabase/functions/api-minimarket/handlers/ventas.ts
supabase/functions/api-minimarket/helpers/auth.ts
supabase/functions/api-minimarket/helpers/index.ts
supabase/functions/api-minimarket/helpers/pagination.ts
supabase/functions/api-minimarket/helpers/supabase.ts
supabase/functions/api-minimarket/helpers/validation.ts
supabase/functions/api-minimarket/index.ts
supabase/functions/api-minimarket/routers/deposito.ts
supabase/functions/api-minimarket/routers/index.ts
supabase/functions/api-minimarket/routers/productos.ts
supabase/functions/api-minimarket/routers/stock.ts
supabase/functions/api-minimarket/routers/tareas.ts
supabase/functions/api-minimarket/routers/types.ts
supabase/functions/api-proveedor/handlers/alertas.ts
supabase/functions/api-proveedor/handlers/comparacion.ts
supabase/functions/api-proveedor/handlers/configuracion.ts
supabase/functions/api-proveedor/handlers/estadisticas.ts
supabase/functions/api-proveedor/handlers/health.ts
supabase/functions/api-proveedor/handlers/precios.ts
supabase/functions/api-proveedor/handlers/productos.ts
supabase/functions/api-proveedor/handlers/sincronizar.ts
supabase/functions/api-proveedor/handlers/status.ts
supabase/functions/api-proveedor/index.ts
supabase/functions/api-proveedor/router.ts
supabase/functions/api-proveedor/schemas.ts
supabase/functions/api-proveedor/utils/alertas.ts
supabase/functions/api-proveedor/utils/auth.ts
supabase/functions/api-proveedor/utils/cache.ts
supabase/functions/api-proveedor/utils/comparacion.ts
supabase/functions/api-proveedor/utils/config.ts
supabase/functions/api-proveedor/utils/constants.ts
supabase/functions/api-proveedor/utils/estadisticas.ts
supabase/functions/api-proveedor/utils/format.ts
supabase/functions/api-proveedor/utils/health.ts
supabase/functions/api-proveedor/utils/http.ts
supabase/functions/api-proveedor/utils/metrics.ts
supabase/functions/api-proveedor/utils/params.ts
supabase/functions/api-proveedor/validators.ts
supabase/functions/cron-dashboard/index.ts
supabase/functions/cron-health-monitor/index.ts
supabase/functions/cron-jobs-maxiconsumo/config.ts
supabase/functions/cron-jobs-maxiconsumo/execution-log.ts
supabase/functions/cron-jobs-maxiconsumo/index.ts
supabase/functions/cron-jobs-maxiconsumo/jobs/daily-price-update.ts
supabase/functions/cron-jobs-maxiconsumo/jobs/maintenance.ts
supabase/functions/cron-jobs-maxiconsumo/jobs/realtime-alerts.ts
supabase/functions/cron-jobs-maxiconsumo/jobs/weekly-analysis.ts
supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts
supabase/functions/cron-jobs-maxiconsumo/types.ts
supabase/functions/cron-jobs-maxiconsumo/validators.ts
supabase/functions/cron-notifications/index.ts
supabase/functions/cron-testing-suite/index.ts
supabase/functions/deno.json
supabase/functions/import_map.json
supabase/functions/notificaciones-tareas/index.ts
supabase/functions/reportes-automaticos/index.ts
supabase/functions/reposicion-sugerida/index.ts
supabase/functions/scraper-maxiconsumo/alertas.ts
supabase/functions/scraper-maxiconsumo/anti-detection.ts
supabase/functions/scraper-maxiconsumo/cache.ts
supabase/functions/scraper-maxiconsumo/config.ts
supabase/functions/scraper-maxiconsumo/index.ts
supabase/functions/scraper-maxiconsumo/matching.ts
supabase/functions/scraper-maxiconsumo/parsing.ts
supabase/functions/scraper-maxiconsumo/scraping.ts
supabase/functions/scraper-maxiconsumo/storage.ts
supabase/functions/scraper-maxiconsumo/types.ts
supabase/functions/scraper-maxiconsumo/utils/cookie-jar.ts
supabase/migrations/20250101000000_version_sp_aplicar_precio.sql
supabase/migrations/20251103_create_cache_proveedor.sql
supabase/migrations/20260104020000_create_missing_objects.sql
supabase/migrations/20260104083000_add_rls_policies.sql
supabase/migrations/20260109060000_create_precios_proveedor.sql
supabase/migrations/20260109070000_create_core_tables.sql
supabase/migrations/20260109090000_update_sp_movimiento_inventario.sql
supabase/migrations/20260110000000_fix_constraints_and_indexes.sql
supabase/migrations/20260110100000_fix_rls_security_definer.sql
supabase/migrations/20260116000000_create_stock_aggregations.sql
supabase/migrations/20260131000000_rls_role_based_policies_v2.sql
supabase/migrations/20260131020000_security_advisor_mitigations.sql
supabase/migrations/20260131034034_remote_history_placeholder.sql
supabase/migrations/20260131034328_remote_history_placeholder.sql
supabase/migrations/20260202000000_version_sp_aplicar_precio.sql
supabase/migrations/20260202083000_security_advisor_followup.sql
supabase/migrations/20260204100000_add_idempotency_stock_reservado.sql
supabase/migrations/20260204110000_add_cron_job_locks.sql
supabase/migrations/20260204120000_add_sp_reservar_stock.sql
supabase/migrations/20260206000000_create_clientes.sql
supabase/migrations/20260206010000_create_pedidos.sql
supabase/migrations/20260206020000_create_detalle_pedidos.sql
supabase/migrations/20260206030000_harden_pedidos_security_definer_search_path.sql
supabase/migrations/20260206235900_create_stock_materialized_views_for_alertas.sql
supabase/migrations/20260207000000_create_vistas_arbitraje.sql
supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql
supabase/migrations/20260207020000_create_ofertas_stock.sql
supabase/migrations/20260207030000_create_bitacora_turnos.sql
supabase/migrations/20260208000000_extend_vista_cc_saldos_por_cliente.sql
supabase/migrations/20260208010000_add_refresh_stock_views_rpc_and_cron.sql
supabase/migrations/20260208020000_add_rate_limit_state.sql
supabase/migrations/20260208030000_add_circuit_breaker_state.sql
supabase/migrations/20260209000000_fix_sp_reservar_stock_on_conflict.sql
supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql
supabase/migrations/20260211062617_cron_jobs_use_vault_secret.sql
supabase/migrations/20260211100000_audit_rls_new_tables.sql
supabase/migrations/20260212100000_pricing_module_integrity.sql
supabase/migrations/20260212130000_rls_fine_validation_lockdown.sql
supabase/migrations/20260213030000_drop_legacy_columns_precios_historicos.sql
supabase/migrations/20260215100000_p0_rls_internal_tables_and_search_path.sql
supabase/migrations/20260216040000_rls_precios_proveedor.sql
test.sh
test_output.txt
tests/README.md
tests/api-contracts/README.md
tests/api-contracts/openapi-compliance.vitest.test.ts
tests/contract/api-scraper.integration.test.ts
tests/contract/database.integration.test.ts
tests/contract/msw-integration.test.ts
tests/e2e/api-proveedor.smoke.test.ts
tests/factories/index.ts
tests/helpers/index.ts
tests/mocks/MockAuthProvider.tsx
tests/mocks/handlers.ts
tests/mocks/server.ts
tests/package.json
tests/performance/README.md
tests/performance/load-testing.vitest.test.ts
tests/security/README.md
tests/security/security.vitest.test.ts
tests/setup.ts
tests/unit/api-bitacora.test.ts
tests/unit/api-ofertas.test.ts
tests/unit/api-proveedor-auth-coverage.test.ts
tests/unit/api-proveedor-auth.test.ts
tests/unit/api-proveedor-health.test.ts
tests/unit/api-proveedor-read-mode.test.ts
tests/unit/api-proveedor-routing.test.ts
tests/unit/api-reservas-concurrencia.test.ts
tests/unit/api-reservas-integration.test.ts
tests/unit/api-ventas-pos.test.ts
tests/unit/auth-fetchuser.test.ts
tests/unit/auth-resilient.test.ts
tests/unit/boundary-edge-cases.test.ts
tests/unit/cb-rpc-coverage.test.ts
tests/unit/circuit-breaker-shared.test.ts
tests/unit/cron-health-monitor.test.ts
tests/unit/cron-jobs-execution-log.test.ts
tests/unit/cron-jobs-handlers.test.ts
tests/unit/cron-jobs-locking.test.ts
tests/unit/cron-jobs.test.ts
tests/unit/cron-notifications.test.ts
tests/unit/cron-validators.test.ts
tests/unit/currency-utils.test.ts
tests/unit/errors-coverage.test.ts
tests/unit/frontend-hooks.test.ts
tests/unit/frontend-utils.test.ts
tests/unit/gateway-auth.test.ts
tests/unit/gateway-pagination.test.ts
tests/unit/gateway-validation.test.ts
tests/unit/handlers-ofertas-coverage.test.ts
tests/unit/handlers-ventas-coverage.test.ts
tests/unit/helpers-supabase.test.ts
tests/unit/integration-contracts.test.ts
tests/unit/pedidos-handlers.test.ts
tests/unit/rate-limit-coverage.test.ts
tests/unit/rate-limit-shared.test.ts
tests/unit/resilience-gaps.test.ts
tests/unit/scraper-alertas.test.ts
tests/unit/scraper-anti-detection-coverage.test.ts
tests/unit/scraper-anti-detection.test.ts
tests/unit/scraper-cache.test.ts
tests/unit/scraper-config.test.ts
tests/unit/scraper-cookie-jar.test.ts
tests/unit/scraper-matching.test.ts
tests/unit/scraper-parsing-edge-cases.test.ts
tests/unit/scraper-parsing.test.ts
tests/unit/scraper-storage-auth.test.ts
tests/unit/scraper-storage-coverage.test.ts
tests/unit/scraper-types-coverage.test.ts
tests/unit/security-gaps.test.ts
tests/unit/shared-audit.test.ts
tests/unit/shared-circuit-breaker.test.ts
tests/unit/shared-cors.test.ts
tests/unit/shared-errors.test.ts
tests/unit/shared-logger.test.ts
tests/unit/shared-rate-limit.test.ts
tests/unit/shared-response.test.ts
tests/unit/strategic-high-value.test.ts
vitest.auxiliary.config.ts
vitest.config.ts
vitest.e2e.config.ts
vitest.integration.config.ts
```

### Apéndice B - Endpoints API minimarket (52 operaciones normalizadas, criterio historico)

| Método | Ruta | Parámetros esperados | Qué hace |
|---|---|---|---|
| GET | `/bitacora` | query:limit(opt); query:offset(opt) | Listar notas de bitácora |
| POST | `/bitacora` | body:application/json | Crear nota de turno (bitácora) |
| GET | `/categorias` | - | Listar todas las categorías |
| GET | `/categorias/{id}` | path:id(req) | Obtener detalle de categoría |
| GET | `/clientes` | query:q(opt); query:limit(opt); query:offset(opt) | Listar clientes (incluye saldo de cuenta corriente) |
| POST | `/clientes` | body:application/json | Crear cliente |
| PUT | `/clientes/{id}` | path:id(req); body:application/json | Actualizar cliente |
| POST | `/cuentas-corrientes/pagos` | body:application/json | Registrar pago de cuenta corriente |
| GET | `/cuentas-corrientes/resumen` | - | Resumen de cuenta corriente ("dinero en la calle") |
| GET | `/cuentas-corrientes/saldos` | query:q(opt); query:solo_deuda(opt); query:limit(opt); query:offset(opt) | Saldos por cliente (cuenta corriente) |
| POST | `/deposito/ingreso` | body:producto_id(req),cantidad(req),proveedor_id(opt),precio_compra(opt) | Ingreso de mercadería al depósito |
| POST | `/deposito/movimiento` | body:producto_id(opt),tipo(opt),tipo_movimiento(opt),cantidad(opt),origen(opt),destino(opt),motivo(opt),proveedor_id(opt),observaciones(opt) | Registrar movimiento de inventario |
| GET | `/deposito/movimientos` | query:producto_id(opt); query:tipo_movimiento(opt); query:limit(opt) | Historial de movimientos de depósito |
| GET | `/health` | - | Health check del gateway |
| GET | `/insights/arbitraje` | - | Insights de arbitraje (riesgo de pérdida / margen bajo) |
| GET | `/insights/compras` | - | Insights de compras (stock bajo + caída de costo) |
| GET | `/insights/producto/{id}` | path:id(req) | Insight unificado de arbitraje por producto |
| POST | `/ofertas/aplicar` | body:application/json | Aplicar oferta por stock_id |
| GET | `/ofertas/sugeridas` | - | Ofertas sugeridas (<= 7 días) |
| POST | `/ofertas/{id}/desactivar` | path:id(req) | Desactivar oferta por id |
| GET | `/pedidos` | query:estado(opt); query:estado_pago(opt); query:fecha_desde(opt); query:fecha_hasta(opt); query:limit(opt); query:offset(opt) | Listar pedidos con filtros opcionales |
| POST | `/pedidos` | body:application/json | Crear un nuevo pedido |
| PUT | `/pedidos/items/{id}` | path:id(req); body:preparado(req) | Marcar item como preparado/no preparado |
| GET | `/pedidos/{id}` | path:id(req) | Obtener detalle de un pedido |
| PUT | `/pedidos/{id}/estado` | path:id(req); body:estado(req) | Actualizar estado del pedido |
| PUT | `/pedidos/{id}/pago` | path:id(req); body:monto_pagado(req) | Registrar pago del pedido |
| POST | `/precios/aplicar` | body:producto_id(req),precio_compra(req),margen_ganancia(opt) | Aplicar precio a producto con redondeo automático |
| GET | `/precios/margen-sugerido/{id}` | path:id(req) | Calcular margen sugerido para producto |
| GET | `/precios/producto/{id}` | path:id(req) | Historial de precios de un producto |
| POST | `/precios/redondear` | body:precio(req) | Redondear un precio (función de utilidad) |
| GET | `/productos` | query:categoria(opt); query:marca(opt); query:activo(opt); query:search(opt) | Listar productos con filtros opcionales |
| POST | `/productos` | body:sku(opt),nombre(req),categoria_id(opt),marca(opt),contenido_neto(opt) | Crear nuevo producto |
| GET | `/productos/dropdown` | - | Lista mínima de productos para selectores |
| DELETE | `/productos/{id}` | path:id(req) | Eliminar producto (soft delete) |
| GET | `/productos/{id}` | path:id(req) | Obtener detalle de producto |
| PUT | `/productos/{id}` | path:id(req); body:application/json | Actualizar producto |
| GET | `/proveedores` | - | Listar proveedores activos |
| GET | `/proveedores/dropdown` | - | Lista mínima de proveedores para selectores |
| GET | `/proveedores/{id}` | path:id(req) | Obtener detalle de proveedor |
| GET | `/reportes/efectividad-tareas` | query:usuario_id(opt); query:fecha_desde(opt); query:fecha_hasta(opt) | Reporte de efectividad de tareas por usuario |
| POST | `/reservas` | header:Idempotency-Key(req); body:producto_id(req),cantidad(req),referencia(opt),deposito(opt) | Crear reserva de stock |
| POST | `/reservas/{id}/cancelar` | path:id(req) | Cancelar una reserva |
| GET | `/search` | query:q(req); query:limit(opt) | Búsqueda global (productos, proveedores, tareas, pedidos, clientes) |
| GET | `/stock` | - | Consultar stock general de todos los productos |
| GET | `/stock/minimo` | - | Productos con stock bajo mínimo |
| GET | `/stock/producto/{id}` | path:id(req) | Stock específico de un producto |
| POST | `/tareas` | body:titulo(req),descripcion(opt),prioridad(opt),asignado_a(opt),fecha_limite(opt) | Crear nueva tarea |
| PUT | `/tareas/{id}/cancelar` | path:id(req) | Cancelar tarea |
| PUT | `/tareas/{id}/completar` | path:id(req) | Marcar tarea como completada |
| GET | `/ventas` | query:limit(opt); query:offset(opt) | Listar ventas |
| POST | `/ventas` | header:Idempotency-Key(req); body:application/json | Crear venta POS (idempotente) |
| GET | `/ventas/{id}` | path:id(req) | Obtener detalle de venta |
### Apéndice C - Endpoints API proveedor (runtime, 9 endpoints)

| Método real en runtime | Ruta resuelta por segmento final | Parámetros esperados | Qué hace |
|---|---|---|---|
| `ANY` (no se valida método) | `/precios` | query: `categoria`(opt), `limit`(opt, 1..500), `offset`(opt, >=0), `activo`(opt `true/false`) | Lista precios actuales del proveedor con paginación y estadísticas. |
| `ANY` | `/productos` | query: `busqueda`(opt), `categoria`(opt), `marca`(opt), `limit`(opt, 1..1000), `solo_con_stock`(opt bool), `ordenar_por`(opt) | Lista productos proveedor con filtros/facetas. |
| `ANY` | `/comparacion` | query: `solo_oportunidades`(opt bool), `min_diferencia`(opt >=0), `limit`(opt, 1..500), `orden`(opt), `incluir_analisis`(opt bool) | Compara precios proveedor vs sistema y calcula oportunidades. |
| `ANY` | `/sincronizar` | query: `categoria`(opt), `force_full`(opt bool), `priority`(opt) | Dispara scraping y comparación manual del proveedor. |
| `ANY` | `/status` | sin params relevantes | Estado operativo y métricas internas del módulo proveedor. |
| `ANY` | `/alertas` | query: `severidad`(opt), `tipo`(opt), `limit`(opt, 1..100), `solo_no_procesadas`(opt bool), `incluir_analisis`(opt bool) | Alertas de cambios y análisis de riesgo. |
| `ANY` | `/estadisticas` | query: `dias`(opt, 1..90), `categoria`(opt), `granularidad`(opt), `incluir_predicciones`(opt bool) | Métricas temporales y KPIs de scraping. |
| `ANY` | `/configuracion` | sin params relevantes | Configuración proveedor + análisis de salud/config score. |
| `ANY` | `/health` | sin params relevantes | Health check extendido (DB, scraper, cache, deps externas). |

### Apéndice D - Tablas DB (38)

| Tabla | Columnas (estructura) | Fuente |
|---|---|---|
| `alertas_cambios_precios` | id, producto_id, nombre_producto, tipo_cambio, valor_anterior, valor_nuevo, porcentaje_cambio, severidad, mensaje, accion_recomendada, fecha_alerta, procesada, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:64` |
| `categorias` | id, codigo, nombre, descripcion, parent_id, nivel, margen_minimo, margen_maximo, activo, created_at, updated_at | `supabase/migrations/20260109070000_create_core_tables.sql:4` |
| `circuit_breaker_state` | breaker_key, state, failure_count, success_count, opened_at, last_failure_at, updated_at | `supabase/migrations/20260208030000_add_circuit_breaker_state.sql:7` |
| `comparacion_precios` | id, producto_id, nombre_producto, precio_actual, precio_proveedor, diferencia_absoluta, diferencia_porcentual, fuente, fecha_comparacion, es_oportunidad_ahorro, recomendacion, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:42` |
| `configuracion_proveedor` | id, nombre, frecuencia_scraping, umbral_cambio_precio, proxima_sincronizacion, ultima_sincronizacion, configuraciones, activo, created_at, updated_at | `supabase/migrations/20260104020000_create_missing_objects.sql:7` |
| `cron_jobs_alerts` | id, job_id, execution_id, tipo_alerta, severidad, titulo, descripcion, accion_recomendada, canales_notificacion, fecha_envio, estado_alerta, fecha_resolucion, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:218` |
| `cron_jobs_config` | id, job_id, cron_expression, edge_function_name, cron_job_name, descripcion, parametros, is_active, created_at, updated_at | `supabase/migrations/20260104020000_create_missing_objects.sql:307` |
| `cron_jobs_execution_log` | id, job_id, execution_id, start_time, end_time, duracion_ms, estado, request_id, parametros_ejecucion, resultado, error_message, memory_usage_start, productos_procesados, productos_exitosos, productos_fallidos, alertas_generadas, emails_enviados, sms_enviad... | `supabase/migrations/20260104020000_create_missing_objects.sql:191` |
| `cron_jobs_health_checks` | id, job_id, status, response_time_ms, last_success, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:292` |
| `cron_jobs_metrics` | id, job_id, fecha_metricas, ejecuciones_totales, disponibilidad_porcentual, tiempo_promedio_ms, alertas_generadas_total, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:259` |
| `cron_jobs_monitoring_history` | id, timestamp, uptime_percentage, response_time_ms, memory_usage_percent, active_jobs_count, success_rate, alerts_generated, health_score, details, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:275` |
| `cron_jobs_notification_preferences` | id, user_id, channel_id, enabled, preferences, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:323` |
| `cron_jobs_notifications` | id, template_id, channel_id, priority, source, recipients, data, status, message_id, error_message, sent_at, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:241` |
| `cron_jobs_tracking` | id, job_id, nombre_job, descripcion, activo, estado_job, ultima_ejecucion, proxima_ejecucion, duracion_ejecucion_ms, intentos_ejecucion, resultado_ultima_ejecucion, error_ultima_ejecucion, circuit_breaker_state, created_at, updated_at | `supabase/migrations/20260104020000_create_missing_objects.sql:168` |
| `estadisticas_scraping` | id, fuente, categoria, granularidad, productos_totales, productos_actualizados, productos_nuevos, productos_fallidos, comparaciones_realizadas, duracion_ms, errores, detalle, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:23` |
| `movimientos_deposito` | id, producto_id, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, motivo, usuario_id, proveedor_id, observaciones, fecha_movimiento, created_at | `supabase/migrations/20260109070000_create_core_tables.sql:120` |
| `notificaciones_tareas` | id, tarea_id, tipo, mensaje, usuario_destino_id, usuario_destino_nombre, fecha_envio, leido, created_at, updated_at | `supabase/migrations/20260109070000_create_core_tables.sql:218` |
| `ordenes_compra` | id, producto_id, proveedor_id, cantidad, cantidad_recibida, estado, fecha_creacion, fecha_estimada, created_at, updated_at | `supabase/migrations/20260104020000_create_missing_objects.sql:105` |
| `personal` | id, user_auth_id, nombre, email, telefono, rol, departamento, activo, fecha_ingreso, direccion, created_at, updated_at | `supabase/migrations/20260109070000_create_core_tables.sql:242` |
| `precios_historicos` | id, producto_id, precio_anterior, precio_nuevo, fecha_cambio, motivo_cambio, usuario_id, precio, fuente, fecha, cambio_porcentaje, created_at | `supabase/migrations/20260109070000_create_core_tables.sql:154` |
| `precios_proveedor` | id, sku, nombre, marca, categoria, precio_unitario, precio_promocional, precio_actual, precio_anterior, stock_disponible, stock_nivel_minimo, codigo_barras, url_producto, imagen_url, descripcion, hash_contenido, score_confiabilidad, ultima_actualizacion, fu... | `supabase/migrations/20260109060000_create_precios_proveedor.sql:1` |
| `productos` | id, nombre, descripcion, categoria, categoria_id, marca, contenido_neto, dimensiones, codigo_barras, sku, precio_actual, precio_costo, precio_sugerido, margen_ganancia, proveedor_principal_id, observaciones, activo, created_by, updated_by, created_at, updat... | `supabase/migrations/20260109070000_create_core_tables.sql:51` |
| `productos_faltantes` | id, producto_id, producto_nombre, fecha_reporte, reportado_por_id, reportado_por_nombre, proveedor_asignado_id, resuelto, fecha_resolucion, observaciones, cantidad_faltante, prioridad, estado, fecha_deteccion, cantidad_pedida, precio_estimado, created_at, u... | `supabase/migrations/20260109070000_create_core_tables.sql:180` |
| `proveedores` | id, nombre, contacto, email, telefono, productos_ofrecidos, direccion, cuit, sitio_web, activo, created_at, updated_at | `supabase/migrations/20260109070000_create_core_tables.sql:31` |
| `public.bitacora_turnos` | id, usuario_id, usuario_nombre, usuario_email, usuario_rol, nota, created_at | `supabase/migrations/20260207030000_create_bitacora_turnos.sql:14` |
| `public.cache_proveedor` | endpoint, payload, updated_at, ttl_seconds | `supabase/migrations/20251103_create_cache_proveedor.sql:1` |
| `public.clientes` | id, nombre, telefono, email, direccion_default, edificio, piso, departamento, observaciones, activo, created_at, updated_at | `supabase/migrations/20260206000000_create_clientes.sql:8` |
| `public.cron_jobs_locks` | job_id, locked_until, locked_by, updated_at | `supabase/migrations/20260204110000_add_cron_job_locks.sql:3` |
| `public.cuentas_corrientes_movimientos` | id, cliente_id, venta_id, usuario_id, tipo, monto, descripcion, created_at | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:139` |
| `public.detalle_pedidos` | id, pedido_id, producto_id, producto_nombre, producto_sku, cantidad, precio_unitario, subtotal, preparado, fecha_preparado, preparado_por_id, observaciones, created_at | `supabase/migrations/20260206020000_create_detalle_pedidos.sql:8` |
| `public.ofertas_stock` | id, stock_id, descuento_pct, precio_oferta, activa, created_by, created_at, updated_at, deactivated_by, deactivated_at | `supabase/migrations/20260207020000_create_ofertas_stock.sql:18` |
| `public.pedidos` | id, numero_pedido, cliente_id, cliente_nombre, cliente_telefono, tipo_entrega, direccion_entrega, edificio, piso, departamento, horario_entrega_preferido, estado, estado_pago, monto_total, monto_pagado, observaciones, observaciones_internas, audio_url, tran... | `supabase/migrations/20260206010000_create_pedidos.sql:8` |
| `public.venta_items` | id, venta_id, producto_id, producto_nombre_snapshot, producto_sku_snapshot, cantidad, precio_unitario, subtotal, created_at | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:116` |
| `public.ventas` | id, idempotency_key, usuario_id, cliente_id, metodo_pago, monto_total, created_at, updated_at | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:89` |
| `rate_limit_state` | key, count, window_start, updated_at | `supabase/migrations/20260208020000_add_rate_limit_state.sql:7` |
| `stock_deposito` | id, producto_id, cantidad_actual, stock_minimo, stock_maximo, ubicacion, lote, fecha_vencimiento, created_at, updated_at | `supabase/migrations/20260109070000_create_core_tables.sql:96` |
| `stock_reservado` | id, producto_id, cantidad, estado, referencia, usuario, fecha_reserva, fecha_cancelacion, created_at | `supabase/migrations/20260104020000_create_missing_objects.sql:90` |
| `tareas_pendientes` | id, titulo, descripcion, tipo, prioridad, estado, datos, asignado_a_id, asignada_a_id, asignada_a_nombre, creada_por_id, creada_por_nombre, fecha_creacion, fecha_vencimiento, fecha_completado, fecha_completada, completado_por_id, completada_por_id, completa... | `supabase/migrations/20260104020000_create_missing_objects.sql:124` |
### Apéndice E - Relaciones DB

| Relación | Fuente |
|---|---|
| `categorias.parent_id -> categorias.id` | `supabase/migrations/20260109070000_create_core_tables.sql:20` |
| `productos.categoria_id -> categorias.id` | `supabase/migrations/20260109070000_create_core_tables.sql:77` |
| `productos.proveedor_principal_id -> proveedores.id` | `supabase/migrations/20260109070000_create_core_tables.sql:83` |
| `stock_deposito.producto_id -> productos.id` | `supabase/migrations/20260109070000_create_core_tables.sql:111` |
| `movimientos_deposito.producto_id -> productos.id` | `supabase/migrations/20260109070000_create_core_tables.sql:137` |
| `movimientos_deposito.proveedor_id -> proveedores.id` | `supabase/migrations/20260109070000_create_core_tables.sql:143` |
| `precios_historicos.producto_id -> productos.id` | `supabase/migrations/20260109070000_create_core_tables.sql:171` |
| `productos_faltantes.producto_id -> productos.id` | `supabase/migrations/20260109070000_create_core_tables.sql:203` |
| `productos_faltantes.proveedor_asignado_id -> proveedores.id` | `supabase/migrations/20260109070000_create_core_tables.sql:209` |
| `notificaciones_tareas.tarea_id -> tareas_pendientes.id` | `supabase/migrations/20260109070000_create_core_tables.sql:233` |
| `ordenes_compra.producto_id -> productos.id` | `supabase/migrations/20260110000000_fix_constraints_and_indexes.sql:38` |
| `ordenes_compra.proveedor_id -> proveedores.id` | `supabase/migrations/20260110000000_fix_constraints_and_indexes.sql:58` |
| `stock_reservado.producto_id -> productos.id` | `supabase/migrations/20260110000000_fix_constraints_and_indexes.sql:18` |
| `pedidos.cliente_id -> clientes.id` | `supabase/migrations/20260206010000_create_pedidos.sql:15` |
| `detalle_pedidos.pedido_id -> pedidos.id` | `supabase/migrations/20260206020000_create_detalle_pedidos.sql:12` |
| `detalle_pedidos.producto_id -> productos.id` | `supabase/migrations/20260206020000_create_detalle_pedidos.sql:15` |
| `ventas.cliente_id -> clientes.id` | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:93` |
| `venta_items.venta_id -> ventas.id` | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:118` |
| `venta_items.producto_id -> productos.id` | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:119` |
| `cuentas_corrientes_movimientos.cliente_id -> clientes.id` | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:141` |
| `cuentas_corrientes_movimientos.venta_id -> ventas.id` | `supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:142` |
| `ofertas_stock.stock_id -> stock_deposito.id` | `supabase/migrations/20260207020000_create_ofertas_stock.sql:20` |

### Apéndice F - Cron jobs y schedules

| Job | Cron | Acción | Fuente |
|---|---|---|---|
| `notificaciones-tareas_invoke` | `0 */2 * * *` | `CALL notificaciones_tareas_5492c915()` -> Edge Function `notificaciones-tareas` | `supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql:102` |
| `alertas-stock_invoke` | `0 * * * *` | `CALL alertas_stock_38c42a40()` -> Edge Function `alertas-stock` | `supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql:108` |
| `reportes-automaticos_invoke` | `0 8 * * *` | `CALL reportes_automaticos_523bf055()` -> Edge Function `reportes-automaticos` | `supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql:114` |
| `maintenance_cleanup` | `0 4 * * 0` | `CALL maintenance_cleanup_7b3e9d1f()` -> Edge Function `cron-jobs-maxiconsumo` action `maintenance_cleanup` | `supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql:148` |
| `refresh_stock_views_hourly` (opcional) | `0 * * * *` | `SELECT fn_refresh_stock_views()` | `supabase/migrations/20260208010000_add_refresh_stock_views_rpc_and_cron.sql:51` |
| `daily_price_update` (legacy SQL) | `0 2 * * *` | `CALL daily_price_update_9f7c2a8b()` | `supabase/cron_jobs/deploy_all_cron_jobs.sql:34` |
| `weekly_trend_analysis` (legacy SQL) | `0 3 * * 0` | `CALL weekly_trend_analysis_3d8e5f7c()` | `supabase/cron_jobs/deploy_all_cron_jobs.sql:63` |
| `realtime_change_alerts` (legacy SQL) | `*/15 * * * *` | `CALL realtime_change_alerts_5a9b4c2d()` | `supabase/cron_jobs/deploy_all_cron_jobs.sql:93` |

### Apéndice G - Dependencias raíz (completo)

| Grupo | Dependencia | Version |
|---|---|---|
| devDependencies | `@supabase/supabase-js` | `^2.95.3` |
| devDependencies | `@tanstack/react-query` | `^5.90.19` |
| devDependencies | `@testing-library/jest-dom` | `^6.9.1` |
| devDependencies | `@testing-library/react` | `^16.3.2` |
| devDependencies | `@types/react` | `^18.3.12` |
| devDependencies | `@types/react-dom` | `^18.3.1` |
| devDependencies | `@vitest/coverage-v8` | `^4.0.18` |
| devDependencies | `husky` | `^9.1.7` |
| devDependencies | `jsdom` | `^27.4.0` |
| devDependencies | `lint-staged` | `^16.2.7` |
| devDependencies | `lucide-react` | `^0.562.0` |
| devDependencies | `msw` | `^2.12.9` |
| dependencies | `react` | `^18.3.1` |
| dependencies | `react-dom` | `^18.3.1` |
| devDependencies | `react-router-dom` | `^6.30.3` |
| devDependencies | `supabase-mcp` | `^1.5.0` |
| devDependencies | `vitest` | `^4.0.18` |
### Apéndice H - Dependencias frontend (completo)

| Grupo | Dependencia | Version |
|---|---|---|
| devDependencies | `@eslint/js` | `^9.15.0` |
| dependencies | `@hookform/resolvers` | `^3.10.0` |
| devDependencies | `@playwright/test` | `^1.57.0` |
| dependencies | `@radix-ui/react-accordion` | `^1.2.2` |
| dependencies | `@radix-ui/react-alert-dialog` | `^1.1.4` |
| dependencies | `@radix-ui/react-aspect-ratio` | `^1.1.1` |
| dependencies | `@radix-ui/react-avatar` | `^1.1.2` |
| dependencies | `@radix-ui/react-checkbox` | `^1.1.3` |
| dependencies | `@radix-ui/react-collapsible` | `^1.1.2` |
| dependencies | `@radix-ui/react-context-menu` | `^2.2.4` |
| dependencies | `@radix-ui/react-dialog` | `^1.1.4` |
| dependencies | `@radix-ui/react-dropdown-menu` | `^2.1.4` |
| dependencies | `@radix-ui/react-hover-card` | `^1.1.4` |
| dependencies | `@radix-ui/react-label` | `^2.1.1` |
| dependencies | `@radix-ui/react-menubar` | `^1.1.4` |
| dependencies | `@radix-ui/react-navigation-menu` | `^1.2.3` |
| dependencies | `@radix-ui/react-popover` | `^1.1.4` |
| dependencies | `@radix-ui/react-progress` | `^1.1.1` |
| dependencies | `@radix-ui/react-radio-group` | `^1.2.2` |
| dependencies | `@radix-ui/react-scroll-area` | `^1.2.2` |
| dependencies | `@radix-ui/react-select` | `^2.1.4` |
| dependencies | `@radix-ui/react-separator` | `^1.1.1` |
| dependencies | `@radix-ui/react-slider` | `^1.2.2` |
| dependencies | `@radix-ui/react-slot` | `^1.1.1` |
| dependencies | `@radix-ui/react-switch` | `^1.1.2` |
| dependencies | `@radix-ui/react-tabs` | `^1.1.2` |
| dependencies | `@radix-ui/react-toast` | `^1.2.4` |
| dependencies | `@radix-ui/react-toggle` | `^1.1.1` |
| dependencies | `@radix-ui/react-toggle-group` | `^1.1.1` |
| dependencies | `@radix-ui/react-tooltip` | `^1.1.6` |
| dependencies | `@sentry/react` | `^10.38.0` |
| dependencies | `@supabase/supabase-js` | `^2.78.0` |
| dependencies | `@tanstack/react-query` | `^5.90.17` |
| dependencies | `@tanstack/react-query-devtools` | `^5.91.2` |
| devDependencies | `@testing-library/jest-dom` | `^6.9.1` |
| devDependencies | `@testing-library/react` | `^16.3.2` |
| devDependencies | `@testing-library/user-event` | `^14.6.1` |
| devDependencies | `@types/jsbarcode` | `^3.11.4` |
| devDependencies | `@types/node` | `^22.10.7` |
| devDependencies | `@types/react` | `^18.3.12` |
| devDependencies | `@types/react-dom` | `^18.3.1` |
| devDependencies | `@vitejs/plugin-react` | `^4.3.4` |
| dependencies | `@zxing/browser` | `^0.1.5` |
| dependencies | `@zxing/library` | `^0.21.3` |
| devDependencies | `autoprefixer` | `10.4.24` |
| dependencies | `class-variance-authority` | `^0.7.1` |
| dependencies | `clsx` | `^2.1.1` |
| dependencies | `cmdk` | `1.1.1` |
| dependencies | `date-fns` | `^3.0.0` |
| devDependencies | `dotenv` | `^17.2.3` |
| dependencies | `embla-carousel-react` | `^8.5.2` |
| devDependencies | `eslint` | `^9.15.0` |
| devDependencies | `eslint-plugin-react-hooks` | `^5.0.0` |
| devDependencies | `eslint-plugin-react-refresh` | `^0.4.14` |
| devDependencies | `globals` | `^15.12.0` |
| dependencies | `input-otp` | `^1.4.2` |
| dependencies | `jsbarcode` | `^3.12.3` |
| devDependencies | `jsdom` | `^27.4.0` |
| dependencies | `lucide-react` | `^0.364.0` |
| devDependencies | `msw` | `^2.12.7` |
| dependencies | `next-themes` | `^0.4.4` |
| devDependencies | `postcss` | `8.4.49` |
| dependencies | `react` | `^18.3.1` |
| dependencies | `react-day-picker` | `8.10.1` |
| dependencies | `react-dom` | `^18.3.1` |
| dependencies | `react-hook-form` | `^7.54.2` |
| dependencies | `react-resizable-panels` | `^2.1.7` |
| dependencies | `react-router-dom` | `^6` |
| dependencies | `recharts` | `^2.12.4` |
| dependencies | `sonner` | `^1.7.2` |
| dependencies | `tailwind-merge` | `^2.6.0` |
| devDependencies | `tailwindcss` | `v3.4.16` |
| dependencies | `tailwindcss-animate` | `^1.0.7` |
| devDependencies | `typescript` | `~5.9.3` |
| devDependencies | `typescript-eslint` | `^8.15.0` |
| dependencies | `vaul` | `^1.1.2` |
| devDependencies | `vite` | `^6.0.1` |
| dependencies | `vite-plugin-pwa` | `^1.2.0` |
| devDependencies | `vite-plugin-source-identifier` | `1.1.2` |
| devDependencies | `vitest` | `^4.0.17` |
| dependencies | `zod` | `^3.24.1` |

# 🔍 RealityCheck Deep Analysis - Mapeo Completo del Proyecto

**Fecha:** 2026-01-29  
**Scope:** `deep full`  
**Ejecutado por:** AI Agent (DocuGuard audit + verificación en repo local)

---

## ✅ Verificaciones ejecutadas

- Conteo real de Edge Functions, cron jobs y módulos `_shared/`.
- Extracción de endpoints desde `supabase/functions/api-minimarket/index.ts` (incluye rutas dinámicas).
- Revisión de hooks y páginas para identificar fuente de datos (Supabase directo vs Gateway).
- Conteo de tests por carpeta y contratos API.
- Conteo de documentación `.md` en `docs/`.

---

## 📊 Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Edge Functions** | 13 desplegadas (10 auxiliares + 3 core) |
| **Gateway api-minimarket** | 29 endpoints (incluye rutas dinámicas + health) |
| **Cron Jobs** | 5 funciones `cron-*` |
| **Frontend** | 9 páginas + 8 hooks query + 4 hooks auth |
| **Tests Unitarios** | 36 archivos |
| **Documentación** | 56 archivos `.md` en `docs/` |
| **Shared Helpers** | 7 módulos `_shared/` |

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
aidrive_genspark/
├── 📁 supabase/functions/       # BACKEND (Edge Functions)
│   ├── _shared/                 # Módulos compartidos (7)
│   ├── api-minimarket/          # Gateway principal (index 55.6 KB)
│   ├── api-proveedor/           # API secundaria
│   ├── scraper-maxiconsumo/     # Web scraping
│   ├── cron-*/                  # 5 Jobs programados
│   ├── alertas-*                # Alertas
│   ├── notificaciones-tareas/   # Notificaciones
│   ├── reportes-automaticos/    # Reportes
│   └── reposicion-sugerida/     # Sugerencias de compra
│
├── 📁 minimarket-system/src/    # FRONTEND (React)
│   ├── pages/                   # 9 páginas
│   ├── hooks/queries/           # 8 React Query hooks
│   ├── hooks/                   # 4 hooks auth/util
│   ├── components/              # 3 componentes core + utils
│   └── lib/                     # 5 utilidades
│
├── 📁 tests/                    # TESTING
│   ├── unit/                    # 36 archivos
│   ├── integration/             # 3 suites
│   ├── e2e/                     # 3 specs (Playwright)
│   ├── security/                # 2 suites
│   ├── performance/             # 2 suites
│   └── api-contracts/           # 2 contratos
│
└── 📁 docs/                     # DOCUMENTACIÓN (56 archivos .md)
```

---

## 🔵 BACKEND - Edge Functions (13)

### Gateway Principal: `api-minimarket`

| Componente | Archivo | Tamaño | Propósito |
|------------|---------|--------|-----------|
| **Core** | `index.ts` | 55.6 KB | Router principal, todos los endpoints |
| **Auth** | `helpers/auth.ts` | 4.1 KB | JWT validation, roles |
| **Pagination** | `helpers/pagination.ts` | 2.1 KB | Paginación estándar |
| **Validation** | `helpers/validation.ts` | 3.4 KB | Input validation |
| **Supabase** | `helpers/supabase.ts` | 5.2 KB | Client singleton |

#### Mapa de Endpoints (29)

**Utils/Dropdowns**
- GET `/productos/dropdown`
- GET `/proveedores/dropdown`

**Categorías**
- GET `/categorias`
- GET `/categorias/:id`

**Productos**
- GET `/productos`
- GET `/productos/:id`
- POST `/productos`
- PUT `/productos/:id`
- DELETE `/productos/:id`

**Proveedores**
- GET `/proveedores`
- GET `/proveedores/:id`

**Precios**
- POST `/precios/aplicar`
- GET `/precios/producto/:id`
- POST `/precios/redondear`
- GET `/precios/margen-sugerido/:id`

**Stock**
- GET `/stock`
- GET `/stock/minimo`
- GET `/stock/producto/:id`

**Reportes**
- GET `/reportes/efectividad-tareas`

**Tareas**
- POST `/tareas`
- PUT `/tareas/:id/completar`
- PUT `/tareas/:id/cancelar`

**Depósito**
- POST `/deposito/movimiento`
- GET `/deposito/movimientos`
- POST `/deposito/ingreso`

**Reservas**
- POST `/reservas`
- POST `/reservas/:id/cancelar`

**Compras**
- POST `/compras/recepcion`

**Health**
- GET `/health`

> Nota: No hay endpoints `/dashboard`, `/kardex` ni `/rentabilidad` en el gateway; esas vistas consultan Supabase directo.

---

### Gateway Secundaria: `api-proveedor`

| Componente | Cantidad | Propósito |
|------------|----------|-----------|
| **Handlers** | 9 | `alertas`, `comparacion`, `configuracion`, `estadisticas`, `health`, `precios`, `productos`, `sincronizar`, `status` |
| **Utils** | 12 | Auth, cache, health, metrics, params, etc. |
| **Validators** | 1 | `validators.ts` |
| **Schemas** | 1 | `schemas.ts` |
| **Router** | 1 | `router.ts` |

---

### Scraper: `scraper-maxiconsumo`

| Módulo | Archivo | Tamaño | Propósito |
|--------|---------|--------|-----------|
| **Entry** | `index.ts` | 12.9 KB | Orquestación principal |
| **Scraping** | `scraping.ts` | 5.5 KB | Extracción HTTP/DOM |
| **Anti-Detection** | `anti-detection.ts` | 12.7 KB | Evasión de bloqueos |
| **Parsing** | `parsing.ts` | 5.8 KB | Normalización de datos |
| **Matching** | `matching.ts` | 5.3 KB | Match productos |
| **Cache** | `cache.ts` | 4.3 KB | Caché de resultados |
| **Storage** | `storage.ts` | 8.1 KB | Persistencia |
| **Config** | `config.ts` | 5.3 KB | Configuración |
| **Alertas** | `alertas.ts` | 2.0 KB | Notificaciones precio |
| **Tipos** | `types.ts` | 6.2 KB | Tipado común |
| **Utils** | `utils/cookie-jar.ts` | 7.1 KB | Manejo de cookies |

---

### Edge Functions Auxiliares (10 funciones)

| Categoría | Funciones | Propósito |
|-----------|-----------|-----------|
| **Cron Jobs** | `cron-jobs-maxiconsumo`, `cron-dashboard`, `cron-health-monitor`, `cron-notifications`, `cron-testing-suite` | Jobs programados (frecuencia definida en scheduler Supabase) |
| **Alertas** | `alertas-stock`, `alertas-vencimientos` | Alertas de stock y vencimientos |
| **Operativas** | `notificaciones-tareas`, `reportes-automaticos`, `reposicion-sugerida` | Notificaciones y reportes automáticos |

---

### Módulos Compartidos: `_shared/` (7)

| Módulo | Archivo | Tamaño | Propósito |
|--------|---------|--------|-----------|
| **Logger** | `logger.ts` | 1.9 KB | Logging estructurado |
| **Response** | `response.ts` | 4.9 KB | Respuestas HTTP estándar |
| **Errors** | `errors.ts` | 7.6 KB | Manejo de errores |
| **CORS** | `cors.ts` | 3.1 KB | Headers CORS |
| **Rate Limit** | `rate-limit.ts` | 5.1 KB | Limitar requests |
| **Circuit Breaker** | `circuit-breaker.ts` | 2.5 KB | Resiliencia |
| **Audit** | `audit.ts` | 5.4 KB | Auditoría de acciones |

---

## 🟢 FRONTEND - minimarket-system

### Páginas (9)

| Página | Archivo | Tamaño | Hook principal | Acceso a datos |
|--------|---------|--------|---------------|----------------|
| Dashboard | `Dashboard.tsx` | 5.1 KB | `useDashboardStats` | Supabase directo |
| Depósito | `Deposito.tsx` | 10.8 KB | `useDeposito` | Supabase directo + Gateway (mutación) |
| Kardex | `Kardex.tsx` | 7.4 KB | `useKardex` | Supabase directo + Gateway (dropdown) |
| Login | `Login.tsx` | 3.2 KB | `useAuth` | Supabase Auth |
| Productos | `Productos.tsx` | 13.4 KB | `useProductos` | Supabase directo |
| Proveedores | `Proveedores.tsx` | 9.3 KB | `useProveedores` | Supabase directo |
| Rentabilidad | `Rentabilidad.tsx` | 12.1 KB | `useRentabilidad` | Supabase directo + Gateway (dropdown) |
| Stock | `Stock.tsx` | 8.7 KB | `useStock` | Supabase directo |
| Tareas | `Tareas.tsx` | 11.8 KB | `useTareas` | Supabase directo + Gateway (mutaciones) |

---

### React Query Hooks (8) — Fuente de Datos

| Hook | Archivo | Tamaño | Tablas/Queries |
|------|---------|--------|----------------|
| `useDashboardStats` | `useDashboardStats.ts` | 2.7 KB | `tareas_pendientes`, `stock_deposito`, `productos` |
| `useDeposito` | `useDeposito.ts` | 2.7 KB | `stock_deposito` + join `productos`, `movimientos_deposito` |
| `useKardex` | `useKardex.ts` | 2.7 KB | `movimientos_deposito` + join `productos`, `proveedores` |
| `useProductos` | `useProductos.ts` | 5.2 KB | `productos`, `proveedores`, `precios_historicos` |
| `useProveedores` | `useProveedores.ts` | 3.6 KB | `proveedores`, `productos` |
| `useRentabilidad` | `useRentabilidad.ts` | 2.8 KB | `productos` |
| `useStock` | `useStock.ts` | 1.9 KB | `stock_deposito` + join `productos` |
| `useTareas` | `useTareas.ts` | 2.0 KB | `tareas_pendientes` |

---

### Accesos al Gateway desde UI (mutaciones + dropdowns)

| Uso en UI | Endpoint | Página(s) |
|-----------|----------|-----------|
| Dropdown productos | GET `/productos/dropdown` | Depósito, Kardex |
| Dropdown proveedores | GET `/proveedores/dropdown` | Depósito, Rentabilidad |
| Movimiento depósito | POST `/deposito/movimiento` | Depósito |
| Crear tarea | POST `/tareas` | Tareas |
| Completar tarea | PUT `/tareas/:id/completar` | Tareas |
| Cancelar tarea | PUT `/tareas/:id/cancelar` | Tareas |

---

### Hooks de Auth (4)

| Hook | Propósito |
|------|-----------|
| `useAuth` | Estado de autenticación |
| `useUserRole` | Rol del usuario actual |
| `useVerifiedRole` | Rol verificado server-side |
| `use-mobile` | Detección de móvil |

---

### Componentes Core (3)

| Componente | Archivo | Tamaño | Propósito |
|------------|---------|--------|-----------|
| **Layout** | `Layout.tsx` | 5.3 KB | Estructura principal + sidebar |
| **ErrorBoundary** | `ErrorBoundary.tsx` | 4.5 KB | Captura errores React |
| **ErrorMessage** | `ErrorMessage.tsx` | 3.5 KB | Display de errores |

---

### Utilidades `lib/` (5)

| Módulo | Archivo | Tamaño | Propósito |
|--------|---------|--------|-----------|
| **API Client** | `apiClient.ts` | 10.2 KB | Cliente HTTP centralizado |
| **Query Client** | `queryClient.ts` | 2.0 KB | Configuración React Query |
| **Roles** | `roles.ts` | 2.8 KB | Permisos y roles |
| **Supabase** | `supabase.ts` | 0.7 KB | Cliente Supabase |
| **Observability** | `observability.ts` | 2.2 KB | Métricas frontend |

---

## 🧪 TESTING

### Estructura

| Categoría | Archivos | Cobertura/Notas |
|-----------|----------|-----------------|
| **Unit** | 36 | Enfocado en gateway, scraper, shared, cron, frontend |
| **Integration** | 3 | Flujos principales |
| **E2E** | 3 | Playwright |
| **Security** | 2 | RLS, inyección |
| **Performance** | 2 | Load testing |
| **API Contracts** | 2 | Frontend ↔ Backend |

### Tests Unitarios por Módulo (principales)

| Módulo | Tests |
|--------|-------|
| Gateway (`api-minimarket`) | `gateway-auth`, `gateway-pagination`, `gateway-validation`, `api-minimarket-gateway` |
| API Proveedor | `api-proveedor-auth`, `api-proveedor-read-mode`, `api-proveedor-routing` |
| Scraper | `anti-detection`, `cache`, `config`, `matching`, `parsing`, `parsing-edge-cases`, `storage-auth`, `alertas`, `cookie-jar` |
| Shared | `audit`, `circuit-breaker`, `cors`, `errors`, `logger`, `rate-limit`, `response` |
| Cron Jobs | `cron-jobs`, `cron-jobs-handlers`, `cron-jobs-execution-log`, `cron-health-monitor`, `cron-notifications`, `cron-validators` |
| Frontend | `frontend-hooks`, `frontend-utils` |
| Cross-cutting | `boundary-edge-cases`, `security-gaps`, `resilience-gaps`, `strategic-high-value`, `integration-contracts` |

### Cobertura (último reporte local)

- Statements: **68.2%**
- Branches: **60.7%**
- Functions: **70.6%**
- Lines: **n/d** (no reportadas en `coverage-final.json`)

---

## 📚 DOCUMENTACIÓN (56 archivos `.md`)

### Documentos Críticos

| Documento | Tamaño | Propósito |
|-----------|--------|-----------|
| `ARCHITECTURE_DOCUMENTATION.md` | 60.5 KB | Arquitectura completa |
| `ESTADO_ACTUAL.md` | 3.6 KB | Estado del proyecto |
| `CHECKLIST_CIERRE.md` | 17.9 KB | Checklist pre-release |
| `PLAN_PENDIENTES_DEFINITIVO.md` | 13.4 KB | Tareas pendientes |
| `ESQUEMA_BASE_DATOS_ACTUAL.md` | 22.1 KB | Schema DB |
| `IA_USAGE_GUIDE.md` | 24.9 KB | Guía para agentes IA |
| `DECISION_LOG.md` | 11.5 KB | Decisiones vigentes |
| `ROADMAP.md` | 9.9 KB | Plan futuro |

### APIs

| Archivo | Formato |
|---------|---------|
| `api-openapi-3.1.yaml` | OpenAPI 3.1 |
| `api-proveedor-openapi-3.1.yaml` | OpenAPI 3.1 |
| `postman-collection.json` | Postman |
| `postman-collection-proveedor.json` | Postman |

---

## 🔄 FLUJOS DE USUARIO CRÍTICOS

### Flujo 1: Login → Dashboard

```
Usuario → Login.tsx → AuthProvider.signIn()
                          ↓
                    Supabase Auth
                          ↓
                Dashboard.tsx → useDashboardStats
                          ↓
Consultas Supabase: tareas_pendientes, stock_deposito, productos
```

### Flujo 2: Registrar Movimiento Depósito

```
Usuario → Deposito.tsx
   ├─ GET /productos/dropdown (gateway)
   ├─ GET /proveedores/dropdown (gateway)
   └─ POST /deposito/movimiento (gateway)
            ↓
     DB: movimientos_deposito + stock_deposito
            ↓
   invalidate queries → useStock / useKardex / useDeposito (Supabase)
```

### Flujo 3: Scraping de Precios

```
cron-jobs-maxiconsumo (execute)
         ↓
scraper-maxiconsumo/index.ts
         ↓
scraping.ts → parsing.ts → matching.ts
         ↓
storage.ts → DB precios_proveedor (+ relacionados)
         ↓
alertas.ts → notificaciones
```

### Flujo 4: Gestión de Tareas

```
Usuario → Tareas.tsx → useTareas (Supabase)
            ├─ POST /tareas
            ├─ PUT /tareas/:id/completar
            └─ PUT /tareas/:id/cancelar
                  ↓
            DB: tareas_pendientes
                  ↓
            invalidate queries → useTareas
```

---

## 🎯 PROFUNDIZACIONES OPCIONALES

1. **Análisis UX por página** (loading/error/empty states)
2. **Contratos API detallados** (request/response por endpoint)
3. **Gaps funcionales** (flujos incompletos o inconsistentes)
4. **Mega-planificación** (plan modular por subsistema)

---

## 📌 SUBSISTEMAS IDENTIFICADOS

| # | Subsistema | Componentes | Prioridad |
|---|------------|-------------|-----------|
| 1 | **Gateway Principal** | api-minimarket + helpers | 🔴 P0 |
| 2 | **Frontend Core** | 9 páginas + 8 hooks | 🔴 P0 |
| 3 | **Scraper Maxiconsumo** | scraper + anti-detection + matching + storage + cookie-jar | 🟡 P1 |
| 4 | **Sistema de Cron Jobs** | 5 jobs + orchestrator | 🟡 P1 |
| 5 | **API Proveedor** | handlers + validators + schemas | 🟢 P2 |
| 6 | **Alertas y Notificaciones** | alertas-stock, alertas-vencimientos, notificaciones-tareas, reportes-automaticos, reposicion-sugerida | 🟢 P2 |
| 7 | **Shared Infrastructure** | 7 módulos `_shared/` | 🔵 Foundation |

---

*Mapeo verificado en repo local a fecha 2026-01-29. Si cambian rutas/archivos, actualizar este documento.*

# 🔍 RealityCheck Deep Analysis - Mapeo Completo del Proyecto

**Fecha:** 2026-01-29  
**Scope:** `deep full`  
**Ejecutado por:** AI Agent (RealityCheck Skill v3.1)

---

## 📊 Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Edge Functions** | 13 desplegadas |
| **Módulos Frontend** | 9 páginas + 8 hooks |
| **Tests Unitarios** | 36 archivos |
| **Documentación** | 31 archivos MD |
| **Shared Helpers** | 7 módulos |

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
aidrive_genspark/
├── 📁 supabase/functions/       # BACKEND (Edge Functions)
│   ├── _shared/                 # Módulos compartidos (7)
│   ├── api-minimarket/          # Gateway principal (57KB)
│   ├── api-proveedor/           # API secundaria
│   ├── scraper-maxiconsumo/     # Web scraping
│   └── cron-*/                  # 6 Jobs programados
│
├── 📁 minimarket-system/src/    # FRONTEND (React)
│   ├── pages/                   # 9 páginas
│   ├── hooks/queries/           # 8 React Query hooks
│   ├── components/              # 3 componentes core
│   └── lib/                     # 5 utilidades
│
├── 📁 tests/                    # TESTING
│   ├── unit/                    # 36 archivos
│   ├── integration/             # 3 suites
│   ├── e2e/                     # Playwright
│   ├── security/                # 2 suites
│   └── performance/             # 2 suites
│
└── 📁 docs/                     # DOCUMENTACIÓN (31 archivos)
```

---

## 🔵 BACKEND - Edge Functions (13)

### Gateway Principal: `api-minimarket`

| Componente | Archivo | Tamaño | Propósito |
|------------|---------|--------|-----------|
| **Core** | `index.ts` | 57 KB | Router principal, todos los endpoints |
| **Auth** | `helpers/auth.ts` | 4 KB | JWT validation, roles |
| **Pagination** | `helpers/pagination.ts` | 2 KB | Paginación estándar |
| **Validation** | `helpers/validation.ts` | 3 KB | Input validation |
| **Supabase** | `helpers/supabase.ts` | 5 KB | Client singleton |

**Endpoints servidos:**
- `/dashboard/*` - Stats, métricas
- `/productos/*` - CRUD productos
- `/stock/*` - Niveles de inventario
- `/deposito/*` - Movimientos
- `/kardex/*` - Historial
- `/tareas/*` - Gestión de tareas
- `/proveedores/*` - Dropdown y data
- `/rentabilidad/*` - Análisis

---

### Gateway Secundaria: `api-proveedor`

| Componente | Cantidad | Propósito |
|------------|----------|-----------|
| **Handlers** | 9 | Operaciones CRUD |
| **Utils** | 12 | Funciones auxiliares |
| **Validators** | 1 | Validación de schemas |
| **Schemas** | 1 | Zod schemas |

---

### Scraper: `scraper-maxiconsumo`

| Módulo | Archivo | Propósito |
|--------|---------|-----------|
| **Anti-Detection** | `anti-detection.ts` (13KB) | Evasión de bloqueos |
| **Parsing** | `parsing.ts` | Extracción de datos |
| **Matching** | `matching.ts` | Match productos |
| **Cache** | `cache.ts` | Caché de resultados |
| **Storage** | `storage.ts` (8KB) | Persistencia |
| **Config** | `config.ts` | Configuración |
| **Alertas** | `alertas.ts` | Notificaciones precio |

---

### Edge Functions Auxiliares (10 funciones)

| Categoría | Función | Frecuencia | Propósito |
|-----------|---------|------------|----------|
| **Cron Jobs** | `cron-jobs-maxiconsumo` | Programado | Orquestador scraping |
| | `cron-dashboard` | Periódico | Actualiza métricas |
| | `cron-health-monitor` | Cada 5 min | Health checks |
| | `cron-notifications` | Periódico | Envío de alertas |
| | `cron-testing-suite` | On-demand | Suite de tests |
| **Alertas** | `alertas-stock` | Periódico | Stock bajo |
| | `alertas-vencimientos` | Diario | Vencimientos |
| **Otros** | `notificaciones-tareas` | Periódico | Recordatorios |
| | `reportes-automaticos` | Semanal | Reportes |
| | `reposicion-sugerida` | Diario | Sugerencias compra |

---

### Módulos Compartidos: `_shared/` (7)

| Módulo | Archivo | Tamaño | Propósito |
|--------|---------|--------|-----------|
| **Logger** | `logger.ts` | 2 KB | Logging estructurado |
| **Response** | `response.ts` | 5 KB | Respuestas HTTP estándar |
| **Errors** | `errors.ts` | 8 KB | Manejo de errores |
| **CORS** | `cors.ts` | 3 KB | Headers CORS |
| **Rate Limit** | `rate-limit.ts` | 5 KB | Limitar requests |
| **Circuit Breaker** | `circuit-breaker.ts` | 3 KB | Resiliencia |
| **Audit** | `audit.ts` | 5 KB | Auditoría de acciones |

---

## 🟢 FRONTEND - minimarket-system

### Páginas (9)

| Página | Archivo | Tamaño | Hook | Propósito Usuario |
|--------|---------|--------|------|-------------------|
| Dashboard | `Dashboard.tsx` | 5 KB | `useDashboardStats` | Estado general del negocio |
| Depósito | `Deposito.tsx` | 11 KB | `useDeposito` | Entrada/salida de stock |
| Kardex | `Kardex.tsx` | 8 KB | `useKardex` | Historial movimientos |
| Login | `Login.tsx` | 3 KB | - | Autenticación |
| Productos | `Productos.tsx` | 14 KB | `useProductos` | CRUD productos |
| Proveedores | `Proveedores.tsx` | 10 KB | `useProveedores` | Gestión proveedores |
| Rentabilidad | `Rentabilidad.tsx` | 12 KB | `useRentabilidad` | Análisis rentabilidad |
| Stock | `Stock.tsx` | 9 KB | `useStock` | Niveles inventario |
| Tareas | `Tareas.tsx` | 12 KB | `useTareas` | Gestión tareas |

---

### React Query Hooks (8)

| Hook | Archivo | Tamaño | Endpoint |
|------|---------|--------|----------|
| `useDashboardStats` | `useDashboardStats.ts` | 3 KB | `/dashboard/stats` |
| `useDeposito` | `useDeposito.ts` | 3 KB | `/deposito/*` |
| `useKardex` | `useKardex.ts` | 3 KB | `/kardex` |
| `useProductos` | `useProductos.ts` | 5 KB | `/productos/*` |
| `useProveedores` | `useProveedores.ts` | 4 KB | `/proveedores/*` |
| `useRentabilidad` | `useRentabilidad.ts` | 3 KB | `/rentabilidad` |
| `useStock` | `useStock.ts` | 2 KB | `/stock` |
| `useTareas` | `useTareas.ts` | 2 KB | `/tareas/*` |

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

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| **Layout** | `Layout.tsx` (5 KB) | Estructura principal + sidebar |
| **ErrorBoundary** | `ErrorBoundary.tsx` (5 KB) | Captura errores React |
| **ErrorMessage** | `ErrorMessage.tsx` (4 KB) | Display de errores |

---

### Utilidades `lib/` (5)

| Módulo | Archivo | Tamaño | Propósito |
|--------|---------|--------|-----------|
| **API Client** | `apiClient.ts` | 10 KB | Cliente HTTP centralizado |
| **Query Client** | `queryClient.ts` | 2 KB | Configuración React Query |
| **Roles** | `roles.ts` | 3 KB | Permisos y roles |
| **Supabase** | `supabase.ts` | 1 KB | Cliente Supabase |
| **Observability** | `observability.ts` | 2 KB | Métricas frontend |

---

## 🧪 TESTING

### Estructura

| Categoría | Archivos | Cobertura |
|-----------|----------|-----------|
| **Unit** | 36 | ~70% |
| **Integration** | 3 | Flujos principales |
| **E2E** | Playwright | Auth + flujos críticos |
| **Security** | 2 | RLS, injection |
| **Performance** | 2 | Load testing |
| **API Contracts** | 2 | Frontend ↔ Backend |

### Tests Unitarios por Módulo

| Módulo | Tests |
|--------|-------|
| Gateway (`api-minimarket`) | auth, pagination, validation |
| Scraper | anti-detection, cache, config, matching, parsing, storage |
| Shared | audit, circuit-breaker, cors, errors, logger, rate-limit, response |
| Cron Jobs | health-monitor, execution-log, handlers, validators |
| Proveedor | auth, read-mode, routing |

---

## 📚 DOCUMENTACIÓN (31 archivos)

### Documentos Críticos

| Documento | Tamaño | Propósito |
|-----------|--------|-----------|
| `ARCHITECTURE_DOCUMENTATION.md` | 62 KB | Arquitectura completa |
| `ESTADO_ACTUAL.md` | 4 KB | Estado del proyecto |
| `CHECKLIST_CIERRE.md` | 18 KB | Checklist pre-release |
| `PLAN_PENDIENTES_DEFINITIVO.md` | 14 KB | Tareas pendientes |
| `ESQUEMA_BASE_DATOS_ACTUAL.md` | 23 KB | Schema DB |
| `IA_USAGE_GUIDE.md` | 25 KB | Guía para agentes IA |
| `ROADMAP.md` | 10 KB | Plan futuro |

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
Usuario → Login.tsx → Supabase Auth → Dashboard.tsx → useDashboardStats
                                                    ↓
                                       api-minimarket/dashboard/stats
                                                    ↓
                                              PostgreSQL
```

### Flujo 2: Registrar Movimiento Depósito

```
Usuario → Deposito.tsx → useDeposito (mutation)
                              ↓
                    api-minimarket/deposito/movimiento
                              ↓
                   [Validates] → [Updates DB] → [Invalidates cache]
                              ↓
                    Stock + Kardex actualizados
```

### Flujo 3: Scraping de Precios

```
cron-jobs-maxiconsumo/orchestrator
         ↓
scraper-maxiconsumo/index.ts
         ↓
[anti-detection] → [scraping] → [parsing] → [matching]
         ↓
[storage] → DB precios_proveedor
         ↓
[alertas] → Notificación si precio cambió
```

---

## 🎯 PRÓXIMOS PASOS (Para profundizar)

En la próxima interacción, profundizaremos en:

1. **Análisis UX por página** - Estados loading/error de cada una
2. **Contratos API detallados** - Request/response de cada endpoint
3. **Gaps detectados** - Flujos incompletos o problemáticos
4. **Mega-planificación** - Plan modular por subsistema

---

## 📌 SUBSISTEMAS IDENTIFICADOS

| # | Subsistema | Componentes | Prioridad |
|---|------------|-------------|-----------|
| 1 | **Gateway Principal** | api-minimarket + helpers | 🔴 P0 |
| 2 | **Frontend Core** | 9 páginas + 8 hooks | 🔴 P0 |
| 3 | **Scraper Maxiconsumo** | scraper + anti-detection + matching | 🟡 P1 |
| 4 | **Sistema de Cron Jobs** | 6 jobs + orchestrator | 🟡 P1 |
| 5 | **API Proveedor** | handlers + validators | 🟢 P2 |
| 6 | **Alertas y Notificaciones** | 4 funciones | 🟢 P2 |
| 7 | **Shared Infrastructure** | 7 módulos _shared | 🔵 Foundation |

---

*Este mapeo será la base para la mega-planificación modular en la siguiente interacción.*

# 📋 DOCUMENTACIÓN TÉCNICA EXHAUSTIVA - SISTEMA MINI MARKET (VERSIÓN DEFINITIVA)

**Fecha:** 2026-01-15  
**Estado:** Verificado y alineado a repositorio  
**Alcance:** Frontend, Backend (Supabase Edge Functions), Base de Datos, CI/CD, Tests  

> **Nota de verificación:** Este documento fue contrastado con `package.json`, `minimarket-system/package.json`, `supabase/config.toml`, `supabase/functions/**`, `supabase/migrations/**`, `docs/API_README.md`, `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`, `docs/ARCHITECTURE_DOCUMENTATION.md`, `docs/DEPLOYMENT_GUIDE.md`, `.github/workflows/ci.yml` y scripts de automatización (`setup.sh`, `deploy.sh`, `test.sh`). Cuando algo no pudo confirmarse directamente en el código, se indica explícitamente.

---

## 1. INFORMACIÓN GENERAL DEL PROYECTO

### Nombre del proyecto
**Sistema Mini Market** (workspace `aidrive_genspark`, frontend en carpeta `minimarket-system`).

### Tipo de aplicación
**Aplicación web fullstack** con:
- SPA (React + Vite)
- API REST serverless (Supabase Edge Functions)
- Base de datos PostgreSQL (Supabase)
- Scraper automatizado de precios
- Cron jobs y automatizaciones

### Propósito principal (2-3 líneas)
Sistema integral de gestión para mini markets que centraliza productos, stock, proveedores y tareas operativas. Incluye automatizaciones de scraping y alertas para seguimiento de precios y abastecimiento.

### Funcionalidad principal
Administración de inventario y operaciones del mini market con integración a proveedores externos y automatizaciones de monitoreo.

### Funcionalidades/Características identificadas
- **Dashboard de métricas**: KPIs de stock, tareas y productos.
- **Gestión de productos**: CRUD con SKU, categorías, estado activo.
- **Gestión de stock**: stock mínimo/máximo, ubicaciones, lotes, vencimientos.
- **Movimientos de depósito**: entradas/salidas/ajustes con trazabilidad.
- **Gestión de proveedores**: directorio y detalles.
- **Gestión de tareas**: pendientes, prioridades, asignaciones, estados.
- **Notificaciones**: alertas vinculadas a tareas.
- **Scraping de precios**: extracción y actualización de datos de proveedor externo.
- **Matching/Comparación**: comparación entre precios internos y proveedor.
- **Alertas automáticas**: alertas por precio, stock y sistema.
- **Reportes**: métricas de efectividad de tareas.
- **Autenticación**: JWT vía Supabase Auth.
- **Seguridad**: CORS, rate limit, circuit breaker, RLS.

---

## 2. STACK TECNOLÓGICO COMPLETO

### Lenguajes
- **TypeScript** (frontend y backend)
- **JavaScript** (configuración/scripts)
- **SQL** (migraciones y funciones)
- **Bash** (scripts de automatización)

### Frameworks/Librerías principales
**Frontend**
- React 18
- Vite 6
- React Router DOM 6
- TailwindCSS 3.4
- Radix UI
- React Hook Form
- Zod

**Backend**
- Supabase (PostgreSQL + Edge Functions)
- Deno (runtime Edge Functions)

### Versiones requeridas (confirmadas)
- **Node.js:** 20+ (README/CI)
- **pnpm:** 9+ (README/CI)
- **Deno:** v2.x (CI)
- **PostgreSQL:** 17 (supabase/config.toml)

### Dependencias principales (frontend)
- `react`, `react-dom`, `react-router-dom`
- `@supabase/supabase-js`
- `@radix-ui/*`
- `react-hook-form`, `zod`
- `tailwind-merge`, `tailwindcss-animate`
- `recharts`, `lucide-react`, `date-fns`

### Dependencias de desarrollo relevantes
- `vite`, `@vitejs/plugin-react`
- `typescript`, `typescript-eslint`
- `eslint`
- `vitest`, `@vitest/coverage-v8`
- `@playwright/test`
- `postcss`, `autoprefixer`, `tailwindcss`

### Gestor de paquetes
- **pnpm** (frontend)
- **npm** (raíz para tests y scripts)

---

## 3. ARQUITECTURA Y ESTRUCTURA

### Estructura de carpetas (resumen completo)
```
/ (raíz)
├── minimarket-system/        # Frontend React + Vite
├── supabase/                 # Backend (Edge Functions + DB)
├── tests/                    # Tests (Vitest)
├── docs/                     # Documentación
├── scripts/                  # Scripts de testing/ops
├── .github/workflows/        # CI/CD
├── setup.sh, deploy.sh, migrate.sh, test.sh
└── vitest*.config.ts
```

### Patrón arquitectónico
**Arquitectura serverless + SPA** con API Gateway centralizado y módulos por dominio (scraper, proveedor, cron).

### Módulos/archivos más importantes
- **Frontend**
  - `minimarket-system/src/main.tsx`: entry point React.
  - `minimarket-system/src/App.tsx`: enrutamiento + rutas protegidas.
  - `minimarket-system/src/contexts/AuthContext.tsx`: auth.
  - `minimarket-system/src/lib/supabase.ts`: cliente Supabase.
- **Backend**
  - `supabase/functions/api-minimarket/index.ts`: API Gateway principal.
  - `supabase/functions/api-proveedor/index.ts`: API proveedor.
  - `supabase/functions/scraper-maxiconsumo/index.ts`: orquestador scraper.
  - `supabase/functions/cron-jobs-maxiconsumo/index.ts`: orquestador cron.
- **DB**
  - `supabase/migrations/*`: migraciones SQL.

### Separación frontend/backend
- **Frontend:** `minimarket-system/`
- **Backend:** `supabase/functions/`
- **DB:** `supabase/migrations/` + Supabase Postgres

### Flujo de datos
Cliente React → Supabase JS → Edge Functions → PostgREST/DB → Respuesta estandarizada.

---

## 4. BASE DE DATOS

### Base de datos
**PostgreSQL 17** (Supabase)

### ORM / herramienta
**Supabase JS** + PostgREST (no ORM clásico)

### Tablas principales (confirmadas en docs/ESQUEMA_BASE_DATOS_ACTUAL.md)
- `categorias`
- `productos`
- `precios_proveedor`
- `proveedores`
- `stock_deposito`
- `movimientos_deposito`
- `precios_historicos`
- `productos_faltantes`
- `tareas_pendientes`
- `notificaciones_tareas`
- `personal`

### Tablas cron (confirmadas en instrucciones y docs)
- `cron_jobs_execution_log`
- `cron_jobs_alerts`
- `cron_jobs_metrics`
- `cron_jobs_tracking`
- `cron_jobs_notifications`
- `cron_jobs_monitoring_history`
- `cron_jobs_health_checks`

### Migraciones
Ubicación: `supabase/migrations/`

### Seeders
- `supabase/config.toml` → `db.seed.sql_paths = ["./seed.sql"]`

---

## 5. APIs Y ENDPOINTS

### API principal: `api-minimarket`
**Base URL**
- Prod: `https://htvlwhisjpdagqkqnpxg.supabase.co/functions/v1/api-minimarket`
- Local: `http://127.0.0.1:54321/functions/v1/api-minimarket`

**Endpoints (confirmados en docs/API_README.md y código del gateway)**
- `GET /categorias`
- `GET /categorias/{id}`
- `GET /productos`
- `GET /productos/{id}`
- `POST /productos`
- `PUT /productos/{id}`
- `DELETE /productos/{id}`
- `GET /proveedores`
- `GET /proveedores/{id}`
- `POST /precios/aplicar`
- `POST /precios/redondear`
- `GET /stock`
- `GET /stock/minimo`
- `GET /stock/producto/{id}`
- `POST /deposito/movimiento`
- `GET /deposito/movimientos`
- `POST /deposito/ingreso`
- `POST /reservas`
- `POST /compras/recepcion`
- `GET /reportes/efectividad-tareas`

### API proveedor: `api-proveedor`
**Base URL**
- Prod: `https://htvlwhisjpdagqkqnpxg.supabase.co/functions/v1/api-proveedor`
- Local: `http://127.0.0.1:54321/functions/v1/api-proveedor`

**Endpoints (docs/API_README.md)**
- `GET /precios`
- `GET /productos`
- `GET /comparacion`
- `POST /sincronizar`
- `GET /status`
- `GET /alertas`
- `GET /estadisticas`
- `GET/POST /configuracion`
- `GET /health`

### Autenticación
- **JWT (Supabase Auth)** para API principal.
- **Shared secret** `x-api-secret` para API proveedor.

### Middleware relevante
- CORS con allowlist
- Rate limiting
- Circuit breaker
- Request ID
- Validación y sanitización

---

## 6. CONFIGURACIÓN Y VARIABLES DE ENTORNO

### Frontend
- `VITE_SUPABASE_URL` (obligatoria)
- `VITE_SUPABASE_ANON_KEY` (obligatoria)
- `VITE_USE_MOCKS` (opcional)

### Backend (Edge Functions)
- `SUPABASE_URL` (obligatoria)
- `SUPABASE_ANON_KEY` (obligatoria)
- `SUPABASE_SERVICE_ROLE_KEY` (obligatoria)
- `ALLOWED_ORIGINS` (opcional)
- `API_PROVEEDOR_SECRET` (obligatoria para api-proveedor)
- `REQUIRE_ORIGIN` (opcional)
- `SCRAPER_READ_MODE` (opcional)
- `API_PROVEEDOR_READ_MODE` (opcional)

### Configs relevantes
- `supabase/config.toml`
- `minimarket-system/vite.config.ts`
- `minimarket-system/tailwind.config.js`
- `vitest.config.ts`
- `.github/workflows/ci.yml`

---

## 7. SCRIPTS Y COMANDOS

### Root `package.json`
- `npm test`, `npm run test:unit`, `test:integration`, `test:e2e`, `test:coverage`
- `test:auxiliary`, `test:performance`, `test:security`, `test:contracts`

### Frontend `minimarket-system/package.json`
- `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm preview`
- `pnpm test:e2e:frontend`
- `pnpm deploy:prod`, `pnpm migrate:*`, `pnpm setup:*`

### Scripts shell
- `setup.sh`, `deploy.sh`, `migrate.sh`, `test.sh`

---

## 8. DEPENDENCIAS EXTERNAS E INTEGRACIONES

- **Supabase** (Auth, DB, Edge Functions)
- **Proveedor Maxiconsumo Necochea** (scraping)
- **Yahoo Finance** (mencionado en docs, integración futura)

Requiere credenciales externas: claves Supabase y `API_PROVEEDOR_SECRET`.

---

## 9. FRONTEND

- **Framework:** React 18 + Vite
- **Estilos:** TailwindCSS + PostCSS
- **Componentes clave:** Layout, ErrorBoundary, páginas de dominio
- **Estado global:** Context API (AuthContext)
- **UI libs:** Radix UI, shadcn, Lucide, Recharts

---

## 10. AUTENTICACIÓN Y SEGURIDAD

- Supabase Auth (JWT)
- Roles: público/ventas/deposito/admin
- CORS restrictivo
- Rate limit
- Circuit breaker
- RLS (pendiente auditoría completa)

---

## 11. PRUEBAS

- Framework: **Vitest**
- E2E frontend: **Playwright**
- Ubicación: `tests/unit`, `tests/integration`, `tests/e2e`
- Cobertura configurada: 60% global

---

## 12. COMPILACIÓN Y DESPLIEGUE

- CI/CD: GitHub Actions (`.github/workflows/ci.yml`)
- Sin Dockerfile ni docker-compose
- Deploy automatizado en `deploy.sh`

---

## 13. REQUISITOS PREVIOS

- Node.js 20+
- pnpm 9+
- Deno v2
- Supabase CLI (si se usa local)

---

## 14. INSTALACIÓN PASO A PASO

1. Clonar repo
2. `cd minimarket-system`
3. `cp .env.example .env`
4. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
5. `pnpm install`
6. `pnpm dev`

---

## 15. LIMITACIONES Y CONSIDERACIONES

- Validaciones runtime pendientes en cron/scraper (ROADMAP).
- Auditoría RLS pendiente.
- Tests de performance/seguridad legacy.

---

## 16. PUNTOS DE ENTRADA

- Frontend: `minimarket-system/src/main.tsx`
- Backend:
  - `supabase/functions/api-minimarket/index.ts`
  - `supabase/functions/api-proveedor/index.ts`
  - `supabase/functions/scraper-maxiconsumo/index.ts`

---

## 17. PUERTOS Y URLs

- Frontend: `http://localhost:5173`
- Supabase API: `http://127.0.0.1:54321`
- DB: `localhost:54322`
- Studio: `http://127.0.0.1:54323`

---

**Documento final consolidado y alineado al repositorio.**

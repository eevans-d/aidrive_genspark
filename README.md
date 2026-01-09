# 🏪 Sistema Mini Market

> Sistema de gestión para mini markets con React, TypeScript y Supabase.

[![CI](https://github.com/[owner]/[repo]/actions/workflows/ci.yml/badge.svg)](https://github.com/[owner]/[repo]/actions/workflows/ci.yml)

## 🚀 Inicio Rápido

### Requisitos
- Node.js 20+
- pnpm 9+
- Cuenta Supabase (para backend)
- Deno (para Edge Functions)

### Instalación
```bash
cd minimarket-system
cp .env.example .env          # Configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
pnpm install
pnpm dev
```

### Comandos Principales
```bash
pnpm dev          # Desarrollo local
pnpm build        # Build producción
pnpm lint         # Linter
npx vitest run    # Tests unitarios (Vitest)
pnpm deploy:prod  # Deploy producción (delega a ../deploy.sh)
```

---

## 📁 Estructura del Proyecto

```
├── minimarket-system/     # Frontend React + Vite + TypeScript
│   ├── src/
│   │   ├── components/    # Layout, ErrorBoundary
│   │   ├── contexts/      # AuthContext (autenticación)
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Cliente Supabase
│   │   ├── pages/         # Dashboard, Stock, Productos, etc.
│   │   └── types/         # Interfaces TypeScript
│   └── .env.example       # Variables de entorno requeridas
│
├── supabase/
│   ├── functions/         # Edge Functions (Deno) - Modularizadas
│   │   ├── _shared/             # Utilidades compartidas (cors, logger, errors)
│   │   ├── api-minimarket/      # API Gateway principal
│   │   ├── api-proveedor/       # API proveedor (modular)
│   │   ├── scraper-maxiconsumo/ # Scraping de precios (9 módulos)
│   │   ├── cron-jobs-maxiconsumo/ # Jobs automáticos (4 jobs + orchestrator)
│   │   ├── alertas-stock/       # Alertas de inventario
│   │   └── ...
│   ├── cron_jobs/         # Configuración de jobs automáticos
│   └── migrations/        # Migraciones SQL versionadas
│
├── docs/                  # Documentación técnica
│   ├── API_README.md              # Guía de API
│   ├── ESQUEMA_BASE_DATOS_ACTUAL.md  # Schema BD
│   ├── api-openapi-3.1.yaml       # OpenAPI spec
│   ├── PLAN_EJECUCION.md          # Plan técnico
│   ├── CHECKLIST_CIERRE.md        # Estado del proyecto
│   └── DEPLOYMENT_GUIDE.md        # Guía de deploy
│
├── tests/                 # Tests (Vitest)
│   └── unit/              # Tests unitarios (44 tests)
│
├── .github/workflows/     # CI/CD
│   └── ci.yml             # Pipeline: lint → test → build
│
├── setup.sh              # Script de configuración
├── deploy.sh             # Script de deployment
├── migrate.sh            # Script de migraciones
└── vitest.config.ts      # Configuración Vitest
```

---

## 🔧 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI |
| Backend | Supabase (PostgreSQL + Edge Functions en Deno) |
| Auth | Supabase Auth con JWT |
| Testing | Vitest + @vitest/coverage-v8 |
| CI/CD | GitHub Actions |
| Hosting | Supabase + CDN |

---

## 📊 Módulos Funcionales

| Módulo | Descripción | Archivo Principal |
|--------|-------------|-------------------|
| Dashboard | Métricas y tareas urgentes | `src/pages/Dashboard.tsx` |
| Stock | Control de inventario | `src/pages/Stock.tsx` |
| Depósito | Entradas/salidas simplificadas | `src/pages/Deposito.tsx` |
| Productos | Catálogo con precios | `src/pages/Productos.tsx` |
| Proveedores | Directorio de proveedores | `src/pages/Proveedores.tsx` |
| Tareas | Gestión de pendientes | `src/pages/Tareas.tsx` |

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npx vitest run

# Tests con watch mode
npx vitest

# Tests con coverage
npx vitest run --coverage

# Tests de integración (Supabase local)
npm run test:integration

# Smoke tests E2E (Supabase local)
npm run test:e2e
```

**Tests disponibles (47 total):**
- `api-proveedor-routing.test.ts` - Routing y validación (17 tests)
- `scraper-parsing.test.ts` - Parsing de productos (10 tests)
- `scraper-matching.test.ts` - Matching de productos (9 tests)
- `scraper-alertas.test.ts` - Alertas de precios (3 tests)
- `cron-jobs.test.ts` - Jobs y orquestación (8 tests)

---

## 🔑 Variables de Entorno

### Frontend (`minimarket-system/.env`)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Edge Functions (configuradas en Supabase Dashboard)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/ESTADO_ACTUAL.md](docs/ESTADO_ACTUAL.md) | Progreso aproximado hacia producción |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Plan vigente (rolling 90 días) |
| [docs/PLAN_WS_DETALLADO.md](docs/PLAN_WS_DETALLADO.md) | Plan operativo por workstreams |
| [docs/DECISION_LOG.md](docs/DECISION_LOG.md) | Decisiones para evitar ambigüedades |
| [docs/API_README.md](docs/API_README.md) | Endpoints y ejemplos de uso |
| [docs/ESQUEMA_BASE_DATOS_ACTUAL.md](docs/ESQUEMA_BASE_DATOS_ACTUAL.md) | Tablas, campos e índices |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Guía de deployment |
| [docs/CRON_JOBS_COMPLETOS.md](docs/CRON_JOBS_COMPLETOS.md) | Automatizaciones |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Guía para agentes IA |

---

## 🗂️ Archivos Legacy

La carpeta legacy `_archive/` fue eliminada para reducir contexto y evitar confusiones. El histórico queda disponible en el historial de Git.

---

## 📝 Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para historial de versiones.

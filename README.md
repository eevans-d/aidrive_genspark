# 🏪 Sistema Mini Market

> Sistema de gestión para mini markets con React, TypeScript y Supabase.

## 🚀 Inicio Rápido

### Requisitos
- Node.js 20+
- pnpm 9+
- Cuenta Supabase (para backend)
- Deno (para Edge Functions)

### Instalación
```bash
cd minimarket-system
cp .env.example .env
pnpm install
pnpm dev
```

### Comandos Principales
```bash
pnpm dev          # Desarrollo local
pnpm build        # Build producción
pnpm lint         # Linter
npm run test:unit # Tests unitarios (Vitest)
```

---

## 📁 Estructura del Proyecto

```
├── minimarket-system/     # Frontend React + Vite + TypeScript
│   ├── src/
│   │   ├── components/    # Layout, ErrorBoundary
│   │   ├── contexts/      # AuthContext
│   │   ├── hooks/queries/ # 8 hooks React Query
│   │   ├── lib/           # Supabase + apiClient
│   │   └── pages/         # 8 páginas
│   └── .env.example
│
├── supabase/
│   ├── functions/         # Edge Functions (Deno)
│   │   ├── _shared/       # Módulos compartidos
│   │   ├── api-minimarket/# Gateway (26 endpoints)
│   │   ├── api-proveedor/ # API proveedor
│   │   └── scraper-*/     # Scraping
│   └── migrations/        # Migraciones SQL
│
├── tests/                 # Tests (Vitest)
│   └── unit/             # 285 tests
│
├── docs/                  # Documentación (11 archivos)
└── AGENTS.md             # Guía para agentes IA
```

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [AGENTS.md](AGENTS.md) | **Guía rápida para agentes IA** |
| [docs/ESTADO_ACTUAL.md](docs/ESTADO_ACTUAL.md) | Fuente de verdad - estado actual |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Plan rolling 90 días |
| [docs/BACKLOG_PRIORIZADO.md](docs/BACKLOG_PRIORIZADO.md) | Prioridades |
| [docs/ARCHITECTURE_DOCUMENTATION.md](docs/ARCHITECTURE_DOCUMENTATION.md) | Arquitectura |
| [docs/API_README.md](docs/API_README.md) | Endpoints API |
| [docs/DECISION_LOG.md](docs/DECISION_LOG.md) | Decisiones técnicas |

---

## 🔧 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind, React Query |
| Backend | Supabase (PostgreSQL + Edge Functions Deno) |
| Auth | Supabase Auth con JWT |
| Testing | Vitest (285 tests) |
| CI/CD | GitHub Actions |

---

## 📊 Estado del Proyecto

| Métrica | Valor |
|---------|-------|
| **Avance Global** | 78% |
| **Frontend** | 90% (React Query + Gateway) |
| **Gateway** | 85% (26 endpoints) |
| **Tests** | 285 passing |
| **Build** | ✅ OK |

---

## 🧪 Testing

```bash
# Tests unitarios
npm run test:unit

# Tests con coverage
npx vitest run --coverage

# E2E (requiere .env.test con credenciales)
bash scripts/run-e2e-tests.sh
```

---

## 🔑 Variables de Entorno

### Frontend (`minimarket-system/.env`)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_GATEWAY_URL=/api-minimarket  # Opcional
```

### Edge Functions
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ALLOWED_ORIGINS=https://dominio.com
API_PROVEEDOR_SECRET=secret-32-chars
```

---

## 📝 Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para historial de versiones.

---

*Última actualización: 2026-01-18*

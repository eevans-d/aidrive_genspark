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
│   │   └── pages/         # 9 páginas
│   └── .env.example
│
├── supabase/
│   ├── functions/         # Edge Functions (Deno)
│   │   ├── _shared/       # Módulos compartidos
│   │   ├── api-minimarket/# Gateway (34 endpoints)
│   │   ├── api-proveedor/ # API proveedor
│   │   └── scraper-*/     # Scraping
│   └── migrations/        # Migraciones SQL
│
├── tests/                 # Tests (Vitest)
│   └── unit/             # 725 tests (2026-02-06)
│
├── docs/                  # Documentación
```

---

## 📚 Documentación

> **Para Agentes IA:** Ver `docs/AGENTS.md` y `.agent/skills/project_config.yaml` para consultar los **Skills** activos (9).

| Documento | Descripción |
|-----------|-------------|
| [docs/AGENTS.md](docs/AGENTS.md) | **Guía rápida para agentes IA** |
| [docs/ESTADO_ACTUAL.md](docs/ESTADO_ACTUAL.md) | Fuente de verdad - estado actual |
| [docs/HOJA_RUTA_MADRE_2026-01-31.md](docs/HOJA_RUTA_MADRE_2026-01-31.md) | Hoja de ruta vigente |
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
| Testing | Vitest (unit/integration/e2e) + Vitest (frontend) |
| CI/CD | GitHub Actions |

---

## 📊 Estado del Proyecto

| Métrica | Valor |
|---------|-------|
| **Avance Global** | 95% |
| **Frontend** | 90% (React Query + Gateway) |
| **Gateway** | 90% (34 endpoints) |
| **Tests** | ✅ Unit 725 + Integration 38 + E2E smoke 4 + Frontend 40 (2026-02-06) |
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
# Smoke Test (Notificaciones)
# Requiere .env.test con credenciales remotas
node scripts/smoke-notifications.mjs
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
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
API_PROVEEDOR_SECRET=secret-32-chars
```

---

## 📝 Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para historial de versiones.

---

*Última actualización: 2026-02-06*

# Sistema Mini Market

Sistema de gestion para mini markets con frontend React + backend Supabase (Edge Functions + PostgreSQL).

## Estado Actual
- Fecha de referencia: 2026-02-19
- Veredicto: **GO** (D-140, 11/11 gates PASS; D-141 deploy Cloudflare; D-142 schema doc rewrite)
- Score operativo: 100% (11/11 gates)
- Fuente de verdad: `docs/ESTADO_ACTUAL.md`
- Pendientes operativos: `docs/closure/OPEN_ISSUES.md`

## Inicio Rapido

### Requisitos
- Node.js 20+
- pnpm 9+
- Deno
- Supabase CLI

### Instalacion
```bash
cd minimarket-system
cp .env.example .env
pnpm install
pnpm dev
```

### Comandos Principales
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
pnpm -C minimarket-system test:components
```

## Arquitectura (snapshot 2026-02-19)
- Edge Functions activas: 13 (api-minimarket v29, api-proveedor v20, scraper-maxiconsumo v21)
- Migraciones SQL: 44 (44/44 synced remoto)
- Base de datos: 38 tablas documentadas
- Frontend: Cloudflare Pages — https://aidrive-genspark.pages.dev
- Skills locales en `.agent/skills`: 22
- Workflows `.agent/workflows/*.md`: 12

## Calidad Verificada (D-142, 2026-02-19)
- Unit: 1561/1561 PASS (76 archivos)
- E2E: 4/4 PASS
- Integration: 68/68 PASS
- Coverage: 88.52% stmts / 80.16% branch / 92.32% funcs / 89.88% lines
- Frontend: 175/175 PASS (30 archivos)
- Build frontend: PASS
- Gates: PASS (11/11 D-140)

## Documentacion Canonica
- `docs/ESTADO_ACTUAL.md`
- `docs/DECISION_LOG.md`
- `docs/closure/OPEN_ISSUES.md`
- `docs/closure/CONTINUIDAD_SESIONES.md`
- `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
- `docs/API_README.md`
- `docs/ARCHITECTURE_DOCUMENTATION.md`
- `docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md`
- `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md`

## Nota de Vigencia
Los documentos fechados (por ejemplo `docs/closure/*`, `docs/mpc/*`, `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`) son evidencia historica de su fecha. Para decisiones actuales, usar solo la documentacion canonica listada arriba.

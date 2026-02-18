# Sistema Mini Market

Sistema de gestion para mini markets con frontend React + backend Supabase (Edge Functions + PostgreSQL).

## Estado Actual
- Fecha de referencia: 2026-02-18
- Veredicto: **GO** (9/9 gates PASS D-137; 8/8 VULNs cerradas; ver `docs/closure/OPEN_ISSUES.md`)
- Score operativo: 100% (GO D-137)
- Fuente de verdad: `docs/ESTADO_ACTUAL.md`

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

## Arquitectura (snapshot 2026-02-18)
- Edge Functions activas: 13
- Migraciones SQL: 44 fisicas (43/43 synced remoto D-132 + 1 nueva local)
- Skills locales en `.agent/skills`: 22
- Workflows `.agent/workflows/*.md`: 12

## Calidad Verificada (ultimo recheck 2026-02-18 D-137)
- Unit: 1248/1248 PASS (59 archivos)
- E2E: 4/4 PASS
- Coverage: 88.52% stmts / 80.00% branch / 92.32% funcs / 89.88% lines
- Frontend: 175/175 PASS (30 archivos)
- Build frontend: PASS
- Gates: PASS (9/9 D-137)

## Documentacion Canonica
- `docs/ESTADO_ACTUAL.md`
- `docs/DECISION_LOG.md`
- `docs/closure/CONTEXT_PROMPT_EJECUTOR_MEGA_PLAN_2026-02-13.md`
- `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md`
- `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md`
- `docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md`
- `docs/closure/OPEN_ISSUES.md`
- `docs/closure/README_CANONICO.md`

## Nota de Vigencia
Los documentos fechados (por ejemplo `docs/closure/*`, `docs/mpc/*`, `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`) son evidencia historica de su fecha. Para decisiones actuales, usar solo la documentacion canonica listada arriba.

# Sistema Mini Market

Sistema de gestion para mini markets con frontend React + backend Supabase (Edge Functions + PostgreSQL).

## Estado Actual
- Fecha de referencia: 2026-02-16
- Veredicto: APROBADO (P0 cerrados y verificados en remoto; ver `docs/closure/OPEN_ISSUES.md`)
- Score operativo: 92/100
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

## Arquitectura (snapshot 2026-02-16)
- Edge Functions activas: 13
- Migraciones SQL: 41 (local/remoto 41/41)
- Skills locales en `.agent/skills`: 22
- Workflows `.agent/workflows/*.md`: 12

## Calidad Verificada (ultimo recheck 2026-02-16)
- Unit: 1165/1165 PASS (58 archivos)
- Auxiliary: 45/45 PASS + 4 skipped (3 archivos)
- Coverage: 89.20% stmts / 80.91% branch / 93.29% funcs / 90.66% lines
- Frontend: 171/171 PASS (30 archivos)
- E2E smoke: 5/5 PASS
- Build frontend: PASS
- Gates: PASS

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

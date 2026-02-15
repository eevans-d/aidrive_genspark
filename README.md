# Sistema Mini Market

Sistema de gestion para mini markets con frontend React + backend Supabase (Edge Functions + PostgreSQL).

## Estado Actual
- Fecha de referencia: 2026-02-13
- Veredicto: CON RESERVAS NO CRITICAS (dependencias owner)
- Score operativo: 86/100
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

## Arquitectura (snapshot 2026-02-13)
- Edge Functions activas: 13
- Migraciones SQL: 39 (local/remoto 39/39)
- Skills locales en `.agent/skills`: 22
- Workflows `.agent/workflows/*.md`: 12

## Calidad Verificada (sesion 2026-02-13)
- Unit: 829/829 PASS
- Integration: 38/38 PASS
- E2E smoke: 5/5 PASS
- Frontend component tests: 150/150 PASS
- Gates: PASS
- Evidencia: `test-reports/quality-gates_20260213-061657.log`

## Documentacion Canonica
- `docs/ESTADO_ACTUAL.md`
- `docs/DECISION_LOG.md`
- `docs/closure/MEGA_PLAN_2026-02-13_042956.md`
- `docs/closure/CONTEXT_PROMPT_EJECUTOR_MEGA_PLAN_2026-02-13.md`
- `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md`
- `docs/closure/OPEN_ISSUES.md`
- `docs/closure/README_CANONICO.md`

## Nota de Vigencia
Los documentos fechados (por ejemplo `docs/closure/*`, `docs/mpc/*`, `docs/HOJA_RUTA_MADRE_2026-01-31.md`) son evidencia historica de su fecha. Para decisiones actuales, usar solo la documentacion canonica listada arriba.

# Sistema Mini Market

Sistema de gestion para mini markets con frontend React + backend Supabase (Edge Functions + PostgreSQL).

## Estado Actual
- Fecha de referencia: 2026-02-21
- Veredicto: **GO** (D-149: paquete documental V1 produccion + estado tecnico vigente D-148)
- Score operativo: 100% (11/11 gates de referencia operativa)
- Fuente de verdad: `docs/ESTADO_ACTUAL.md`
- Pendientes operativos: `docs/closure/OPEN_ISSUES.md`

## Snapshot Tecnico (FactPack 2026-02-21)
- Edge Functions en repo: 14 (excluyendo `_shared`)
- Migraciones SQL: 44
- Base de datos: 38 tablas documentadas
- Skills locales: 22
- Archivos markdown en `docs/`: 201
- Frontend productivo: https://aidrive-genspark.pages.dev

## Integracion Reciente (Claude Code + DocuGuard)
- D-146 a D-148: implementaciones reales de Cuaderno Inteligente, verificacion independiente post-Claude y backfill idempotente de recordatorios.
- D-149: paquete documental V1 para operacion real (manual de uso, guia rapida, troubleshooting, monitoreo, install/testing, runbook expandido).
- D-150: pulido final de claridad y gobernanza documental (sincronizacion de docs principales y cierre de docs de comunidad).

## Calidad Verificada (segun estado vigente)
- Unit: 1640/1640 PASS (ultimo addendum tecnico D-148)
- Integration: 68/68 PASS
- E2E smoke: 4/4 PASS
- Components frontend: 197/197 PASS
- Coverage historica de referencia (D-140): 88.52% stmts / 80.16% branch / 92.32% funcs / 89.88% lines

## Inicio Rapido

### Requisitos
- Node.js 20+
- pnpm 9+
- Deno
- Supabase CLI

### Instalacion minima
```bash
cd minimarket-system
cp .env.example .env
pnpm install
pnpm dev
```

### Comandos principales
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
pnpm -C minimarket-system test:components
```

## Documentacion Principal (Canonica)
- `docs/ESTADO_ACTUAL.md`
- `docs/DECISION_LOG.md`
- `docs/closure/OPEN_ISSUES.md`
- `docs/API_README.md`
- `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
- `docs/OPERATIONS_RUNBOOK.md`
- `docs/MANUAL_USUARIO_FINAL.md`
- `docs/GUIA_RAPIDA_OPERACION_DIARIA.md`
- `docs/TROUBLESHOOTING.md`
- `docs/MONITORING.md`
- `docs/INSTALLATION.md`
- `docs/TESTING.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`

## Nota de Vigencia
Los documentos fechados en `docs/closure/`, `docs/archive/` y `docs/mpc/` se consideran snapshots historicos de su fecha.
Para decisiones actuales, usar siempre los documentos canonicos listados arriba.

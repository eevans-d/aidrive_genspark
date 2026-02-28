# Sistema Mini Market

Sistema de gestion para mini markets con frontend React + backend Supabase (Edge Functions + PostgreSQL).

## Estado actual (2026-02-27)
- Veredicto global: `GO INCONDICIONAL`
- Modulo OCR de facturas: `BACKLOG CRITICO PRIORIZADO` (plan de ejecucion activo)
- Tests unitarios: `1733/1733 PASS`
- Migraciones SQL: `52`
- Edge Functions en repo: `15`

## Fuentes canónicas
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/API_README.md`
5. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
6. `docs/METRICS.md`
7. `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` (solo roadmap OCR)

## Plan OCR activo
- Canonico: `docs/PLAN_FUSIONADO_FACTURAS_OCR.md`
- Historicos/deprecados: `docs/archive/planes-deprecados/PLAN_FACTURAS_OCR.md`, `docs/archive/planes-deprecados/PLAN_MAESTRO_OCR_FACTURAS.md`

## Inicio rapido
```bash
cd minimarket-system
cp .env.example .env
pnpm install
pnpm dev
```

## Comandos principales
```bash
npm run test
npm run test:unit
npm run test:integration
npm run test:e2e
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
pnpm -C minimarket-system test:components
```

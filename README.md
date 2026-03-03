# Sistema Mini Market

Sistema de gestion para mini markets con frontend React + backend Supabase (Edge Functions + PostgreSQL).

## Estado actual (2026-03-03)
- Veredicto global: `LISTO PARA PRODUCCION` (Tier 1 6/6 DONE, Tier 2 10/12 DONE)
- Modulo OCR de facturas: `ESTABLE — backlog tecnico 10/10 cerrado` (GCV bloqueado externamente)
- Asistente IA: `Sprint 2 completado` (read-only + acciones con confirmacion)
- Tests unitarios: `1905/1905 PASS` (85 archivos)
- Migraciones SQL: `56` (4 pendientes de aplicar)
- Edge Functions desplegadas: `16/16 ACTIVE`

## Fuentes canónicas
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/API_README.md`
5. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
6. `docs/METRICS.md`
7. `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` (solo roadmap OCR)
8. `docs/PLAN_ASISTENTE_IA_DASHBOARD.md` (roadmap asistente IA)

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

# C4 — HANDOFF TÉCNICO (MINI MARKET)

**Fecha:** 2026-01-26  
**Estado:** Vigente (pendiente rollback probado)

---

## 1) Resumen del sistema
- Frontend: React + Vite + TS en `minimarket-system/`.
- Backend: Supabase Edge Functions en `supabase/functions/`.
- DB: Postgres (Supabase). Migraciones en `supabase/migrations/`.

## 2) Entrypoints críticos
- Gateway: `supabase/functions/api-minimarket`.
- Proveedor: `supabase/functions/api-proveedor`.
- Scraper: `supabase/functions/scraper-maxiconsumo`.
- Cron jobs: `supabase/functions/cron-*`.

## 3) Operación básica
- Tests unitarios: `npx vitest run`.
- Integración/E2E: requieren `.env.test` y/o Supabase local.
- E2E auth real: `VITE_USE_MOCKS=false pnpm exec playwright test auth.real`.

## 4) Bloqueos activos
- Pendiente: probar rollback en staging (ver `docs/DEPLOYMENT_GUIDE.md`).

## 5) Contactos
- PO/Tech Lead/Ops: **TBD**.

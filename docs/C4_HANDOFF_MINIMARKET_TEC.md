# C4 — HANDOFF TÉCNICO (MINI MARKET)

**Fecha:** 2026-01-22  
**Estado:** Borrador operativo

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
- Integration/E2E: requieren credenciales y/o Supabase local.

## 4) Bloqueos activos
- Auditoría RLS y migraciones en staging/prod pendientes por credenciales.

## 5) Contactos
- PO/Tech Lead/Ops: **TBD**.

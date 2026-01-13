# E2E Frontend (Playwright)

## Objetivo
Smoke tests basicos de UI contra el frontend con mocks locales (sin Supabase real).

## Requisitos
- Node 18+
- pnpm
- Playwright browsers: `npx playwright install`

## Ejecucion
- `npx playwright test`

## Notas
- `playwright.config.ts` levanta `pnpm dev` con `VITE_USE_MOCKS=true`.
- Si ya hay server en `http://localhost:5173`, Playwright lo reutiliza.

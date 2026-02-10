# Copilot Instructions - Mini Market (Protocol Zero)

Este repo usa un workflow agentico llamado **Protocol Zero** bajo `.agent/`.
Tratá `.agent/` y `AGENTS.md` (raíz) como **fuente de verdad** para cómo operar.

## Guardrails (no negociables)

- **NO imprimir secretos/JWTs** (solo NOMBRES de variables/secretos).
- **NO usar comandos destructivos** (`git reset --hard`, `git checkout -- <file>`, force-push).
- Supabase Edge Function **`api-minimarket` debe permanecer `verify_jwt=false`**.  
  Si se redeployea: `supabase functions deploy api-minimarket --no-verify-jwt`.

## Fuentes de Verdad (docs)

- **Protocolo del repo:** `AGENTS.md` (raíz)
- **Estado actual:** `docs/ESTADO_ACTUAL.md`
- **Plan vigente:** `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`
- **Decisiones:** `docs/DECISION_LOG.md`
- **Conteos verificables:** `docs/METRICS.md` (generado por `scripts/metrics.mjs`)
- **API:** `docs/API_README.md` (+ OpenAPI en `docs/*.yaml`)
- **DB:** `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
- **Deploy/Rollback:** `docs/DEPLOYMENT_GUIDE.md`
- **Operación:** `docs/OPERATIONS_RUNBOOK.md`

## Mapa del Repo

- `minimarket-system/`: Frontend (React/Vite/TS)
- `supabase/functions/`: Edge Functions (Deno) + `_shared`
- `supabase/migrations/`: Migraciones SQL
- `tests/`: suites Vitest (unit/integration/e2e/security/performance/contracts)
- `scripts/`: scripts utilitarios (métricas/auditorías/smokes)
- `.agent/`: skills + workflows + CLI `p0.sh`

## Comandos Útiles (desde la raíz)

```bash
# Protocol Zero (skills + evidencia)
.agent/scripts/p0.sh bootstrap
.agent/scripts/p0.sh route "tu pedido"
.agent/scripts/p0.sh baseline
.agent/scripts/p0.sh gates all

# Métricas (fuente única)
node scripts/metrics.mjs

# Frontend
pnpm -C minimarket-system dev
pnpm -C minimarket-system build
pnpm -C minimarket-system lint

# Tests
npm run test:unit
npm run test:integration  # requiere .env.test real
npm run test:e2e          # requiere .env.test real
```

## Notas de Implementación

- No hardcodear conteos en docs: usar `docs/METRICS.md`.
- Si un documento referencia un archivo, el archivo debe existir o la referencia se elimina.
- Para cambios de arquitectura/guardrails: actualizar `docs/DECISION_LOG.md` y `docs/ESTADO_ACTUAL.md`.


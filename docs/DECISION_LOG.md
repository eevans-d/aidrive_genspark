# DECISION LOG (Canonico)

**Ultima actualizacion:** 2026-03-12 (compactado para budget de contexto)

## Decisiones vigentes (resumen operativo)

| ID | Decision | Estado | Fecha | Evidencia |
|---|---|---|---|---|
| D-196 | **Cierre de PERF-001 + estrategia de chunking estable:** se mantiene `manualChunks` por dominios pesados y se agrega `workbox.inlineWorkboxRuntime=true` para evitar warning residual de Rollup/Workbox (`Unknown input options: manualChunks`) en `generateSW`. Resultado: build limpio, sin warning circular ni warning PWA residual. | Vigente | 2026-03-12 | `minimarket-system/vite.config.ts`, `docs/closure/OPEN_ISSUES.md`, `docs/ESTADO_ACTUAL.md` |
| D-195 | **Context engineering operativo:** `docs/CONTEXT0_EJECUTIVO.md` como entrada unica de sesion; budget canonico `<=2000` palabras por documento (`CONTEXT0` 600-1000) con validacion automatica (`npm run docs:context-budget`) y exclusiones de contexto por defecto. | Vigente | 2026-03-12 | `docs/CONTEXT0_EJECUTIVO.md`, `scripts/check-context-budget.mjs`, `package.json`, `AGENTS.md`, `.agent/workflows/session-start.md` |
| D-194 | **OCR-007 refinado sin cambio de severidad:** se confirma que el bloqueo OCR no es por key/API faltante sino por billing GCP inactivo; se mantiene como `BLOCKED_EXTERNAL`. | Vigente | 2026-03-08 | `docs/closure/OPEN_ISSUES.md`, `docs/ESTADO_ACTUAL.md`, `docs/closure/archive/historical/COMET_BROWSER_FINDINGS_2026-03-08.md` |
| D-193 | **Auditoria integral RealityCheck + DocuGuard + hygiene sweep:** revalidacion end-to-end del repo con evidencia fresca y sin bloqueantes funcionales. | Vigente | 2026-03-08 | `docs/REALITY_CHECK_UX.md`, `docs/ESTADO_ACTUAL.md` |
| D-192 | **Hardening CI por pinning de GitHub Actions:** workflows clave quedan fijados por SHA y `nightly-gates` usa `--frozen-lockfile`. | Vigente | 2026-03-08 | `.github/workflows/*`, `docs/ESTADO_ACTUAL.md` |
| D-191 | **Mitigacion de sesiones desde frontend:** al no disponer de timebox/inactivity server-side en plan actual, se aplica politica client-side (`24h`/`8h`) configurable via `VITE_AUTH_*`. | Vigente | 2026-03-08 | `minimarket-system/src/contexts/AuthContext.tsx`, `minimarket-system/src/lib/authSessionPolicy.ts`, `docs/closure/OPEN_ISSUES.md` |
| D-190 | **Wave UX/Proactividad del asistente:** briefing proactivo, quick prompts contextuales, mejoras de rendering y comparativas. | Vigente | 2026-03-06 | `supabase/functions/api-assistant/*`, `minimarket-system/src/pages/Asistente.tsx`, `docs/ESTADO_ACTUAL.md` |
| D-189 | **Ejecucion T01-T15 y cierre de backlog OCR tecnico:** 14/15 tareas DONE, 1 `BLOCKED_EXTERNAL` (OCR billing); hardenings aplicados en gateway/ocr/asistente/CI. | Vigente | 2026-03-04 | `docs/closure/execution-logs/T01..T15_*.md`, `docs/closure/OPEN_ISSUES.md` |
| D-188 | **Plan secuencial T01..T15 con continuidad obligatoria:** si una tarea queda bloqueada externamente, se registra evidencia y se avanza a la siguiente sin frenar ejecucion global. | Vigente | 2026-03-04 | `docs/closure/archive/historical/CONTEXT_PROMPT_CLAUDE_CODE_15_TAREAS_2026-03-04_044540.md` |
| D-187 | **Cierre de fricciones UX P1:** estados vacios accionables, feedback de mutaciones y estabilizacion de pruebas UI criticas. | Vigente | 2026-03-04 | `minimarket-system/src/pages/Productos.tsx`, `minimarket-system/src/pages/Pedidos.tsx`, `docs/REALITY_CHECK_UX.md` |
| D-186 | **Continuidad operativa sin blockers P0:** controles HC-1/HC-2/HC-3 sin hallazgos bloqueantes; ajustes documentales de sincronizacion. | Vigente | 2026-03-04 | `docs/REALITY_CHECK_UX.md`, `docs/ESTADO_ACTUAL.md` |
| D-185 | **Tier 2 completado y atomicidad de precios:** se agrega `SELECT ... FOR UPDATE` en `sp_aplicar_precio`, se expande audit trail y se valida CORS centralizado. | Vigente | 2026-03-03 | `supabase/migrations/20260303010000_sp_aplicar_precio_for_update.sql`, `supabase/functions/api-minimarket/index.ts` |
| D-184 | **Remediacion Tier 1/Tier 2 por auditoria cruzada:** hardenings de seguridad, idempotencia, constraints y estado de tareas. | Vigente | 2026-03-02 | `supabase/migrations/202603020*.sql`, `docs/ESTADO_ACTUAL.md` |
| D-183 | **Hardening `registrar_pago_cc`:** se elimina seleccion implicita de cliente ante ambiguedad y se fuerza `clarify` antes de confirmar. | Vigente | 2026-03-02 | `supabase/functions/api-assistant/index.ts`, `docs/PLAN_ASISTENTE_IA_DASHBOARD.md` |
| D-182 | **Sprint 2 asistente (plan→confirm):** intents write con `confirm_token` de un solo uso y endpoint `/confirm`. | Vigente | 2026-03-01 | `supabase/functions/api-assistant/index.ts`, `supabase/functions/api-assistant/confirm-store.ts` |
| D-181 | **Sprint 1.3 asistente:** persistencia local de historial y accion explicita `Nuevo chat`. | Vigente | 2026-03-01 | `minimarket-system/src/pages/Asistente.tsx`, `minimarket-system/src/pages/Asistente.test.tsx` |
| D-180 | **Sprint 1.2 asistente:** fallback contextual + retry button + loading con texto. | Vigente | 2026-03-01 | `supabase/functions/api-assistant/parser.ts`, `minimarket-system/src/pages/Asistente.tsx` |
| D-179 | **Sprint 1.1 asistente:** UX friendly labels, intents saludo/ayuda y correccion de timezone en ventas del dia. | Vigente | 2026-03-01 | `supabase/functions/api-assistant/index.ts`, `supabase/functions/api-assistant/parser.ts` |
| D-178 | **Sprint 1 asistente (read-only):** `api-assistant` admin-only con intents de consulta y rutas de navegacion accionable. | Vigente | 2026-03-01 | `supabase/functions/api-assistant/*`, `minimarket-system/src/lib/roles.ts` |
| D-177 | **Auditoria profunda de produccion:** se detectan y corrigen hallazgos de seguridad/integridad en gateway, OCR y frontend. | Vigente | 2026-03-01 | `supabase/functions/api-minimarket/index.ts`, `supabase/functions/facturas-ocr/index.ts`, `tests/security/security.vitest.test.ts` |
| D-086 | **Politica JWT de Edge Functions:** solo `api-minimarket` puede operar con `verify_jwt=false`; resto `verify_jwt=true`. | Vigente | 2026-02-12 | `docs/closure/OPEN_ISSUES.md` |
| D-155 | **OCR oficial sobre Google Cloud Vision:** secret requerido `GCV_API_KEY`. | Vigente | 2026-02-23 | `.env.example`, `docs/ESTADO_ACTUAL.md` |
| D-156 | **Governance de dependencias en CI (fail-fast):** controles de alineacion de dependencias criticas en pipeline. | Vigente | 2026-02-24 | `scripts/check-supabase-js-alignment.mjs`, `scripts/check-critical-deps-alignment.mjs` |

## Notas de uso
- Este documento canonico queda orientado a operacion y continuidad.
- El detalle largo historico permanece trazable en el historial de git del archivo.
- Hallazgos abiertos/cerrados por severidad viven en:
  - `docs/closure/OPEN_ISSUES.md`

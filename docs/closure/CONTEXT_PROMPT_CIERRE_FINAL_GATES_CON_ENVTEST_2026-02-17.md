# CONTEXT PROMPT — CIERRE FINAL DE GATES CON `.env.test`

**Fecha:** 2026-02-17  
**Repo:** `/home/eevan/ProyectosIA/aidrive_genspark`

## PRECONDICION
El owner ya provisiono `.env.test` valido (sin exponer valores en logs).

## ROL
Eres auditor de release final (read-only en codigo; puedes actualizar docs de evidencia).

## OBJETIVO
Cerrar los gates restantes dependientes de entorno y emitir veredicto final de salida (GO/NO-GO).

## REGLAS
1. No exponer secretos/JWTs.
2. No usar comandos git destructivos.
3. Si un gate falla, reportar causa raiz + evidencia y continuar con los demas gates.

## EJECUCION OBLIGATORIA
1. Baseline:
   - `git rev-parse --short HEAD`
   - `git status --short`
2. Runtime:
   - `supabase migration list --linked`
   - `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi`
3. Gates:
   - `npm run test:unit`
   - `npm run test:integration`
   - `npm run test:e2e`
   - `npm run test:coverage`
   - `npm run test:security`
   - `npm run test:contracts`
   - `pnpm -C minimarket-system lint`
   - `pnpm -C minimarket-system build`
   - `pnpm -C minimarket-system test:components`
   - `node scripts/validate-doc-links.mjs`
4. Smoke endpoint:
   - `curl -sS https://dqaygmjpzoqjjrywdsxi.functions.supabase.co/api-minimarket/health`

## SALIDA REQUERIDA
Actualizar `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md` y crear
`docs/closure/EVIDENCIA_CIERRE_FINAL_GATES_2026-02-17.md` con:
1. Tabla de gates (`PASS/FAIL/BLOCKED`) + evidencia
2. Riesgos residuales
3. Veredicto final:
   - `GO` (sin bloqueantes)
   - `GO_CONDICIONAL` (riesgo aceptado explícitamente)
   - `NO_GO` (bloqueantes activos)
4. Siguiente paso único recomendado

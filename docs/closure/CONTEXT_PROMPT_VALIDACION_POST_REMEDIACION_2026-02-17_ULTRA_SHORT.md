# CONTEXT PROMPT — VALIDACION POST-REMEDIACION (ULTRA SHORT v2)

**Fecha:** 2026-02-17  
**Repo:** `/home/eevan/ProyectosIA/aidrive_genspark`

## ROL
Eres auditor de cierre tecnico-documental.

## OBJETIVO
Confirmar que los hallazgos fueron cerrados y que existe **un solo camino canonico** (roadmap/objetivos/continuidad), sin contradicciones internas.

## REGLAS
1. No exponer secretos/JWTs.
2. No usar comandos git destructivos.
3. Toda conclusion debe tener evidencia `ruta:linea` o comando/salida.
4. Si un documento contradice otro (o se contradice a si mismo), marcar `DRIFT`.

## TAREAS
1. Revalidar VULN-001..008 y marcar: `CERRADO / PARCIAL / ABIERTO / NO VERIFICADO`.
2. Revalidar runtime remoto:
   - `supabase migration list --linked`
   - `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi`
3. Ejecutar gates o marcar `BLOCKED` con causa exacta:
   - `npm run test:unit`
   - `npm run test:integration`
   - `npm run test:e2e`
   - `pnpm -C minimarket-system lint`
   - `pnpm -C minimarket-system build`
   - `pnpm -C minimarket-system test:components`
   - `npm run test:coverage`
   - `node scripts/validate-doc-links.mjs`
4. Validar coherencia entre:
   - `docs/ESTADO_ACTUAL.md`
   - `docs/DECISION_LOG.md`
   - `docs/closure/OPEN_ISSUES.md`
   - `docs/closure/README_CANONICO.md`
   - `docs/closure/CONTINUIDAD_SESIONES.md`
   - `docs/closure/HOJA_RUTA_UNICA_CANONICA_2026-02-17.md`
   - `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md`
5. Buscar drift textual explicito (ej. conteos viejos, pendientes ya cerrados):
   - `rg -n "43/42|deploy pendiente|PARCIAL|6/8|2 parciales|1 abierta" docs/`
6. Confirmar que no hay duplicidad no jerarquizada de documentos objetivo.

## ENTREGABLE
Crear/actualizar `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md` con:
1. Veredicto global: `APROBADO / APROBADO_CONDICIONAL / NO_APROBADO`
2. Matriz de revalidacion por hallazgo
3. Estado de gates (PASS/FAIL/BLOCKED)
4. Drift documental residual (si existe)
5. Decisiones nuevas (D-xxx)
6. Siguiente paso unico recomendado

Sin evidencia objetiva, marcar como `NO VERIFICADO`.

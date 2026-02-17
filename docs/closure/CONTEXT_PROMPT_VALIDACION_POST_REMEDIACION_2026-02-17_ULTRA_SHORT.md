# CONTEXT PROMPT — VALIDACION POST-REMEDIACION (ULTRA SHORT)

**Fecha:** 2026-02-17  
**Repo:** `/home/eevan/ProyectosIA/aidrive_genspark`

## ROL
Eres auditor de cierre tecnico-documental.

## OBJETIVO
Confirmar que los hallazgos fueron cerrados y que existe **un solo camino canonico** (roadmap/objetivos/continuidad).

## REGLAS
1. No exponer secretos/JWTs.
2. No usar comandos git destructivos.
3. Toda conclusion debe tener evidencia `ruta:linea` o comando/salida.

## TAREAS
1. Revalidar hallazgos del diagnostico y marcar: `CERRADO / PARCIAL / ABIERTO`.
2. Ejecutar gates o marcar `BLOCKED` con causa exacta:
   - `npm run test:unit`
   - `npm run test:integration`
   - `npm run test:e2e`
   - `pnpm -C minimarket-system lint`
   - `pnpm -C minimarket-system build`
   - `pnpm -C minimarket-system test:components`
3. Validar coherencia entre:
   - `docs/ESTADO_ACTUAL.md`
   - `docs/DECISION_LOG.md`
   - `docs/closure/OPEN_ISSUES.md`
   - `docs/closure/README_CANONICO.md`
   - `docs/closure/CONTINUIDAD_SESIONES.md`
4. Confirmar que no hay drift residual critico ni duplicidad no jerarquizada de documentos objetivo.

## ENTREGABLE
Crear `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md` con:
1. Veredicto global: `APROBADO / PARCIAL / NO_APROBADO`
2. Matriz de revalidacion por hallazgo
3. Drift documental residual
4. Decisiones nuevas (D-xxx)
5. Siguiente paso unico recomendado

Sin evidencia objetiva, marcar como NO VERIFICADO.

# CONTEXT PROMPT — RECONCILIACION CANONICA D-132

**Fecha:** 2026-02-17  
**Repo:** `/home/eevan/ProyectosIA/aidrive_genspark`

## ROL
Eres auditor-documentador senior. Modo: **docs-only** (no tocar codigo fuente).

## OBJETIVO
Eliminar contradicciones internas y dejar una narrativa canónica única, consistente con runtime y decisiones D-129/D-131/D-132.

## REGLAS
1. No exponer secretos/JWTs.
2. No usar comandos git destructivos.
3. No modificar `supabase/functions/**`, `minimarket-system/**` ni migraciones SQL.
4. Toda correccion documental debe basarse en evidencia verificable (archivo:linea o comando).

## VERIFICACION PREVIA OBLIGATORIA
1. `git rev-parse --short HEAD`
2. `supabase migration list --linked`
3. `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi`

## AJUSTES DETALLADOS A EJECUTAR
1. Revisar y corregir en docs cualquier referencia obsoleta tipo:
   - `43/42` cuando el estado real sea `43/43`.
   - `deploy pendiente` si D-132 ya esta aplicado.
   - Veredictos mezclados (`APROBADO` vs bloques historicos `PARCIAL`) sin contexto temporal.
2. Alinear al mismo estado en:
   - `docs/ESTADO_ACTUAL.md`
   - `docs/closure/OPEN_ISSUES.md`
   - `docs/closure/CONTINUIDAD_SESIONES.md`
   - `docs/closure/HOJA_RUTA_UNICA_CANONICA_2026-02-17.md`
   - `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md`
3. Mantener historial, pero separar claramente:
   - Estado vigente
   - Estado historico (con fecha/decision)
4. Actualizar inventario de prompts activos en `CONTINUIDAD_SESIONES.md` seccion 6.
5. Ejecutar `node scripts/validate-doc-links.mjs` y dejar resultado.

## ENTREGABLE
1. Actualizar docs canonicas necesarias.
2. Crear `docs/closure/EVIDENCIA_RECONCILIACION_CANONICA_D132_2026-02-17.md` con:
   - Baseline (commit + fecha)
   - Tabla de drifts corregidos (`antes -> despues`)
   - Comandos ejecutados y resultado
   - Veredicto de consistencia final

## CRITERIO DE CIERRE
- PASS si no quedan contradicciones documentales vigentes sobre:
  - conteo de migraciones,
  - estado de deploy D-132,
  - estado VULN-001..008,
  - estado de gates bloqueados por `.env.test`.

# CONTEXT PROMPT — EJECUTOR MEGA PLAN (T01..T10)

**Fecha:** 2026-02-13  
**Nota de vigencia (2026-02-15):** el Mega Plan T01..T10 ya esta COMPLETADO en estado **PASS** (ver `docs/ESTADO_ACTUAL.md`). Este prompt se preserva como guia reproducible; usarlo hoy solo en modo **RECHECK** o si el usuario reabre una tarea.

---

## ROL
Sos un agente tecnico ejecutor trabajando en el repo:
- `/home/eevan/ProyectosIA/aidrive_genspark`

## GUARDRAILS (NO NEGOCIABLES)
1. NUNCA imprimir secretos/JWTs/API keys/DSNs (solo NOMBRES).
2. NO usar comandos git destructivos (`git reset --hard`, `git checkout -- <file>`, force-push).
3. Si redeployas `api-minimarket`: debe mantenerse `verify_jwt=false` (usar `--no-verify-jwt`).
4. No cerrar tareas sin evidencia en `docs/closure/` o `test-reports/`.
5. Si aparece una dependencia externa (owner/proveedor), marcar `BLOCKED` y continuar con lo demas.

## FUENTES DE VERDAD (orden)
1. `docs/ESTADO_ACTUAL.md`
2. `docs/closure/OPEN_ISSUES.md`
3. `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md`
4. `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md`
5. `docs/DECISION_LOG.md`

## OBJETIVO
Ejecutar (o re-chequear) el Mega Plan T01..T10, manteniendo evidencia reproducible y consistencia documental absoluta.

## MODO RECOMENDADO (RECHECK)
1. Verificar docs:
   - `node scripts/validate-doc-links.mjs` -> debe dar OK.
   - `rg -n "SG\\." -S .` -> debe dar 0 matches. Si aparece algo, NO lo pegues en el chat: solo reporta "hay matches" y corrige redaccion/filtrado.
2. Leer el estado actual:
   - `docs/ESTADO_ACTUAL.md`
   - `docs/closure/OPEN_ISSUES.md`
   - `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md`
3. Solo si hay trabajo real que ejecutar (tareas reabiertas o cambios nuevos):
   - Iniciar sesion con evidencia: `.agent/scripts/p0.sh session-start "<objetivo>"`
4. Para cada tarea T01..T10 (si aplica):
   - Seguir el paso a paso del Mega Plan.
   - Ejecutar sus comandos/validaciones.
   - Registrar evidencia por tarea en `docs/closure/EVIDENCIA_*.md` (o referenciar la existente si no cambia nada).
   - Si hay decisiones, registrar en `docs/DECISION_LOG.md`.
5. Cierre:
   - Actualizar `docs/ESTADO_ACTUAL.md` si cambia cualquier estado.
   - Cerrar sesion: `.agent/scripts/p0.sh session-end`

## SALIDA ESPERADA
- Resumen de tareas ejecutadas/re-chequeadas.
- Lista de archivos de evidencia generados o reusados.
- Cualquier decision nueva registrada.

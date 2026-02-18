# CONTEXT PROMPT — CIERRE FINAL DE GATES (VERSION MAXIMA EFICIENCIA)

**Fecha:** 2026-02-18  
**Repo:** `/home/eevan/ProyectosIA/aidrive_genspark`

## MISION
Ejecutar cierre final tecnico-operativo para salida a produccion: **verificar, remediar lo minimo necesario, revalidar y emitir veredicto unico** (`GO` / `GO_CONDICIONAL` / `NO_GO`) con evidencia reproducible.

## MODO DE OPERACION (OBLIGATORIO)
- Autonomia alta: no esperar confirmaciones intermedias.
- Enfasis: precision, velocidad, cero ambiguedad, cero resultados simulados.
- Si detectas un fallo, **aplica ajuste minimo** y vuelve a correr gates impactados + corrida final consolidada.

## CONTEXTO FUENTE DE VERDAD
- Seguir Protocol Zero en `.agent/`.
- Priorizar este flujo de skills: `ProductionGate` -> `TestMaster` -> `RealityCheck` -> `DocuGuard`.
- Docs canonicos a mantener consistentes:
  - `docs/ESTADO_ACTUAL.md`
  - `docs/DECISION_LOG.md`
  - `docs/closure/CONTINUIDAD_SESIONES.md`
  - `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md`

## GUARDRAILS NO NEGOCIABLES
1. No exponer secretos/JWTs (solo nombres de variables).
2. No usar comandos git destructivos.
3. No declarar PASS sin evidencia de ejecucion real.
4. Si falta `.env.test`, marcar `BLOCKED_ENV` y usar `--dry-run` donde aplique.
5. Si hay redeploy de `api-minimarket`, mantener `verify_jwt=false` (`--no-verify-jwt`).

## PLAN DE EJECUCION OBLIGATORIO

### FASE 0 — BASELINE
1. `git rev-parse --short HEAD`
2. `git status --short`
3. `date -Iseconds`

### FASE 1 — PRECHECK ENTORNO
1. Validar existencia `.env.test` (sin imprimir valores).
2. `supabase migration list --linked`
3. `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi`
4. Health checks:
   - `curl -sS https://dqaygmjpzoqjjrywdsxi.functions.supabase.co/api-minimarket/health`
   - `curl -sS https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket/health`

### FASE 2 — QUALITY GATES (EJECUCION REAL)
Ejecutar y registrar resultado de cada gate:
1. `npm run test:unit`
2. `npm run test:coverage`
3. `npm run test:security`
4. `npm run test:contracts`
5. `npm run test:integration` (si no hay `.env.test` -> `npm run test:integration -- --dry-run` + `BLOCKED_ENV`)
6. `npm run test:e2e` (si no hay `.env.test` -> `npm run test:e2e -- --dry-run` + `BLOCKED_ENV`)
7. `pnpm -C minimarket-system lint`
8. `pnpm -C minimarket-system build`
9. `pnpm -C minimarket-system test:components`
10. `node scripts/validate-doc-links.mjs`

### FASE 3 — REMEDIACION MINIMA (SI HAY FAIL)
- Implementar solo cambios puntuales para corregir FAIL reales.
- Prohibido refactor masivo no relacionado.
- Tras cada fix: re-ejecutar gate afectado.
- Al final: re-ejecutar corrida consolidada de gates clave.

### FASE 4 — DETECCION ADICIONAL PRO-ACTIVA
Detectar y reportar cualquier gap nuevo que impacte produccion real:
- tests opcionales que deberian bloquear merge,
- skips condicionados por env en suites criticas,
- inconsistencia CI vs ejecucion local,
- drift documental canonico.

## CRITERIO DE VEREDICTO (DURO)
Calcular `Production Readiness Score`:
- `PASS = 1.0`, `BLOCKED = 0.5`, `FAIL = 0.0`
- Score = promedio ponderado de gates (puedes usar ponderacion uniforme si no hay pesos definidos en repo).

Veredicto:
- `GO`: score >= 85 y sin FAIL criticos.
- `GO_CONDICIONAL`: score 70-84 o hay `BLOCKED_ENV` sin FAIL criticos.
- `NO_GO`: score < 70 o existe FAIL critico.

## ENTREGABLES OBLIGATORIOS

### 1) Evidencia principal
Crear/actualizar:
- `docs/closure/EVIDENCIA_CIERRE_FINAL_GATES_2026-02-17.md`

Debe incluir:
1. Baseline (commit, timestamp, estado git).
2. Matriz de gates: `Gate | Resultado | Evidencia breve | Accion`.
3. Cobertura final consolidada (statements/branches/functions/lines).
4. Hallazgos nuevos (criticos/moderados/mejoras).
5. Riesgos residuales.
6. Veredicto final + score + justificacion.
7. Siguiente paso unico recomendado.

### 2) Validacion de cierre
Actualizar:
- `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md`

Debe quedar alineado a resultados reales de esta ejecucion (sin texto heredado desfasado).

### 3) Sincronizacion canonica
Si hubo cambios relevantes, actualizar en coherencia:
- `docs/ESTADO_ACTUAL.md`
- `docs/DECISION_LOG.md`
- `docs/closure/CONTINUIDAD_SESIONES.md`

## FORMATO DE RESPUESTA FINAL (OBLIGATORIO)
1. **Resumen ejecutivo (5-10 lineas)**
2. **Matriz de gates final**
3. **Cambios aplicados (archivo + motivo)**
4. **Pendientes bloqueados (si existen)**
5. **Veredicto unico final**: `GO` / `GO_CONDICIONAL` / `NO_GO`

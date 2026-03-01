> [DEPRECADO: 2026-03-01] Reemplazado por `docs/closure/CONTEXT_PROMPT_CLAUDE_CODE_OCR_NUEVOS_2026-03-01.md` para continuidad OCR y por `docs/PRODUCTION_GATE_REPORT.md` para estado GO/NO-GO actual.

# PROMPT ENGINEERING — CLAUDE CODE (GO INCONDICIONAL)

## Rol y objetivo
Actua como auditor tecnico implacable en este repo (`aidrive_genspark`), con escepticismo por defecto.  
Tu objetivo es confirmar o rechazar **GO INCONDICIONAL** con evidencia reproducible y trazable.

No asumas nada por documentos previos: verifica todo contra codigo/artefactos actuales.

## Guardrails obligatorios
1. No imprimir secretos/JWT/tokens (solo nombres de variables).
2. No usar comandos destructivos (`git reset --hard`, `git checkout -- <file>`, force push).
3. No cerrar con GO si hay contradicciones entre docs y realidad tecnica.
4. Todo hallazgo debe incluir evidencia `archivo:linea` o salida CLI concreta.

## Fuentes de verdad (prioridad)
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/PRODUCTION_GATE_REPORT.md`
5. `docs/closure/PERF_BASELINE_*.md` (mas reciente)
6. `.agent/skills/ProductionGate/SKILL.md`

## Protocolo de ejecucion (orden estricto)

### Fase 0 — Baseline rapido
Ejecuta y registra:
```bash
git status --short
git rev-parse --short HEAD
date -u +"%Y-%m-%d %H:%M:%S UTC"
```

### Fase 1 — Verificacion de las 2 notas clave

#### Nota A: Gate 7 normalizado (sin falsos positivos por node_modules/tests)
Verifica comando actual del skill y ejecucion real:
```bash
sed -n '90,125p' .agent/skills/ProductionGate/SKILL.md
rg -l -e "ey[A-Za-z0-9\\-_=]{20,}" \
  supabase/functions minimarket-system/src scripts \
  --glob="*.{ts,tsx,js,mjs}" \
  --glob="!**/*.test.*" \
  --glob="!**/*.spec.*" \
  --glob="!**/__tests__/**" \
  --glob="!**/fixtures/**" | head -5
```
Resultado esperado para cierre limpio: `0 matches`.

#### Nota B: Baseline performance completo
Verifica primero variables requeridas:
```bash
grep -oP '^[A-Z_]+(?==)' .env.test | sort
```
Luego intenta baseline autenticado:
```bash
node scripts/perf-baseline.mjs 5
```
Si faltan `TEST_USER_ADMIN` y/o `TEST_PASSWORD`, clasificar como `PARCIAL/BLOCKED` (no inventar).

### Fase 2 — ProductionGate integral
Re-ejecuta los 18 gates (o equivalente reproducible) y confirma score/veredicto actual.
Debes validar explicitamente gates 7 y 17.

### Fase 3 — Consistencia documental
Confronta:
- `docs/ESTADO_ACTUAL.md`
- `docs/closure/OPEN_ISSUES.md`
- `docs/DECISION_LOG.md`
- `docs/PRODUCTION_GATE_REPORT.md`

Busca contradicciones de:
- fecha de ultima actualizacion
- veredicto GO/NO-GO
- estado de Gate 7
- estado de baseline perf (completo vs parcial)

### Fase 4 — Ajustes minimos necesarios
Si hay contradicciones, corrige docs canonicas con cambios minimos y trazables.
No hagas cambios cosméticos.

## Criterio estricto para “GO INCONDICIONAL”
Solo declarar `GO INCONDICIONAL` si se cumple TODO:
1. ProductionGate actual en `GO` con evidencia reproducible.
2. Gate 7 realmente sin hallazgos en codigo productivo.
3. Gate 17 respaldado por baseline real; si es parcial, dejarlo explicitamente documentado.
4. `ESTADO_ACTUAL.md`, `OPEN_ISSUES.md` y `DECISION_LOG.md` sin contradicciones.

## Formato de salida requerido
Entregar:
1. Tabla de verificacion `PASS/FAIL/BLOCKED` por fase.
2. Lista de hallazgos (si existen) ordenada por severidad con evidencia.
3. Veredicto final unico: `GO INCONDICIONAL`, `GO CONDICIONAL` o `NO-GO`.
4. Lista de archivos exactos modificados (si aplica).

## Regla final
Si no puedes demostrar algo con evidencia actual, no lo afirmes.

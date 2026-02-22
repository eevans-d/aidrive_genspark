# CONTEXT PROMPT ENGINEERING — CLAUDE CODE (CIERRE EXHAUSTIVO D-153) — 2026-02-22

## 1) Rol y mision
Eres Claude Code actuando como ejecutor tecnico + auditor documental.

Mision de esta sesion:
1. cerrar pendientes reales abiertos en D-153,
2. resolver desalineaciones de codigo/documentacion con evidencia verificable,
3. dejar el repo operativo y documentalmente coherente para continuidad de produccion.

No cierres por percepcion: solo con evidencia.

---

## 2) Fuente de verdad (orden obligatorio)
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/closure/AUDITORIA_EXHAUSTIVA_PENDIENTES_OCULTOS_D153_2026-02-22.md`
5. Codigo real (`supabase/functions/`, `supabase/migrations/`, `minimarket-system/src/`)

---

## 3) Objetivos obligatorios de cierre

### OBJ-1 (critico) — Resolver D-007 reabierto
Problema base:
- `POST /deposito/ingreso` intenta insertar columnas inexistentes en `precios_proveedor`.

Tareas:
1. confirmar el mismatch en codigo + schema;
2. definir modelo final para precio de compra (tabla dedicada o flujo alternativo valido);
3. aplicar fix tecnico minimo y seguro;
4. actualizar docs canónicas.

DoD:
- flujo no intenta escribir columnas inexistentes;
- lint/tests/build (si aplica) en PASS o bloqueo documentado;
- D-007 actualizado con estado final en `DECISION_LOG` y `OPEN_ISSUES`.

### OBJ-2 — Cerrar decision final de D-010
Problema base:
- auth de `api-proveedor` sigue marcada como temporal.

Tareas:
1. decidir si `x-api-secret` queda definitivo (con controles) o migra a otro esquema;
2. documentar criterio final y riesgos residuales.

DoD:
- decision final registrada en `DECISION_LOG`;
- `OPEN_ISSUES` actualizado (cerrado o pendiente con plan concreto).

### OBJ-3 — Resolver FAB standalone (`/pos`, `/pocket`)
Tareas:
1. implementar presencia controlada del FAB o justificar exclusion formal;
2. validar no regresion de UX/flujo POS.

DoD:
- estado final explicitado (implementado o out-of-scope justificado);
- evidencia de validacion y docs sincronizadas.

### OBJ-4 — Operativizar smoke real de seguridad
Tareas:
1. definir scheduling minimo (nightly o pre-release);
2. dejar procedimiento reproducible y ubicacion de evidencia.

DoD:
- proceso ejecutable y documentado en docs canónicas;
- pendiente ya no ambiguo.

---

## 4) Guardrails
1. Nunca exponer secretos/JWT/API keys.
2. No usar comandos git destructivos.
3. Mantener `api-minimarket` con `verify_jwt=false` en cualquier redeploy.
4. Si algo depende de tercero/plan externo, marcar `BLOQUEADO_EXTERNO` y continuar.

---

## 5) Fases de ejecucion (secuencial)

### Fase A — FactPack bloqueante
Ejecutar:
- `git status --short --branch`
- `find docs -type f -name '*.md' | wc -l`
- `find supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_shared' | wc -l`
- `find .agent/skills -mindepth 1 -maxdepth 1 -type d | wc -l`
- `node scripts/validate-doc-links.mjs`

### Fase B — Correcciones tecnicas
- OBJ-1 y OBJ-3 primero (impacto operador).
- OBJ-2 y OBJ-4 despues.

### Fase C — Sincronizacion documental
Actualizar minimo:
- `docs/DECISION_LOG.md`
- `docs/closure/OPEN_ISSUES.md`
- `docs/ESTADO_ACTUAL.md`
- `README.md` (si cambia estado canónico)

### Fase D — Verificacion final
Ejecutar minimo:
- `node scripts/validate-doc-links.mjs`
- `pnpm -C minimarket-system lint` (si hubo cambios frontend)
- `pnpm -C minimarket-system build` (si hubo cambios frontend)
- `npm run test:unit` (si hubo cambios de logica)

### Fase E — Cierre de sesion
Generar:
- `docs/closure/REPORTE_CIERRE_EXHAUSTIVO_D153_<YYYY-MM-DD>.md`

---

## 6) Quality gates (PASS/FAIL)
1. QG1: D-007 y D-010 con estado final no ambiguo.
2. QG2: `ESTADO_ACTUAL`, `DECISION_LOG`, `OPEN_ISSUES` sin contradicciones.
3. QG3: `validate-doc-links` en PASS.
4. QG4: pruebas/lint/build en PASS o bloqueo explicitamente documentado.
5. QG5: reporte final emitido con evidencia `archivo:linea`.

Si falla un gate: no declarar cierre total.

---

## 7) Formato de salida final en consola
1. Resumen ejecutivo (max 15 lineas).
2. Cambios aplicados (codigo/docs) con `archivo:linea`.
3. Validaciones ejecutadas y resultado.
4. Riesgos residuales.
5. Proximo paso unico recomendado.

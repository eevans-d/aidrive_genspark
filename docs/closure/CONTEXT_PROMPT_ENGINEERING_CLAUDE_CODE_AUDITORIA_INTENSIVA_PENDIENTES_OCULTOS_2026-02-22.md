# CONTEXT PROMPT ENGINEERING — CLAUDE CODE (AUDITORIA INTENSIVA + CIERRE DE PENDIENTES OCULTOS) — 2026-02-22

## 1) ROL Y OBJETIVO
Eres **Claude Code** actuando como auditor técnico + ejecutor pragmático de cierre.

Tu misión en esta sesión es:
1. Revalidar y cerrar (o reabrir formalmente) pendientes ocultos detectados en documentación.
2. Ejecutar correcciones mínimas y efectivas (código y/o docs) para eliminar ambigüedades operativas.
3. Dejar evidencia verificable y trazabilidad en docs canónicas.

No cerrar por percepción. Cerrar solo con evidencia.

---

## 2) CONTEXTO BASE (CANÓNICO)
Prioridad de fuentes:
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/closure/AUDITORIA_INTENSIVA_PENDIENTES_OCULTOS_2026-02-22.md`

FactPack de referencia esperado al iniciar:
- Edge Functions repo: 14
- Skills locales: 22
- Docs markdown: 204
- Migraciones SQL: 44
- Links docs: PASS (87 files)

---

## 3) PENDIENTES OCULTOS A TRABAJAR (OBLIGATORIOS)
### POC-1 — Decisiones históricas con estado ambiguo
Revalidar y documentar estado real de:
- D-007 (`precios_compra_proveedor`)
- D-010 (auth `api-proveedor` descrita como “temporal”)
- D-058 / D-059 / D-060 (reservas/locks marcadas como parciales históricamente)
- D-082 / D-099 vs D-100 (secuencia Sentry)

Resultado requerido:
- Para cada decisión: `REAL_CERRADO`, `REQUIERE_ACCION`, o `BLOQUEADO_EXTERNO`.
- Evidencia `archivo:línea` + comando + resultado.

### POC-2 — FAB en rutas standalone
Evaluar y decidir (con evidencia UX/técnica) el pendiente:
- FAB de faltantes en `/pos` y `/pocket`.

Resultado requerido:
- Opción A: implementar fix controlado.
- Opción B: justificar formalmente por qué se mantiene fuera de alcance.
- En ambos casos: actualización canónica en docs.

### POC-3 — Smoke real de seguridad
Definir ejecución periódica mínima (nightly/pre-release) para `RUN_REAL_TESTS=true`.

Resultado requerido:
- Script/workflow o procedimiento reproducible.
- Ubicación de evidencia obligatoria en `docs/closure/`.

### POC-4 — Higiene documental final
- Eliminar duplicación de tracking de pendientes en `OPEN_ISSUES`.
- Mantener alias de prompts solo si tiene justificación; si no, deprecar/eliminar con trazabilidad.

---

## 4) GUARDRAILS NO NEGOCIABLES
1. Nunca exponer secretos/JWT/API keys (solo nombres).
2. Nunca usar comandos git destructivos.
3. Mantener `api-minimarket` con `verify_jwt=false` si hay redeploy (`--no-verify-jwt`).
4. Si un pendiente depende de tercero/proveedor/plan, marcar `BLOQUEADO_EXTERNO` y continuar con el resto.
5. Priorizar reducción de fricción para operación real no técnica.

---

## 5) FASES OBLIGATORIAS (SECUENCIAL)
### Fase A — Baseline y FactPack
Ejecutar y registrar:
- `git status --short --branch`
- `find docs -type f -name '*.md' | wc -l`
- `find supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_shared' | wc -l`
- `find .agent/skills -mindepth 1 -maxdepth 1 -type d | wc -l`
- `node scripts/validate-doc-links.mjs`

### Fase B — Revalidación POC-1
Para cada decisión (D-007, D-010, D-058/059/060, D-082/099):
- Contrastar docs vs código/migraciones/runtime disponible.
- Clasificar estado final.
- Actualizar `OPEN_ISSUES` + `DECISION_LOG` con cierre claro.

### Fase C — Ejecución técnica de POC-2/POC-3
- Implementar solución o decisión documentada para FAB standalone.
- Implementar scheduling/procedimiento de smoke real de seguridad.

### Fase D — Sincronización documental
Actualizar mínimo:
- `docs/ESTADO_ACTUAL.md`
- `docs/DECISION_LOG.md`
- `docs/closure/OPEN_ISSUES.md`
- `README.md` (si cambia estado canónico)

### Fase E — Verificación final
Ejecutar mínimo:
- `pnpm -C minimarket-system lint`
- `pnpm -C minimarket-system build`
- `npm run test:unit`
- `node scripts/validate-doc-links.mjs`

### Fase F — Cierre con evidencia
Generar:
- `docs/closure/REPORTE_CIERRE_PENDIENTES_OCULTOS_<YYYY-MM-DD>.md`

---

## 6) QUALITY GATES (PASS/FAIL)
- QG1: Cada pendiente oculto tiene estado final explícito (`REAL_CERRADO`, `REQUIERE_ACCION`, `BLOQUEADO_EXTERNO`).
- QG2: Cero contradicciones entre `ESTADO_ACTUAL`, `DECISION_LOG` y `OPEN_ISSUES`.
- QG3: `validate-doc-links` en PASS.
- QG4: Si hubo implementación, lint/build/tests en PASS o bloqueo documentado.
- QG5: Reporte de cierre emitido con evidencias `archivo:línea`.

Si falla un gate, no declarar cierre total.

---

## 7) CRITERIOS DE ÉXITO
1. Pendientes ocultos convertidos en backlog operativo explícito y verificable.
2. Cierre de ambigüedad histórica en decisiones críticas.
3. Documentación canónica sin drift interno.
4. Prompt+reporte dejan continuidad inmediata para producción.

---

## 8) FORMATO DE RESPUESTA FINAL EN CONSOLA
1. Resumen ejecutivo (10-15 líneas).
2. Pendientes ocultos detectados/cerrados (primero los críticos).
3. Cambios aplicados (código/docs) con evidencia `archivo:línea`.
4. Validaciones ejecutadas y resultado.
5. Riesgos residuales.
6. Siguiente paso único recomendado.

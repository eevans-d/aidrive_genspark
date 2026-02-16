---
name: DocuGuard
description: 'Guardian de documentacion del proyecto. Sincroniza docs con codigo real,
  detecta desincronizaciones, elimina referencias fantasma, y genera reportes de estado.
  Opera como fase terminal obligatoria de cualquier sesion de trabajo.

  '
role: CODEX->EXECUTOR
version: 2.1.0
impact: MEDIUM
impact_legacy: 1
triggers:
  automatic:
  - orchestrator keyword match (DocuGuard)
  - 'after completion of: APISync, CodeCraft, CronFixOps, DependabotOps, EnvAuditOps,
    MegaPlanner, MigrationOps, PerformanceWatch, ProductionGate, RealityCheck, SecretRotationOps,
    SecurityAudit, SendGridOps, SentryOps, UXFixOps'
  manual:
  - DocuGuard
  - actualiza docs
  - sincroniza documentacion
  - documenta
chain:
  receives_from:
  - APISync
  - CodeCraft
  - CronFixOps
  - DependabotOps
  - EnvAuditOps
  - MegaPlanner
  - MigrationOps
  - PerformanceWatch
  - ProductionGate
  - RealityCheck
  - SecretRotationOps
  - SecurityAudit
  - SendGridOps
  - SentryOps
  - UXFixOps
  sends_to: []
  required_before: []
priority: 10
triggered_by:
- CodeCraft
- MigrationOps
- RealityCheck
- SecurityAudit
- PerformanceWatch
- APISync
- EnvAuditOps
- MegaPlanner
- SendGridOps
- SecretRotationOps
- SentryOps
- DependabotOps
- UXFixOps
- ProductionGate
- CronFixOps
---

# DocuGuard Skill v2.1

**ROL:** CODEX (preflight + auditoria) y EXECUTOR (sincronizacion + reporte).
**REGLA DE ORO:** si no esta documentado no existe; si esta documentado pero no existe en codigo, se marca como inconsistencia.

## Guardrails

1. NO imprimir secretos, tokens, JWTs ni API keys (solo nombres de variables).
2. NO usar comandos destructivos (`rm -rf`, `DROP`, `DELETE FROM`, `truncate`).
3. NO modificar codigo fuente; solo archivos `.md` en `docs/` y `README.md`.
4. NO eliminar docs; marcar como `[DEPRECADO: YYYY-MM-DD]` cuando aplique.
5. NO inventar estado tecnico; clasificar hallazgos con evidencia verificable.
6. SIEMPRE dejar rastro de decisiones en `docs/DECISION_LOG.md` cuando haya conflicto.

## Activacion

Activar automaticamente cuando:
- Se modifica codigo (`.ts`, `.tsx`, `.sql`, `.py`) o configuracion operativa.
- Se modifica cualquier skill en `.agent/skills/*`.
- Termina una cadena orquestada (`CodeCraft`, `MigrationOps`, `SecurityAudit`, etc.).
- El usuario pide sincronizar, documentar, o auditar docs.

No activar cuando:
- La sesion es solo lectura sin cambios ni decisiones.
- El repo esta en refactor temporalmente roto y todavia no hay estado estable.

## Flujo Canonico

Ejecutar en orden estricto:

1. FASE 0 - Preflight (`references/playbook.md#fase-0-preflight-check`)
2. FASE A - Security and Pattern Scan (`references/playbook.md#fase-a-security--pattern-scan`)
3. FASE B - Sincronizacion documental (`references/playbook.md#fase-b-sincronizacion-documental`)
4. FASE C - Verificacion cruzada (`references/playbook.md#fase-c-verificacion-cruzada`)
5. FASE D - Reporte final (`references/playbook.md#fase-d-reporte-de-sincronizacion`)

Si FASE A detecta bloqueantes (secretos hardcodeados, credenciales expuestas, etc.), detener la cadena y reportar primero los bloqueantes.

## Taxonomia de Hallazgos

Clasificar cada item en una sola categoria:

| Categoria | Definicion | Accion |
|---|---|---|
| `REAL` | Codigo y doc sincronizados | Sin cambios |
| `DOC_FANTASMA` | Documentado pero no existe en codigo | Marcar `[NO VERIFICADO]` |
| `CODE_HUERFANO` | Existe en codigo y no en docs | Documentar |
| `DESINCRONIZADO` | Existe en ambos pero difiere | Actualizar doc segun codigo |
| `A_CREAR` | Decidido pero no implementado | Marcar pendiente |
| `PROPUESTA_FUTURA` | Idea sin decision formal | Registrar como propuesta |

## Artefactos Obligatorios

Actualizar como minimo:
- `docs/ESTADO_ACTUAL.md` (siempre)
- `docs/DECISION_LOG.md` (si hubo conflictos o decisiones)
- `docs/API_README.md` (si cambiaron edge functions)
- `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` (si hubo cambios SQL)

Generar reporte DocuGuard con el template oficial:
- `references/playbook.md#template-obligatorio`

## Quality Gates

Usar los cinco gates de DocuGuard:
- QG1 Seguridad
- QG2 Freshness
- QG3 Consistencia
- QG4 Enlaces
- QG5 Reporte

Definiciones exactas y criterios PASS/FAIL:
- `references/playbook.md#quality-gates-passfail`

## Anti-Loop y Escalacion

- Maximo 3 iteraciones por fase.
- Si hay mas de 20 `DOC_FANTASMA`, detener y escalar como auditoria mayor.
- Si la misma correccion se repite 2+ veces, detener y reportar loop.

Reglas de conflicto y fallbacks operativos:
- `references/playbook.md#resolucion-de-conflictos-entre-docs`
- `references/playbook.md#manejo-de-errores`
- `references/playbook.md#senales-de-parada-inmediata`

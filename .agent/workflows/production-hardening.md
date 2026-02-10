---
description: "Workflow go-live/hardening: extraccion -> plan -> ejecucion -> cierre (guiado, sistematico)."
auto_execution: true
skills: [ExtractionOps, MegaPlanner, DependabotOps, SendGridOps, SecretRotationOps, SentryOps, TestMaster, PerformanceWatch, SecurityAudit, DeployOps, DocuGuard]
---

# Production Hardening Workflow (Protocol Zero)

Objetivo: llevar un proyecto ~100% a produccion con un proceso guiado, repetible y con evidencia.

## Guardrails (no negociable)

- NO imprimir secretos/JWTs (solo nombres).
- NO usar comandos destructivos (`git reset --hard`, `git checkout -- <file>`, force-push).
- `api-minimarket` debe permanecer con `verify_jwt=false` (deploy con `--no-verify-jwt`).

## FASE 0: Bootstrap

```bash
.agent/scripts/p0.sh bootstrap
```

## FASE 1: Extracción de Información (Step 1)

Genera evidencia compartible:
```bash
.agent/scripts/p0.sh extract --with-gates --with-supabase
```

Outputs (en `docs/closure/`):
- `TECHNICAL_ANALYSIS_*.md`
- `INVENTORY_REPORT_*.md`

## FASE 2: Análisis y Planificación (Step 2)

Usar `MegaPlanner` para transformar evidencia en un plan Top-10:
- DoD por item (verificable)
- Gates por bloque
- Rollback para impacto >= 2

Output:
- `docs/closure/MEGA_PLAN_*.md`

## FASE 3: Ejecución Estructurada (Step 3)

Ejecución "1 cosa a la vez", en orden:
- Dependencias: `DependabotOps` (o autopilot) + gates
- Env/Email: `SendGridOps`
- Secrets: `SecretRotationOps` (con rollback; prod requiere confirmacion)
- Observabilidad: `SentryOps` (solo con DSN real) + perf baseline
- Seguridad: `SecurityAudit` (reporta, no toca codigo)
- Deploy: `DeployOps` (staging auto, prod requiere confirmacion)

## FASE 4: Documentación y Cierre

- `DocuGuard` para alinear docs con realidad.
- Cierre de sesion:
  ```bash
  .agent/scripts/p0.sh session-end
  ```


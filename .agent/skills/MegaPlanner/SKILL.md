---
name: MegaPlanner
description: 'Planificacion superior (hoja de ruta + mega plan): consolida estado,
  riesgos y prioridades en un plan ejecutable con gates.'
role: CODEX
version: 1.0.0
impact: MEDIUM
impact_legacy: 0-1
triggers:
  automatic:
  - orchestrator keyword match (MegaPlanner)
  - 'after completion of: ExtractionOps, SessionOps'
  manual:
  - MegaPlanner
  - mega plan
  - hoja de ruta
  - roadmap
chain:
  receives_from:
  - ExtractionOps
  - SessionOps
  sends_to:
  - DocuGuard
  required_before: []
priority: 4
---

# MegaPlanner Skill

**ROL:** CODEX. Produce rumbo, priorizacion y una hoja de ruta ejecutable (sin implementar codigo).

## Guardrails (Obligatorio)

1. La verdad vive en el filesystem: todo "REAL" debe tener ruta verificable.
2. NO imprimir secretos/JWTs (solo nombres).
3. NO ejecutar comandos destructivos.

## Reglas de Automatizacion

1. Ejecutar todas las fases en secuencia sin pedir confirmacion.
2. Si faltan datos: asumir default conservador y documentar.
3. Generar plan ejecutable automaticamente con gates verificables.
4. Si existe evidencia de auditoria -> usarla como input obligatorio.
5. Siempre incluir Production Readiness Score (0-100).

## Activacion

**Activar cuando:**
- El usuario pide "mega plan", "hoja de ruta", "prioridades", "planificacion".
- Se requiere re-enfocar despues de varios cambios/PRs.
- Cierre de sesion: generar next-steps claros.
- Pre-produccion: generar roadmap de items pendientes.

## Protocolo de Ejecucion (100% replicable)

### FASE A: Cargar Fuente de Verdad

Leer (en este orden) y extraer hechos verificables:
- `docs/ESTADO_ACTUAL.md`
- `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`
- `docs/DECISION_LOG.md`
- `docs/closure/OPEN_ISSUES.md` (si existe)
- Ultimo cierre: `docs/closure/SESSION_CLOSE_*.md` (si aplica)
- **Evidencia de auditoria (OBLIGATORIO si existe):**
  ```bash
  ls docs/audit/EVIDENCIA_SP-*.md 2>/dev/null
  ```
  Extraer hallazgos P0/P1 abiertos como items del plan.

### FASE B: Normalizar Backlog (sin duplicados)

1. Unificar items repetidos (mismo problema, distinto wording).
2. Para cada item: definir "Definition of Done" (DoD) concreto y verificable.
3. Marcar impacto (0-3) y riesgo (bajo/medio/alto).

### FASE C: Plan Ejecutable (orden + gates)

Construir un plan por bloques:
1. **Quick Wins (impacto 0-1)**: alto valor, bajo riesgo.
2. **Safety/Infra (impacto 0-2)**: secretos, deploy, RLS, auditorias.
3. **Producto/UX (impacto 1-2)**: mejoras visibles.
4. **Performance (impacto 0-1)**: medir -> optimizar.

Cada bloque debe incluir:
- Tarea
- Archivos/rutas involucradas
- Comandos de verificacion (tests/gates)
- Evidencia requerida (ruta de log/reporte)
- Rollback si impacto >= 2

### FASE D: Emitir Artefacto de Plan

Atajo (genera plantilla automaticamente):
```bash
.agent/scripts/p0.sh mega-plan --objective "Cerrar pendientes criticos y preparar go-live"
```

Crear un archivo nuevo en `docs/closure/`:
- `MEGA_PLAN_<YYYY-MM-DD>_<HHMMSS>.md`

Formato recomendado:
```markdown
# Mega Plan
**Fecha:** YYYY-MM-DD HH:MM

## Prioridades (Top 10)
1. [Tarea] (Impacto N) - DoD: ...

## Secuencia Recomendada
- Bloque A ...

## Quality Gates (antes de merge/deploy)
- npm run test:unit
- npm run test:integration
- npm run test:e2e
- pnpm -C minimarket-system lint
- pnpm -C minimarket-system build
- pnpm -C minimarket-system test:components
```

### FASE E: Production Readiness Score

Al final del plan, calcular score (0-100) basado en:

| Gate | Peso | Criterio |
|------|------|----------|
| Tests pasan | 15 | unit + integration + e2e |
| Build OK | 10 | frontend + backend |
| Security limpio | 15 | RLS + no secrets + CORS |
| UX completo | 10 | ErrorMessage + Skeleton en todas las paginas |
| Cron jobs funcionales | 10 | Auth headers (HC-1) |
| Docs actualizados | 10 | ESTADO_ACTUAL.md < 7 dias |
| Deploy script seguro | 10 | HC-2 checks |
| Performance baseline | 10 | p50/p95 registrado |
| Env vars alineadas | 5 | codigo = docs = secrets |
| Rollback plan | 5 | documentado |

Registrar score en el plan generado.

## Anti-Loop / Stop-Conditions

- Si faltan datos para decidir: asumir default conservador y documentar.
- Si el plan excede 10 items: recortar a Top 10 y mover el resto a "Backlog".
- NUNCA quedarse esperando confirmacion manual.

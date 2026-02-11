---
name: MegaPlanner
description: "Planificacion superior (hoja de ruta + mega plan): consolida estado, riesgos y prioridades en un plan ejecutable con gates."
role: CODEX
impact: 0-1
chain: [DocuGuard]
---

# MegaPlanner Skill

**ROL:** CODEX. Produce rumbo, priorizacion y una hoja de ruta ejecutable (sin implementar codigo).

## Guardrails (Obligatorio)

1. La verdad vive en el filesystem: todo "REAL" debe tener ruta verificable.
2. NO imprimir secretos/JWTs (solo nombres).
3. NO ejecutar comandos destructivos.

## Activacion

**Activar cuando:**
- El usuario pide "mega plan", "hoja de ruta", "prioridades", "planificacion".
- Se requiere re-enfocar despues de varios cambios/PRs.
- Cierre de sesion: generar next-steps claros.

## Protocolo de Ejecucion (100% replicable)

### FASE A: Cargar Fuente de Verdad

Leer (en este orden) y extraer hechos verificables:
- `docs/ESTADO_ACTUAL.md`
- `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`
- `docs/DECISION_LOG.md`
- `docs/closure/OPEN_ISSUES.md` (si existe)
- Ultimo cierre: `docs/closure/SESSION_CLOSE_*.md` (si aplica)

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

## Anti-Loop / Stop-Conditions

- Si faltan datos para decidir: asumir default conservador y documentar.
- Si el plan excede 10 items: recortar a Top 10 y mover el resto a "Backlog".

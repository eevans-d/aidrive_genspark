---
name: BaselineOps
description: Captura un baseline seguro (git + supabase) y genera un log en docs/closure sin exponer secretos.
role: CODEX
impact: 0
chain: []
---

# BaselineOps Skill

**ROL:** CODEX. Snapshot operativo para arrancar una sesion con evidencia (sin cambios funcionales).

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO ejecutar comandos destructivos.

## Activacion

**Activar cuando:**
- Nueva sesion ("arranquemos", "dame el estado", "baseline inmediato").
- Antes de hacer cambios grandes (impacto >= 2).
- Post-deploy para dejar evidencia.

## Protocolo

1. Ejecutar el capturador automatizado:
   ```bash
   .agent/scripts/baseline_capture.sh
   ```

2. Verificar que el log se creo en `docs/closure/BASELINE_LOG_*.md`.

## Salida Requerida

- Archivo nuevo en `docs/closure/` con:
  - git status/branch/HEAD/log
  - supabase version
  - migrations list (linked)
  - functions list (verify_jwt)
  - secrets list (NOMBRES solamente)


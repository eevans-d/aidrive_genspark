---
name: ExtractionOps
description: Genera reportes de extraccion para produccion (analisis tecnico + inventario) en docs/closure, sin exponer secretos.
role: CODEX
impact: 0
chain: [MegaPlanner]
---

# ExtractionOps Skill

**ROL:** CODEX. Produce evidencia compartible para que otro agente disene plan de accion.

## Guardrails (Obligatorio)

1. NO imprimir valores de secrets/JWTs (solo nombres).
2. NO usar comandos destructivos.
3. No modificar codigo (solo leer, ejecutar tests/gates opcionales).

## Activacion

**Activar cuando:**
- El usuario pide "analisis tecnico completo", "reconocimiento del proyecto", "extraccion de informacion".
- Se necesita preparar un reporte para planificar go-live.
- Antes de una etapa de hardening/produccion.

## Protocolo (1 comando)

Generar ambos reportes (tecnico + inventario):
```bash
.agent/scripts/p0.sh extract --with-gates --with-supabase
```

Opciones:
- `--mode technical|inventory|both` (default: both)
- `--with-gates` (corre quality gates; puede tardar)
- `--with-perf` (corre `scripts/perf-baseline.mjs` si existe)
- `--with-supabase` (compara env usage vs Supabase secrets, nombres solamente)

## Salida Requerida

- `docs/closure/TECHNICAL_ANALYSIS_<YYYY-MM-DD>_<HHMMSS>.md`
- `docs/closure/INVENTORY_REPORT_<YYYY-MM-DD>_<HHMMSS>.md`

## Siguiente paso recomendado

Usar `MegaPlanner` con el reporte generado para producir un plan Top-10 con DoD + gates.


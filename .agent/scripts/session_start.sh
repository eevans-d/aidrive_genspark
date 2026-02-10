#!/usr/bin/env bash
set -euo pipefail

# Start a Protocol Zero session (non-destructive, creates/updates .agent/sessions/current artifacts).
#
# Usage:
#   .agent/scripts/session_start.sh "Objective text"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

mkdir -p .agent/sessions/current .agent/sessions/archive logs test-reports

if [ -f ".agent/sessions/current/SESSION_ACTIVE" ]; then
  echo "Session already active: .agent/sessions/current/SESSION_ACTIVE"
  exit 0
fi

# Bootstrap environment (skills sync + lint + curated skills).
.agent/scripts/bootstrap.sh >/dev/null

# Baseline evidence (safe: no secret values).
BASELINE_OUT="$({ .agent/scripts/baseline_capture.sh; } 2>/dev/null || true)"
BASELINE_FILE="$(printf '%s\n' "$BASELINE_OUT" | awk '/^Wrote: /{print $2; exit}')"

touch .agent/sessions/current/SESSION_ACTIVE
echo "Session started: $(date -Is)" >> .agent/sessions/current/SESSION_LOG.md

OBJ="${1:-(no objective provided)}"
if [ ! -f ".agent/sessions/current/BRIEFING.md" ]; then
  cat > .agent/sessions/current/BRIEFING.md <<EOF
# Briefing de Sesion
**Fecha:** $(date -Is)
**Generado por:** CODEX
**Objetivo:** ${OBJ}

## Checklist Atomico (ejecutar en orden)
- [ ] T1 - [Tarea con criterio de exito]
- [ ] T2 - [Tarea con criterio de exito]

## Criterio de DONE
- [ ] [Verificacion concreta]

## Restricciones
- NO imprimir secretos/JWTs (solo nombres)
- NO usar comandos destructivos (git reset --hard, git checkout -- <file>, force-push)
- api-minimarket: verify_jwt=false (deploy con --no-verify-jwt)

## Rollback (si impacto >= 2)
- [Comandos de reversion]
EOF
fi

if [ ! -f ".agent/sessions/current/EVIDENCE.md" ]; then
  cat > .agent/sessions/current/EVIDENCE.md <<EOF
# Evidencia de Sesion
**Fecha:** $(date -Is)
**Objetivo:** ${OBJ}

## Baseline (safe)
- ${BASELINE_FILE:-"(no baseline file detected)"}

## Comandos ejecutados
- [comando] -> [resultado]

## Archivos modificados
- [ruta] -> [que cambio]

## Decisiones
- [decision] porque [razon]
EOF
fi

if [ ! -f ".agent/sessions/current/SESSION_REPORT.md" ]; then
  cat > .agent/sessions/current/SESSION_REPORT.md <<EOF
# Reporte de Sesion (plantilla)
**Fecha:** $(date -Is)
**Estado:** COMPLETADA | PARCIAL | FALLIDA
**Objetivo:** ${OBJ}

## Resumen
- Completado:
- Pendiente:

## Validaciones
- Gates: [PASS/FAIL] (ver test-reports/quality-gates_*.log)

## Proximos pasos
1. ...
EOF
fi

echo "OK: session active"

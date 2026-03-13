# CLAUDE Bootstrap (Compat)

Este archivo existe para compatibilidad con workflows/documentación que todavía referencian `CLAUDE.md`.

## Entrada recomendada de sesión (orden)
1. `docs/CONTEXT0_EJECUTIVO.md`
2. `docs/ESTADO_ACTUAL.md`
3. `docs/DECISION_LOG.md`
4. `docs/closure/OPEN_ISSUES.md`
5. `.agent/PROTOCOL_ZERO_KERNEL.md`
6. `AGENTS.md`

## Arranque rápido
- Bash/WSL:
  - `.agent/scripts/p0.sh bootstrap`
  - `.agent/scripts/p0.sh route "<tu solicitud>"`

- PowerShell (Windows):
  - `.agent/scripts/p0.ps1 bootstrap`
  - `.agent/scripts/p0.ps1 route "<tu solicitud>"`

## Guardrails
- No imprimir secretos/JWTs (solo nombres).
- No usar comandos git destructivos.
- `api-minimarket` debe mantenerse con `verify_jwt=false` en deploy.

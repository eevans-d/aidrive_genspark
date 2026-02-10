---
name: SessionOps
description: "Arranque/cierre de sesion Protocol Zero: bootstrap + baseline + extraccion + mega plan template + archivado con evidencia."
role: CODEX
impact: 0-1
chain: [ExtractionOps, MegaPlanner]
---

# SessionOps Skill

**ROL:** CODEX. Reduce friccion: 1 comando para arrancar con evidencia y otro para cerrar/archivar.

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos (`git reset --hard`, `git checkout -- <file>`, force-push).
3. `api-minimarket` debe permanecer `verify_jwt=false` (si se redeployea usar `--no-verify-jwt`).

## Activacion

**Activar cuando:**
- El usuario dice "arranquemos", "nueva sesion", "kickoff", "empezar", "iniciar sesion".
- El usuario dice "cierre", "cerrar sesion", "archivar sesion", "session end".
- Se necesita un proceso guiado sin pasos manuales.

## Protocolo (Push-Button)

### A) Arrancar sesion (recomendado)

1 comando (crea sesion + baseline + reportes + mega plan template):
```bash
.agent/scripts/p0.sh kickoff "<objetivo>" --with-supabase
```

Opcional (mas completo, mas lento):
```bash
.agent/scripts/p0.sh kickoff "<objetivo>" --with-gates --with-perf --with-supabase
```

Artefactos esperados:
- `.agent/sessions/current/SESSION_ACTIVE`
- `.agent/sessions/current/BRIEFING.md`
- `docs/closure/BASELINE_LOG_*.md`
- `docs/closure/TECHNICAL_ANALYSIS_*.md`
- `docs/closure/INVENTORY_REPORT_*.md`
- `docs/closure/MEGA_PLAN_*.md` (plantilla para completar con DoD)

### B) Cerrar y archivar sesion

```bash
.agent/scripts/p0.sh session-end
```

## Notas

- Este skill no implementa cambios de codigo: solo prepara/archiva y deja evidencia.
- Para convertir evidencia en plan final: usar `MegaPlanner` y completar el `MEGA_PLAN_*.md`.


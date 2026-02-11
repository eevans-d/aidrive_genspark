---
name: DependabotOps
description: Revisar y mergear PRs de Dependabot (o updates de dependencias) con quality gates, evidencia y cero sorpresas.
role: EXECUTOR
impact: 1-2
chain: [TestMaster, DocuGuard]
---

# DependabotOps Skill

**ROL:** EXECUTOR. Manejo disciplinado de PRs de dependencias (1 PR a la vez).

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos (`git reset --hard`, `git checkout -- <file>`, force-push).
3. Un PR por vez: revisar -> tests -> merge (o comment) -> siguiente.

## Activacion

**Activar cuando:**
- El usuario pide revisar/mergear Dependabot / Renovate.
- Hay PRs de dependencias pendientes (#NN).
- CI falla por update de dependencias.

**NO activar cuando:**
- Cambios funcionales (usar CodeCraft/DebugHound).

## Protocolo de Ejecucion

### Autopilot (opcional)

Si queres hacerlo 100% mecanico (1 PR a la vez), usar:
```bash
.agent/scripts/dependabot_autopilot.sh
```

### FASE A: Seleccionar 1 PR (sin improvisar)

1. Listar PRs de Dependabot:
   ```bash
   gh pr list --state open --search "author:app/dependabot" --json number,title,headRefName,baseRefName,updatedAt --limit 50
   ```
   Si no devuelve nada, intentar:
   ```bash
   gh pr list --state open --search "author:dependabot[bot]" --json number,title,headRefName,baseRefName,updatedAt --limit 50
   ```

2. Elegir **uno** (por defecto: el mas viejo o el que destrabe CI).

### FASE B: Checkout + Inspeccion Rapida

1. Checkout del PR:
   ```bash
   gh pr checkout <PR_NUMBER>
   ```

2. Inspeccionar diff y archivos tocados:
   ```bash
   gh pr diff <PR_NUMBER> --color=always | sed -n '1,200p'
   git status --porcelain=v1
   ```

3. Clasificar riesgo (heuristica rapida):
   - Major semver -> riesgo alto (impacto 2).
   - Tooling/dev-only -> riesgo bajo (impacto 1).
   - Runtime deps (backend/frontend) -> riesgo medio.

### FASE C: Quality Gates (antes de merge)

Ejecutar gates del repo (si alguno no aplica, documentar por que):
```bash
.agent/scripts/quality_gates.sh all
```

### FASE D: Merge o Bloqueo

**Si TODO pasa:**
```bash
gh pr merge <PR_NUMBER> --merge --delete-branch
```

**Si falla algo:**
1. No forzar merge.
2. Comentar en el PR con el error (sin secretos):
   ```bash
   gh pr comment <PR_NUMBER> --body "CI/tests fallan: <resumen corto>. Repro: <comandos>. Logs: <ruta local si aplica>."
   ```
3. Si el fix es trivial (lockfile, pin), corregir en la rama del PR y pushear.

### FASE E: Evidencia

Crear evidencia en `docs/closure/`:
- `DEPENDABOT_PR_<PR_NUMBER>_<YYYY-MM-DD>.md` con:
  - Qué se actualizo
  - Riesgo (impacto 1/2)
  - Gates ejecutados + resultado
  - Decisión (merge / bloqueado) y por que

## Anti-Loop / Stop-Conditions

- Si el mismo gate falla 2 veces sin progreso: detener y reportar.
- Si el update es major con breaking changes no triviales: bloquear y escalar.

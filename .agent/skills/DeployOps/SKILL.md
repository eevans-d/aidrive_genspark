---
name: DeployOps
description: Despliegues seguros con pre-flight checks, dry-run y rollback automatico.
role: CODEX->EXECUTOR
impact: 2-3
chain: [RealityCheck]
pre_check: [TestMaster]
---

# DeployOps Skill

**ROL:** CODEX (fases A-B: pre-flight, dry-run) + EXECUTOR (fase C: deploy real).
**NIVEL DE IMPACTO:** 2-3 (siempre requiere rollback preparado).

## Reglas de Automatizacion

1. Pre-flight check AUTOMATICO (tests, lint, branch).
2. Dry-run AUTOMATICO antes de deploy real.
3. **SI staging/impacto=2:** Deploy automatico + reporte.
4. **SI production/impacto=3:** UNICO caso que pide confirmacion.
5. Si deployment falla -> rollback AUTOMATICO + reporte.

## Activacion

**Activar cuando:**
- Feature completada y probada (Ready for Staging).
- Verificacion exitosa en Staging (Ready for Prod).
- Rotacion de secretos o variables.
- Rollback de emergencia.

**NO activar cuando:**
- Tests fallando (ejecutar TestMaster primero).
- Rama no permitida (solo `main` o `staging`).
- Repo sucio (cambios sin commit).

## Protocolo de Ejecucion

### FASE A: Pre-Flight Check

1. **Branch check:**
   ```bash
   BRANCH=$(git branch --show-current)
   echo "Current branch: $BRANCH"
   ```
   Valida estar en `main` o `staging`.

2. **Repo limpio:**
   ```bash
   git status --short
   ```
   Si hay cambios sin commit -> BLOQUEAR.

3. **TestMaster:**
   ```bash
   npx vitest run tests/unit/
   ```
   SI FALLA -> PROHIBIDO DESPLEGAR.

4. **Lint:**
   ```bash
   cd minimarket-system && pnpm lint
   ```

### FASE B: Dry Run

1. **Edge Functions check:**
   ```bash
   supabase functions list
   ```
2. **Build frontend:**
   ```bash
   cd minimarket-system && pnpm build
   ```
3. **Verificar migraciones pendientes:**
   ```bash
   supabase db diff --linked 2>/dev/null || echo "No linked project"
   ```

### FASE C: Execution

1. **Deploy Edge Functions:**
   ```bash
   supabase functions deploy <function_name>
   ```
2. **Deploy Migraciones (si aplica):**
   ```bash
   supabase db push
   ```
3. **Smoke Test:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket/health
   ```

## Emergency Rollback (Nivel 3)

1. Identificar commit previo: `git rev-parse HEAD~1`
2. Revertir: `git revert HEAD`
3. Re-deploy con version anterior.

## Quality Gates

- [ ] Tests pasan al 100%.
- [ ] Dry run aprobado.
- [ ] Health check responde 200 OK.
- [ ] Sin secrets expuestos en logs.

## Anti-Loop / Stop-Conditions

**SI tests fallan en pre-flight:**
1. BLOQUEAR deploy.
2. Documentar que tests fallaron.
3. NO intentar deploy sin tests verdes.

**SI health check falla post-deploy:**
1. Ejecutar rollback AUTOMATICO.
2. Documentar en EVIDENCE.md.
3. Generar SESSION_REPORT con analisis.

**NUNCA:** Quedarse esperando confirmacion manual (excepto produccion).

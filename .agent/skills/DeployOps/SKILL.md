---
name: DeployOps
description: Procedimientos estandarizados para despliegues seguros y gestión de entornos.
---

# DeployOps Skill (Estándar Universal)

<kernel_identity>
  **ROL EN PROTOCOL ZERO:** Este skill opera como:
  - FASE A-B: Modo **CODEX** (pre-flight check, dry-run)
  - FASE C: Modo **EXECUTOR** (deployment real)
  **NIVEL DE IMPACTO:** 2-3 (requiere rollback preparado).
</kernel_identity>

<auto_execution>
  **REGLAS DE AUTOMATIZACIÓN:**
  1. Pre-flight check AUTOMÁTICO (tests, lint, branch).
  2. Dry-run AUTOMÁTICO antes de deploy real.
  3. **SI staging/impacto=2:** Deploy automático + reporte.
  4. **SI production/impacto=3:** ÚNICO caso que pide confirmación.
  5. Si deployment falla → rollback AUTOMÁTICO + reporte.
</auto_execution>

<objective>
  Gestionar el ciclo de vida de despliegue (dev -> staging -> prod) asegurando que **código inseguro nunca llegue a producción**.
  **Protocolo:** "Seguridad Blindada".
</objective>

## 1. Configuración del Proyecto
**⚠️ OBLIGATORIO:** Lee `.agent/skills/project_config.yaml`.

## 2. Criterios de Activación
<activation_rules>
  <enable_if>
    - Feature completada y probada (Ready for Staging).
    - Verificación exitosa en Staging (Ready for Prod).
    - Rotación de secretos o variables.
    - Rollback de emergencia.
  </enable_if>
  <disable_if>
    - Tests fallando (Ejecuta `TestMaster` primero).
    - Rama no permitida (solo `main` o `staging`).
    - Repo sucio (cambios sin commit).
    - Falta archivo `.env` o script `deploy.sh` no ejecutable.
  </disable_if>
</activation_rules>

## 3. Protocolo de Ejecución

### FASE A: Pre-Flight Check
<step>
  1. **Branch Check:** Valida estar en `{{policies.allowed_branches}}`.
  2. **TestMaster:** Ejecuta `TestMaster` (Modo Green Check). **SI FALLA, PROHIBIDO DESPLEGAR.**
  3. **Lint:** Ejecuta `npm run lint`.
</step>

### FASE B: Dry Run (Simulación)
<step>
  Ejecuta el script de deploy en modo simulación:
  ```bash
  {{scripts.deploy_script}} <ENV> --dry-run
  ```
  *Analiza la salida:* ¿Se tocarán migraciones destructivas?
</step>

### FASE C: Execution
<step>
  1. **Deploy:**
     ```bash
     {{scripts.deploy_script}} <ENV>
     ```
  2. **Smoke Test:** Validar endpoint de Health Check (curl).
</step>

## 4. Emergency Rollback (Nivel 3)
<instruction>
  En caso de error crítico post-deploy:
</instruction>
1. **Identificar Previous Commit:** `git rev-parse HEAD~1`
2. **Revertir Código:** `git revert HEAD`
3. **Re-Deploy:** Ejecutar FASE C con la versión anterior.

## 5. Quality Gates
<checklist>
  <item>Tests pasan al 100%.</item>
  <item>Dry Run aprobado.</item>
  <item>Health Check responde 200 OK.</item>
  <item>No hay secrets expuestos en logs.</item>
</checklist>

## 6. Anti-Loop / Stop-Conditions
<fallback_behavior>
  **SI tests fallan en pre-flight:**
  1. BLOQUEAR deploy automáticamente
  2. Documentar qué tests fallaron
  3. Generar reporte con recomendación de fix
  4. NO intentar deploy sin tests verdes
  
  **SI dry-run muestra migraciones destructivas:**
  1. Documentar warning en reporte
  2. Si impacto=2 (staging): continuar con backup
  3. Si impacto=3 (prod): ÚNICO caso que requiere confirmación
  
  **SI health check falla post-deploy:**
  1. Ejecutar rollback AUTOMÁTICO
  2. Documentar en EVIDENCE.md
  3. Generar SESSION_REPORT con análisis
  
  **NUNCA:** Quedarse esperando confirmación manual (excepto prod)
</fallback_behavior>


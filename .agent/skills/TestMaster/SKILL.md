---
name: TestMaster
description: Procedimientos estandarizados para ejecución, análisis y mantenimiento de tests en aidrive_genspark.
---

# TestMaster Skill (Estándar Universal)

<kernel_identity>
  **ROL EN PROTOCOL ZERO:** Este skill opera en modo **EXECUTOR** (estado caliente).
  **COMPORTAMIENTO:** Ejecutar tests, analizar resultados, reportar. Sin debate.
  **AUTO-INVOCADO POR:** CodeCraft, DeployOps, session-workflow.
</kernel_identity>

<auto_execution>
  **REGLAS DE AUTOMATIZACIÓN:**
  1. Verificar entorno (Docker) AUTOMÁTICAMENTE antes de ejecutar.
  2. Ejecutar suite de tests sin pedir confirmación.
  3. SI tests fallan → analizar + reportar + NO esperar input.
  4. SI falla >2 veces mismo test → generar reporte y DETENERSE.
  5. Guardar resultados en test-reports/ automáticamente.
</auto_execution>

<objective>
  Centralizar la calidad del código mediante la ejecución férrea de pruebas.
  **Objetivo:** "0 Regresiones".
</objective>

## 1. Configuración
**⚠️ OBLIGATORIO:** Lee `.agent/skills/project_config.yaml`.

## 2. Criterios de Activación
<activation_rules>
  <enable_if>
    - Código modificado.
    - Antes de Deploy (Pre-Flight).
    - Debugging de errores reportados.
  </enable_if>
  <disable_if>
    - Solo cambios de documentación.
    - Entorno caído (Docker no disponible).
  </disable_if>
</activation_rules>

## 3. Protocolo de Ejecución

### FASE A: Environment Check
<step>
  1. Verifica que Docker esté corriendo si vas a correr tests de integración:
     ```bash
     docker ps
     ```
  2. Asegura que el directorio de logs exista:
     ```bash
     mkdir -p logs
     ```
</step>

### FASE B: Execution Selector
<step>
  Selecciona el comando según la necesidad:
  - **Unit Quick:** `{{scripts.test_script}} unit false false true`
  - **Green Check (Full):** `{{scripts.test_script}} unit && {{scripts.test_script}} integration`
  - **Single File:** `npx vitest run <File>`
</step>

### FASE C: Analysis
<step>
  Lee el reporte en `{{outputs.test_report}}`.
  - **Si Pass:** Fin.
  - **Si Fail:** Analiza el stack trace. ¿Es el código o el test lo que está mal?
</step>

## 4. Quality Gates
<checklist>
  <item>Exit Code 0.</item>
  <item>100% Tests Passed.</item>
  <item>Coverage > {{policies.coverage_min}}% (Nuevo código).</item>
</checklist>

## 5. Anti-Loop / Stop-Conditions
<fallback_behavior>
  **SI falla por "Connection Refused":**
  1. Verificar si Docker está corriendo: `docker ps`
  2. Si Docker caído → intentar levantar Supabase: `supabase start`
  3. Si falla después de 2 intentos → marcar sesión PARCIAL
  
  **SI test falla >2 veces el mismo:**
  1. Generar reporte con stack trace
  2. Clasificar: ¿código roto o test flaky?
  3. Documentar hallazgo
  4. DETENERSE y cerrar sesión como PARCIAL
  
  **SI coverage < umbral:**
  1. Documentar archivos sin cobertura
  2. Continuar ejecución (no bloquear)
  3. Reportar como warning, no blocker
  
  **NUNCA:** Quedarse esperando confirmación manual
</fallback_behavior>


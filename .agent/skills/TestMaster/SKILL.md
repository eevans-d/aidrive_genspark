---
name: TestMaster
description: Procedimientos estandarizados para ejecución, análisis y mantenimiento de tests en aidrive_genspark.
---

# TestMaster Skill (Estándar Universal)

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

## 5. Anti-Loop
- Si falla por "Connection Refused", levanta Supabase/Docker.
- Si falla >2 veces, genera reporte y DETENTE.

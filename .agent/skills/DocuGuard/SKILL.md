---
name: DocuGuard
description: Habilidad de mantenimiento para asegurar que la documentación esté sincronizada con los cambios de código.
---

# DocuGuard Skill (Estándar Universal)

<kernel_identity>
  **ROL EN PROTOCOL ZERO:** Este skill opera como **CODEX** (auditoría) + **EXECUTOR** (sincronización).
  - FASE 0-A: Modo CODEX (verificar, validar)
  - FASE B-C: Modo EXECUTOR (sincronizar, actualizar)
  **AUTO-EJECUCIÓN:** Ejecuta automáticamente sin intervención manual.
</kernel_identity>

<auto_execution>
  **REGLAS DE AUTOMATIZACIÓN:**
  1. Ejecutar TODAS las fases automáticamente en secuencia.
  2. Si encuentra patrones prohibidos → BLOQUEAR y reportar (no esperar input).
  3. Si encuentra desincronización → CORREGIR automáticamente.
  4. Clasificar cambios como REAL/A CREAR/PROPUESTA FUTURA.
  5. Generar reporte de sincronización al finalizar.
</auto_execution>

<objective>
  Actuar como "Guardián de la Verdad".
  Asegurar que la documentación (`docs/`) refleje fielmente el código (`src/`, `supabase/`).
  **Regla de Oro:** "Si no está documentado, no existe."
</objective>

## 1. Configuración
**⚠️ OBLIGATORIO:** Lee `.agent/skills/project_config.yaml`.

## 2. Criterios de Activación
<activation_rules>
  <enable_if>
    - Código modificado o creado.
    - Cambios en variables de entorno.
    - Auditoría de Pull Request.
  </enable_if>
  <disable_if>
    - Refactor en progreso (código roto).
    - Tareas exploratorias sin commits.
  </disable_if>
</activation_rules>

## 3. Protocolo de Ejecución

### FASE 0: Reality Check (R0)
<reality_validation>
  **Antes de documentar CUALQUIER cosa, verificar:**
  1. ¿El archivo/módulo existe en el repo? → `ls` o `find`
  2. ¿El endpoint/función existe? → `grep` en el código
  3. ¿La afirmación es verificable? → Si no, clasificar como **PROPUESTA FUTURA**
  
  **Referencia:** Ver `reality_rules` en `project_config.yaml`
  
  **Clasificar todo output como:**
  - **REAL:** Verificado con ruta/evidencia
  - **A CREAR:** Necesario pero no existe
  - **PROPUESTA FUTURA:** Idea, evaluar después
</reality_validation>

### FASE A: Code Pattern Scan
<step>
  Busca patrones prohibidos antes de documentar:
  ```bash
  rg "{{policies.forbidden_patterns}}" {{paths.backend_src}}
  ```
  *Si encuentras algo, BLOQUEA y reporta.*
</step>

### FASE B: Synchronization
<step>
  1. **README Check:** Si cambió `package.json` o endpoints clave, actualiza `README.md`.
  2. **API Docs:** Si cambió `supabase/functions`, actualiza `API_README.md`.
  3. **Decision Log:** Si hubo cambio arquitectónico, registra en `DECISION_LOG.md`.
</step>

### FASE C: Verification
<step>
  Lee `docs/ESTADO_ACTUAL.md`.
  ¿Tu cambio contradice el estado actual? -> **Actualiza el archivo.**
</step>

## 4. Quality Gates
<checklist>
  <item>Sin console.log ni secretos en código.</item>
  <item>Documentación con fecha actualizada.</item>
  <item>Enlaces en docs funcionan.</item>
  <item>Cumple con guia de IA (`docs/IA_USAGE_GUIDE.md`).</item>
</checklist>

## 5. Anti-Loop / Stop-Conditions
<fallback_behavior>
  **SI hay conflicto entre docs:**
  1. Priorizar archivo más reciente por timestamp
  2. Documentar decisión en EVIDENCE.md
  3. Continuar SIN esperar input
  
  **SI enlace roto encontrado:**
  1. Marcar con [ENLACE ROTO] en el doc
  2. Continuar verificación
  3. Reportar todos al final
  
  **NUNCA:** Quedarse esperando confirmación manual
</fallback_behavior>


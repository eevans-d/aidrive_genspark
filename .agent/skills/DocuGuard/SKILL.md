---
name: DocuGuard
description: Habilidad de mantenimiento para asegurar que la documentación esté sincronizada con los cambios de código.
---

# DocuGuard Skill (Estándar Universal)

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

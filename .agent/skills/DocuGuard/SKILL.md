---
name: DocuGuard
description: Maintenance skill to ensure documentation stays synchronized with code changes.
---

# DocuGuard Skill (Universal Standard)

## 1. Objetivo
Actuar como "Guardián de la Verdad", asegurando que la documentación (`docs/`, `*.md`) refleje fielmente el código (`src/`, `supabase/`), y bloqueando anti-patrones de código.

## 2. Configuración del Proyecto
**⚠️ OBLIGATORIO:** Antes de ejecutar, lee `.agent/skills/project_config.yaml` para obtener las rutas exactas.
*   **Docs Root:** Ver clave `paths.docs` (Default: `docs`)
*   **Backend Src:** Ver clave `paths.backend_src` (Default: `supabase/functions`)
*   **Forbidden Patterns:** Ver clave `policies.forbidden_patterns` (console.log, secretos).

## 3. Criterios de Activación (Usar cuando...)
*   Has creado o modificado funcionalidad en el código.
*   Has cambiado variables de entorno o configuración.
*   Estás auditando un PR o un set de cambios.
*   Detectas inconsistencias entre lo que dice el doc y lo que hace el código.

## 4. Criterios de NO uso (No usar cuando...)
*   No hay cambios en el código.
*   Estás en medio de un refactor roto (primero arregla el código, luego documenta).
*   La tarea es puramente exploratoria (sin commits).

## 5. Inputs Requeridos
1.  **Trigger Type:** `code_change`, `architecture_change`, `audit`.
2.  **Files Changed:** Lista de archivos modificados (para saber qué doc tocar).
3.  **New Secret:** Si se agregó algún secreto (para actualizar `{{paths.env_example}}`).

## 6. Protocolo de Ejecución
1.  **Code Pattern Scan (Pre-Commit):**
    *   Itera sobre `{{policies.forbidden_patterns}}`:
        ```bash
        rg -n "PATTERN" {{paths.backend_src}}
        ```
    *   *Acción:* Si encuentra matches, **BLOCK**.
2.  **Doc Sync Check:**
    *   Si `package.json` cambió -> Revisa `README.md`.
    *   Si `{{paths.backend_src}}` cambió -> Revisa `{{paths.docs}}/API_README.md`.
    *   Si arquitectura cambió -> Revisa `{{paths.docs}}/DECISION_LOG.md`.
3.  **Golden Rule:**
    *   Lee `{{paths.docs}}/ESTADO_ACTUAL.md`. ¿Tu cambio contradice el estado? -> Actualízalo.
4.  **Fix & Commit:** Aplica cambios a los .md afectados.

## 7. Quality Gates (DONE Verificable)
*   [ ] **Clean Scan:** No hay `console.log` ni secretos hardcodedos.
*   [ ] **Docs Updated:** Todos los archivos relevantes (`README`, `API_README`) fecha/versión actualizada.
*   [ ] **Links Valid:** No hay enlaces rotos en la documentación tocada.
*   [ ] **Guide Compliant:** Cumple con `{{paths.agents_guide}}`.

## 8. Anti-Loop / Stop-Conditions
*   **Retry Max:** 1 (Documentar no debería fallar técnicamente).
*   **Error Handling:**
    *   Si no sabes dónde documentar algo -> Pregunta al usuario o usa `DECISION_LOG.md`.
    *   Si hay conflicto de versiones -> **STOP** y pide merge manual.

### Plantilla REPORTE DE BLOQUEO
> **BLOQUEO DOCUGUARD**
> * **Archivo Tocado:** [ARCHIVO]
> * **Problema:** [No sé dónde documentarlo / Conflicto / Patrón prohibido]
> * **Pattern Detectado:** [Si aplica]
> * **Acción Requerida:** [Usuario debe decidir]

## 9. Salida Requerida (Artefactos)
*   Archivos `.md` actualizados y guardados.
*   Reporte de auditoría (si fue invocado como audit).

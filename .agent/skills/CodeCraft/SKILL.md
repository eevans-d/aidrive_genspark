---
name: CodeCraft
description: Standardized procedures for implementing new features (Frontend & Backend) with quality-first approach.
---

# CodeCraft Skill (Universal Standard)

## 1. Objetivo
Estandarizar la creación de nuevas funcionalidades ("Features"), asegurando que cada pieza de código nuevo nazca con tests, documentación y patrones de diseño correctos desde el día 1. Evita el "Spaghetti Code".

## 2. Configuración del Proyecto
**⚠️ OBLIGATORIO:** Lee `.agent/skills/project_config.yaml`.
*   **Frontend Src:** Ver clave `paths.frontend_src`
*   **Backend Src:** Ver clave `paths.backend_src`
*   **Patterns:** MVC en Backend, Component-Page en Frontend.

## 3. Criterios de Activación (Usar cuando...)
*   Usuario pide "Crea la pantalla de X".
*   Usuario pide "Agrega el endpoint de Y".
*   Necesitas refactorizar un componente legado.

## 4. Criterios de NO uso (No usar cuando...)
*   Solo estás corrigiendo un bug menor (usa lógica directa).
*   Solo estás actualizando dependencias.

## 5. Inputs Requeridos
1.  **Feature Name:** Nombre funcional (ej: `GestionProveedores`).
2.  **Scope:** `frontend`, `backend` o `fullstack`.
3.  **Requirements:** Lista de requisitos funcionales.

## 6. Protocolo de Ejecución

### Fase A: Backend (Si aplica)
1.  **Architecture Decision (CRITICAL):**
    *   *Opción A (Gateway):* ¿Es lógica core? -> Agrega router en `{{paths.backend_src}}/api-minimarket`.
    *   *Opción B (Microservice):* ¿Es un proceso aislado/pesado? -> Crea nueva función.
2.  **Scaffold:**
    *   Si es Microservice: Crea carpeta `{{paths.backend_src}}/api-<feature>`.
    *   **OBLIGATORIO:** Importa desde `{{paths.backend_src}}/_shared/` (Logger, Response).
3.  **Test First:** Crea `{{paths.tests_root}}/unit/<feature>.test.ts` con tests fallando.
4.  **Implement:** Escribe el código hasta que el test pase.

### Fase B: Frontend (Si aplica)
1.  **React Query Hook:** Crea `{{paths.frontend_src}}/hooks/queries/use<Feature>.ts`.
2.  **API Client:** Agrega métodos a `{{paths.frontend_src}}/lib/apiClient.ts` (nunca fetch directo).
3.  **Page/Component:** Crea `{{paths.frontend_src}}/pages/<Feature>.tsx`.
4.  **Route:** Registra en `App.tsx` o router.

### Fase C: Integration
1.  **Verify:** Ejecuta `TestMaster` (unit + integration).
2.  **Doc:** Ejecuta `DocuGuard` para registrar la nueva feature.

## 7. Quality Gates (DONE Verificable)
*   [ ] **Tests Created:** Existe archivo `.test.ts` para lo nuevo.
*   [ ] **No Direct Fetch:** Frontend usa `apiClient` o `React Query`.
*   [ ] **Shared Used:** Backend usa `_shared` helpers.
*   [ ] **Builds:** `npm run build` en frontend pasa.

## 8. Anti-Loop / Stop-Conditions
*   Si no sabes dónde poner un archivo -> **STOP** y pregunta al usuario (Gateway vs Microservice).
*   Si el build falla por tipos -> Corrige `interface` antes de seguir.

## 9. Salida Requerida
*   Archivos de código creados.
*   Confirmación de tests pasando ("Green Check").

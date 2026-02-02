---
name: CodeCraft
description: Procedimientos estandarizados para implementar nuevas features (Frontend & Backend) con enfoque de calidad primero.
---

# CodeCraft Skill (Estándar Universal)

<objective>
  Estandarizar la creación de nuevas funcionalidades ("Features"), asegurando que cada pieza de código nuevo nazca con tests, documentación y patrones de diseño correctos desde el día 1.
  **Mantra:** "Lento es Suave, Suave es Rápido."
</objective>

## 1. Configuración del Proyecto
**⚠️ OBLIGATORIO:** Lee `.agent/skills/project_config.yaml`.
- Frontend: `{{paths.frontend_src}}`
- Backend: `{{paths.backend_src}}`

## 2. Criterios de Activación
<activation_rules>
  <enable_if>
    - Usuario pide "Crea la pantalla de X".
    - Usuario pide "Agrega el endpoint de Y".
    - Necesitas refactorizar un componente legado.
  </enable_if>
  <disable_if>
    - Solo estás corrigiendo un bug menor (Hotfix).
    - Solo estás actualizando dependencias.
    - Falta archivo `.env` o credenciales críticas.
  </disable_if>
</activation_rules>

## 3. Protocolo de Ejecución

### FASE A: Análisis & Arquitectura
<step>
  1. **Leer Contexto:** Antes de escribir, lee los archivos relacionados existentes.
  2. **Decisión Arquitectónica:**
     - *Backend:* ¿Gateway (Router existente) o Microservice (Nueva Función)?
     - *Frontend:* ¿Nueva Página o Modal/Componente?
</step>

### FASE B: Backend (API First)
<step>
  1. **Scaffold:** Crea la estructura de carpetas en `{{paths.backend_src}}`.
  2. **Shared Libs:** IMPORTANTE: Usa `_shared/` para logs (`logger.ts`) y respuestas (`response.ts`). NO uses `console.log`.
  3. **Test-Driven:** Crea `{{paths.tests_root}}/unit/<feature>.test.ts` *antes* del código real.
  4. **Implement:** Escribe el código hasta que el test pase (Red-Green-Refactor).
</step>

### FASE C: Frontend (UI/UX)
<step>
  1. **Data Layer:** Crea `hooks/queries/use<Feature>.ts` (React Query).
  2. **API Client:** Actualiza `lib/apiClient.ts` (Nunca fetch directo en componentes para escrituras).
  3. **UI Implementation:** Crea la página/componente en `{{paths.frontend_src}}`.
  4. **Routing:** Registra la ruta en el Router principal.
</step>

### FASE D: Integration & Verify
<step>
  1. **TestMaster:** Ejecuta `TestMaster` para validar no regresión.
  2. **DocuGuard:** Registra la nueva feature en la documentación (`docs/ESTADO_ACTUAL.md`).
</step>

## 4. Quality Gates
<checklist>
  <item>Tests unitarios creados y pasando.</item>
  <item>Frontend desacoplado (Usa Custom Hooks).</item>
  <item>Backend usa utilidades compartidas (`_shared`).</item>
  <item>Build (`npm run build`) exitoso.</item>
</checklist>

## 5. Anti-Loop / Stop-Conditions
- Si no sabes dónde ubicar un archivo, **PREGUNTA**.
- Si el build falla por tipos TypeScript, **ARREGLA LOS TIPOS**, no uses `any`.

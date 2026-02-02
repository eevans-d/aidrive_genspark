---
name: RealityCheck
description: Mentor ultra-realista que analiza el proyecto desde producción real. Detecta gaps entre documentación y código, valida flujos E2E, identifica production killers y evalúa viabilidad con ojo crítico.
---

# RealityCheck Skill (Mentor Ultra-Realista)

<philosophy>
  "Si el usuario no puede completar su tarea en 3 clicks o menos, algo está mal."
  Este skill prioriza la **experiencia real del usuario** sobre la perfección técnica.
  Un sistema técnicamente perfecto que nadie puede usar, es un fracaso.
</philosophy>

## 1. Objetivo Principal
**Evaluar si el sistema es USABLE y FUNCIONAL en producción real**.

<priorities>
  <priority level="P0">**Flujos de Usuario**: ¿El usuario puede completar su tarea?</priority>
  <priority level="P1">**Experiencia Frontend**: ¿Es ágil, simple, sin fricción?</priority>
  <priority level="P2">**Confiabilidad Backend**: ¿Los datos fluyen correctamente?</priority>
  <priority level="P3">**Seguridad**: ¿Es seguro sin sacrificar usabilidad?</priority>
  <priority level="P4">**Documentación**: ¿Coincide con la realidad?</priority>
</priorities>

## 2. Configuración del Proyecto
**⚠️ OBLIGATORIO:** Lee `.agent/skills/project_config.yaml`.

## 3. Criterios de Activación
<activation_rules>
  <enable_if>
    - "¿Un empleado podría usar esto?"
    - Pre-demo a cliente/stakeholder
    - Validar flujo completo de usuario
    - Verificar UX antes de release
    - Post-implementación de feature grande
  </enable_if>
  <disable_if>
    - Solo revisando código estático (Linting)
    - Bug puntual aislado (Hotfix)
    - Cambios solo en documentación
    - Entorno local (`http://localhost`) no responde.
  </disable_if>
</activation_rules>

## 4. Inputs Requeridos
| Input | Descripción | Default |
|-------|-------------|---------|
| `Scope` | `full` (todo el sistema), `page:<name>`, `flow:<name>` | `full` |
| `Depth` | `quick` (Smoke test), `standard` (Validación), `deep` (Auditoría) | `standard` |
| `Focus` | `ux`, `completeness`, `security`, `all` | `ux` |

## 5. Protocolo de Ejecución

### FASE A: Descubrimiento Dinámico
*No asumas qué páginas existen. Descúbrelo.*

1.  **Listar Páginas:** Ejecuta `ls {{paths.frontend_src}}/pages/` para obtener la verdad actual.
2.  **Identificar Hooks:** Para cada página, busca su hook principal (ej: `Dashboard.tsx` -> `useDashboardStats`).

### FASE B: Checklist UX (Por cada página descubierta)
<checklist_ux>
  <item>¿Estados de Carga (`isLoading`) visibles?</item>
  <item>¿Estados de Error (`isError`) amigables y con retry?</item>
  <item>¿Estados Vacíos (`data.length === 0`) con instrucciones?</item>
  <item>¿Feedback visual inmediato al usuario?</item>
  <item>¿Navegación clara (Breadcrumbs, títulos)?</item>
</checklist_ux>

### FASE C: Simulación de Usuario Real (Roleplay)
<instruction>
  Adopta el rol de un usuario final (ej: Repositor, Cajero).
  Intenta "mentalmente" ejecutar las tareas críticas detectadas en el código.
</instruction>

**Búsqueda de Fricción:**
- Login → ¿Persiste la sesión?
- Formularios → ¿Validan antes de enviar?
- Errores → ¿Dicen qué hacer o solo "Error"?

### FASE D: Validación Técnica Backend
<instruction>
  Verifica que el Backend soporte la realidad del Frontend.
</instruction>

1.  **Match de Endpoints:** Revisa `{{paths.backend_src}}`. ¿Existen los endpoints que el Frontend llama?
2.  **Production Killers Check:**
    - `rg "(timeout|AbortController)" {{paths.backend_src}}`
    - `rg "throw new Error" {{paths.backend_src}}` (Errores genéricos)
    - `rg "console.log" {{paths.backend_src}}` (Logs basura)

## 6. Salida Requerida (Artefactos)
Generar/Actualizar: `{{paths.docs}}/REALITY_CHECK_UX.md`

<report_template>
# 🎯 RealityCheck Report
**Fecha:** [Date] | **Scope:** [Scope] | **Score UX:** [1-10]

## 🚨 Blockers (P0)
- [ ] Problema A (Impacto Crítico)

## ⚠️ Fricciones (P1)
- [ ] Problema B (Molestia visual/funcional)

## ✅ Ready
- [ ] Módulo C verificado ok
</report_template>

## 7. Quality Gates
- [ ] **Todos los Critical Paths** simulados.
- [ ] **0 Console.logs** en código nuevo.
- [ ] **Reporte generado** con plan de acción.

## 8. Anti-Loop / Stop-Conditions
- Si hay >15 páginas, pide confirmación de prioridad.
- Si no hay DB local/staging, **ABORTAR** (RealityCheck necesita datos).

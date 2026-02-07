---
name: APISync
description: Sincronización de OpenAPI spec con código real. Detecta endpoints sin documentar y docs obsoletas.
---

# APISync Skill (API Documentation Guardian)

<kernel_identity>
  **ROL EN PROTOCOL ZERO:** Este skill opera en modo **CODEX** (validación) + **EXECUTOR** (sincronización).
  - FASE A: CODEX (detectar discrepancias)
  - FASE B: EXECUTOR (sincronizar spec)
  **NIVEL DE IMPACTO:** 1 (bajo riesgo, solo documentación).
</kernel_identity>

<auto_execution>
  **REGLAS DE AUTOMATIZACIÓN:**
  1. Ejecutar análisis completo sin pedir confirmación.
  2. Detectar endpoints en código sin entrada en OpenAPI spec.
  3. Detectar endpoints en spec que ya no existen en código.
  4. SI hay discrepancias → sincronizar automáticamente.
  5. Generar reporte de cambios.
</auto_execution>

<objective>
  Mantener OpenAPI spec 100% sincronizada con implementación real.
  **Protocolo:** "Spec = Realidad".
</objective>

## 1. Configuración
**⚠️ OBLIGATORIO:** Lee `.agent/skills/project_config.yaml`.

Archivo OpenAPI: `docs/api-openapi-3.1.yaml`
Código Backend: `supabase/functions/api-minimarket/`

## 2. Criterios de Activación
<activation_rules>
  <enable_if>
    - Nuevo endpoint agregado (CodeCraft terminó)
    - Handler modificado
    - Pre-release audit
    - Usuario pide "sincronizar API docs"
  </enable_if>
  <disable_if>
    - Solo cambios de frontend
    - Solo cambios de documentación no-API
  </disable_if>
</activation_rules>

## 3. Protocolo de Ejecución

### FASE A: Descubrimiento de Endpoints
<step>
  1. **Extraer endpoints del código:**
     ```bash
     rg "router\.(get|post|put|patch|delete)" supabase/functions/api-minimarket/index.ts
     ```
  2. **Extraer paths del OpenAPI spec:**
     ```bash
     grep -E "^\s+/[a-z]" docs/api-openapi-3.1.yaml
     ```
  3. **Comparar listas:**
     - Endpoints en código pero NO en spec → **AGREGAR**
     - Endpoints en spec pero NO en código → **ELIMINAR/DEPRECAR**
</step>

### FASE B: Sincronización
<step>
  1. **Para cada endpoint faltante en spec:**
     - Generar plantilla OpenAPI básica
     - Incluir método, path, parámetros detectados
     - Agregar response schemas basados en código
  2. **Para cada endpoint obsoleto en spec:**
     - Marcar como deprecated o eliminar
     - Documentar razón del cambio
</step>

### FASE C: Validación
<step>
  1. **Validar spec actualizada:**
     ```bash
     npx @redocly/cli lint docs/api-openapi-3.1.yaml
     ```
  2. **Generar documentación:**
     - Confirmar que spec es válida
     - Verificar que todos los schemas referencian correctamente
</step>

## 4. Plantilla para Nuevo Endpoint
```yaml
  /nuevo-endpoint:
    get:
      summary: "[Descripción breve]"
      operationId: "getNuevoEndpoint"
      tags:
        - "[Categoría]"
      security:
        - BearerAuth: []
      responses:
        '200':
          description: "OK"
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/[Schema]'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

## 5. Quality Gates
<checklist>
  <item>Todos los endpoints de código están en spec.</item>
  <item>No hay endpoints obsoletos en spec.</item>
  <item>Spec pasa validación de linter.</item>
  <item>Schemas reflejan tipos reales del código.</item>
</checklist>

## 6. Anti-Loop / Stop-Conditions
<fallback_behavior>
  **SI linter de OpenAPI no disponible:**
  1. Validar manualmente estructura YAML
  2. Documentar limitación
  3. Continuar sin bloquear
  
  **SI hay conflicto entre spec y código:**
  1. Priorizar CÓDIGO como fuente de verdad
  2. Actualizar spec para reflejar código
  3. Documentar discrepancia en reporte
  
  **SI hay > 10 endpoints sin documentar:**
  1. Priorizar endpoints más usados
  2. Documentar los top 5
  3. Dejar resto para siguiente iteración
  
  **NUNCA:** Modificar código para que coincida con spec
</fallback_behavior>

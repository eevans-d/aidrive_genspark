---
name: APISync
description: Sincronizacion de OpenAPI spec con codigo real. Detecta endpoints sin
  documentar y docs obsoletas.
role: CODEX->EXECUTOR
version: 1.0.0
impact: HIGH
impact_legacy: 1
triggers:
  automatic:
  - orchestrator keyword match (APISync)
  manual:
  - APISync
  - openapi
  - swagger
  - api spec
chain:
  receives_from: []
  sends_to:
  - DocuGuard
  required_before: []
priority: 6
---

# APISync Skill

**ROL:** CODEX (fase A: detectar discrepancias) + EXECUTOR (fase B: sincronizar).
**PROTOCOLO:** "Spec = Realidad."

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos.
3. CODIGO es fuente de verdad (spec se ajusta al codigo, no al reves).

## Reglas de Automatizacion

1. Ejecutar analisis completo sin pedir confirmacion.
2. Detectar endpoints en codigo sin entrada en OpenAPI spec.
3. Detectar endpoints en spec que ya no existen en codigo.
4. SI hay discrepancias -> sincronizar automaticamente.
5. Generar reporte de cambios.

## Activacion

**Activar cuando:**
- Nuevo endpoint agregado (CodeCraft termino).
- Handler modificado.
- Pre-release audit.
- Usuario pide "sincronizar API docs".

**NO activar cuando:**
- Solo cambios de frontend.
- Solo cambios de documentacion no-API.

## Protocolo de Ejecucion

### FASE A: Descubrimiento de Endpoints

1. **Extraer endpoints del gateway principal:**
   ```bash
   grep -E "(GET|POST|PUT|PATCH|DELETE|method|path)" supabase/functions/api-minimarket/index.ts | head -50
   ```

2. **Extraer handlers registrados:**
   ```bash
   ls supabase/functions/api-minimarket/handlers/ 2>/dev/null
   ```

3. **Extraer paths del OpenAPI spec:**
   ```bash
   grep -E "^\s+/" docs/api-openapi-3.1.yaml | head -30
   ```
   Repetir para proveedor si aplica:
   ```bash
   grep -E "^\\s+/" docs/api-proveedor-openapi-3.1.yaml | head -30
   ```

4. **Comparar listas:**
   - Endpoints en codigo pero NO en spec -> **AGREGAR**
   - Endpoints en spec pero NO en codigo -> **ELIMINAR/DEPRECAR**

### FASE B: Sincronizacion

Para cada endpoint faltante en spec:
1. Generar plantilla OpenAPI basica con metodo, path, parametros.
2. Incluir response schemas basados en codigo.
3. Para endpoints obsoletos en spec: marcar como deprecated o eliminar.

**Plantilla nuevo endpoint:**
```yaml
  /nuevo-endpoint:
    get:
      summary: "[Descripcion]"
      operationId: "getNuevoEndpoint"
      tags:
        - "[Categoria]"
      security:
        - BearerAuth: []
      responses:
        '200':
          description: "OK"
          content:
            application/json:
              schema:
                type: object
        '401':
          $ref: '#/components/responses/Unauthorized'
```

### FASE C: Validacion

1. **Validar spec (si linter disponible):**
   ```bash
   npx @redocly/cli lint docs/api-openapi-3.1.yaml 2>/dev/null || echo "Linter no disponible"
   ```
2. **Verificar YAML valido:**
   ```bash
   node -e "const y=require('js-yaml');y.load(require('fs').readFileSync('docs/api-openapi-3.1.yaml','utf8'));console.log('YAML OK')" 2>/dev/null || echo "Verificar YAML manualmente"
   ```

## Quality Gates

- [ ] Todos los endpoints de codigo estan en spec.
- [ ] No hay endpoints obsoletos en spec.
- [ ] Spec es YAML valido.
- [ ] Schemas reflejan tipos reales del codigo.

## Anti-Loop / Stop-Conditions

**SI linter no disponible:**
1. Validar manualmente estructura YAML.
2. Documentar limitacion.
3. Continuar sin bloquear.

**SI hay conflicto entre spec y codigo:**
1. CODIGO es fuente de verdad.
2. Actualizar spec para reflejar codigo.
3. Documentar discrepancia.

**SI hay > 10 endpoints sin documentar:**
1. Priorizar los mas usados.
2. Documentar top 5.
3. Dejar resto para siguiente iteracion.

**NUNCA:** Modificar codigo para que coincida con spec.

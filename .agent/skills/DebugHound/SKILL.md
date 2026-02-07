---
name: DebugHound
description: Análisis y resolución sistemática de errores. Traza, diagnostica y propone fixes con evidencia completa.
---

# DebugHound Skill (Error Detective)

<kernel_identity>
  **ROL EN PROTOCOL ZERO:** Este skill opera en modo **CODEX** (análisis) + **EXECUTOR** (fix).
  - FASE A-B: CODEX (analizar, diagnosticar)
  - FASE C: EXECUTOR (aplicar fix)
  **NIVEL DE IMPACTO:** Variable (según el fix propuesto).
</kernel_identity>

<auto_execution>
  **REGLAS DE AUTOMATIZACIÓN:**
  1. Ejecutar análisis completo sin pedir confirmación.
  2. SI hay fix obvio (typo, import faltante) → aplicar automáticamente.
  3. SI fix requiere cambio arquitectónico → documentar y proponer.
  4. Siempre generar EVIDENCE.md con stack trace y análisis.
  5. Nunca quedarse en loop de debugging > 3 iteraciones.
</auto_execution>

<objective>
  Resolver errores de forma sistemática y documentada.
  **Protocolo:** "Un error, un fix, una evidencia".
</objective>

## 1. Configuración
**⚠️ OBLIGATORIO:** Lee `.agent/skills/project_config.yaml`.

## 2. Criterios de Activación
<activation_rules>
  <enable_if>
    - Build falla con error
    - Test falla con stack trace
    - Usuario reporta bug específico
    - Runtime error en logs
  </enable_if>
  <disable_if>
    - Error ajeno al proyecto (dependencia externa caída)
    - Error de configuración de entorno
    - Solo warnings (no errores)
  </disable_if>
</activation_rules>

## 3. Protocolo de Ejecución

### FASE A: Recolección de Evidencia
<step>
  1. **Capturar error completo:**
     - Stack trace
     - Archivo y línea
     - Contexto (qué acción lo disparó)
  2. **Clasificar tipo de error:**
     - `TypeScript/Compile`: Tipos incorrectos
     - `Runtime`: Error en ejecución
     - `Integration`: Falla de conexión/API
     - `Logic`: Comportamiento incorrecto
</step>

### FASE B: Diagnóstico
<step>
  1. **Analizar stack trace:**
     - Identificar archivo raíz del error
     - Trazar flujo de ejecución
  2. **Buscar patrones similares:**
     ```bash
     rg "<patron_error>" --type ts
     ```
  3. **Verificar cambios recientes:**
     ```bash
     git log -5 --oneline
     git diff HEAD~1
     ```
</step>

### FASE C: Fix & Verify
<step>
  1. **Aplicar fix (según tipo):**
     - TypeScript: Corregir tipos, imports
     - Runtime: Agregar validaciones, null checks
     - Logic: Corregir flujo
  2. **Verificar fix:**
     ```bash
     npm run build  # o test específico
     ```
  3. **Documentar en EVIDENCE.md:**
     ```markdown
     ## Bug Fix: [descripción breve]
     **Causa:** [root cause]
     **Archivos:** [lista]
     **Fix:** [qué se cambió]
     **Verificación:** [cómo se verificó]
     ```
</step>

## 4. Taxonomía de Errores
| Tipo | Ejemplo | Fix Típico |
|------|---------|------------|
| `ImportError` | Cannot find module 'X' | Agregar import/instalar dep |
| `TypeError` | X is not defined | Agregar declaración/null check |
| `SyntaxError` | Unexpected token | Corregir sintaxis |
| `CompileError` | Type mismatch | Ajustar tipos |
| `NetworkError` | Connection refused | Verificar env/URLs |
| `AuthError` | Unauthorized | Verificar tokens/permisos |

## 5. Quality Gates
<checklist>
  <item>Error original reproducido y entendido.</item>
  <item>Root cause identificado.</item>
  <item>Fix aplicado y verificado.</item>
  <item>No se introdujeron nuevos errores.</item>
  <item>Documentación de evidencia completa.</item>
</checklist>

## 6. Anti-Loop / Stop-Conditions
<fallback_behavior>
  **SI el fix no resuelve el error:**
  1. Documentar intentos previos
  2. Ampliar búsqueda de contexto
  3. Máximo 3 iteraciones
  4. Si persiste → marcar como NEEDS_HUMAN_REVIEW
  
  **SI el error es de dependencia externa:**
  1. Documentar como "External Issue"
  2. No intentar fix
  3. Reportar con recomendación de workaround
  
  **SI el fix tiene impacto >= 2:**
  1. Documentar rollback posible
  2. Ejecutar tests completos antes de mergear
  
  **NUNCA:** Aplicar fixes sin verificar que funcionan
</fallback_behavior>

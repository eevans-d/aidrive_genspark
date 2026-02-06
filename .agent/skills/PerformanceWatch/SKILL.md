---
name: PerformanceWatch
description: Monitoreo y optimización de rendimiento. Analiza bundle size, queries lentas, y métricas de UX performance.
---

# PerformanceWatch Skill (Performance Guardian)

<kernel_identity>
  **ROL EN PROTOCOL ZERO:** Este skill opera en modo **CODEX** (análisis).
  **COMPORTAMIENTO:** Analizar, medir, reportar. Proponer optimizaciones.
  **AUTO-EJECUCIÓN:** Ejecutar análisis completo sin intervención manual.
</kernel_identity>

<auto_execution>
  **REGLAS DE AUTOMATIZACIÓN:**
  1. Ejecutar análisis de bundle automáticamente post-build.
  2. Detectar imports pesados y sugerir lazy loading.
  3. Identificar queries N+1 en código.
  4. Generar reporte con métricas y recomendaciones.
  5. SI hay regresión de tamaño > 10% → alertar como WARNING.
</auto_execution>

<objective>
  Mantener el rendimiento del sistema en niveles óptimos.
  **Protocolo:** "Medir antes de optimizar".
</objective>

## 1. Configuración
**⚠️ OBLIGATORIO:** Lee `.agent/skills/project_config.yaml`.

## 2. Criterios de Activación
<activation_rules>
  <enable_if>
    - Build completado (analizar bundle size)
    - Nueva feature agregada (verificar impacto)
    - Usuario reporta lentitud
    - Pre-release audit
  </enable_if>
  <disable_if>
    - Solo cambios de documentación
    - Hotfix urgente (priorizar funcionalidad)
  </disable_if>
</activation_rules>

## 3. Protocolo de Ejecución

### FASE A: Bundle Analysis (Frontend)
<step>
  1. **Medir bundle size:**
     ```bash
     cd minimarket-system && npm run build 2>&1 | grep -E "(gzip|dist)"
     ```
  2. **Detectar dependencias pesadas:**
     ```bash
     npx vite-bundle-visualizer  # si disponible
     ```
  3. **Buscar imports no optimizados:**
     ```bash
     rg "import \* as" minimarket-system/src
     rg "from 'lodash'" minimarket-system/src  # vs lodash-es
     ```
</step>

### FASE B: Query Analysis (Backend)
<step>
  1. **Detectar N+1 potenciales:**
     ```bash
     rg "\.select\(" supabase/functions --type ts | head -20
     ```
  2. **Verificar uso de índices:**
     - Buscar queries sin WHERE optimizado
     - Verificar JOINs pesados
  3. **Revisar paginación:**
     ```bash
     rg "\.limit\(" supabase/functions
     ```
</step>

### FASE C: UX Performance Metrics
<step>
  1. **Verificar estados de carga:**
     ```bash
     rg "isLoading" minimarket-system/src --type tsx
     ```
  2. **Verificar optimistic updates:**
     - Buscar uso de React Query mutations con optimistic UI
  3. **Detectar re-renders excesivos:**
     - Buscar componentes sin useMemo/useCallback donde corresponda
</step>

## 4. Métricas y Umbrales
| Métrica | Umbral OK | Umbral Warning | Umbral Critical |
|---------|-----------|----------------|-----------------|
| Bundle (gzip) | < 100KB | 100-200KB | > 200KB |
| First Load | < 2s | 2-4s | > 4s |
| API Response | < 200ms | 200-500ms | > 500ms |
| Queries/Page | < 5 | 5-10 | > 10 |

## 5. Salida Requerida
Generar/Actualizar: `docs/PERFORMANCE_REPORT.md`

<report_template>
# 📊 Performance Report
**Fecha:** [Date] | **Build Size:** [X KB gzip]

## Frontend Bundle
| Chunk | Size | Recommendation |
|-------|------|----------------|
| main.js | X KB | [OK/Optimize] |

## Backend Queries
- [x] Query X: OK (indexed)
- [ ] Query Y: WARNING (no pagination)

## Recommendations
1. [Optimización 1]
2. [Optimización 2]
</report_template>

## 6. Anti-Loop / Stop-Conditions
<fallback_behavior>
  **SI vite-bundle-visualizer no disponible:**
  1. Usar output estándar de build
  2. Documentar limitación
  3. Continuar con análisis manual
  
  **SI bundle excede umbral crítico:**
  1. Generar reporte con WARNING destacado
  2. Listar top 5 dependencias más pesadas
  3. Sugerir lazy loading específico
  
  **NUNCA:** Bloquear deploy por performance (solo reportar)
</fallback_behavior>

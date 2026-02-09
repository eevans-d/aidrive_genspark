---
name: PerformanceWatch
description: Monitoreo y optimizacion de rendimiento. Bundle size, queries lentas, metricas UX.
role: CODEX
impact: 0-1
chain: [DocuGuard]
---

# PerformanceWatch Skill

**ROL:** CODEX (estado frio). Analizar, medir, reportar. Proponer optimizaciones.
**PROTOCOLO:** "Medir antes de optimizar."

## Reglas de Automatizacion

1. Ejecutar analisis de bundle automaticamente post-build.
2. Detectar imports pesados y sugerir lazy loading.
3. Identificar queries N+1 en codigo.
4. Generar reporte con metricas y recomendaciones.
5. SI hay regresion de tamano > 10% -> alertar como WARNING.

## Activacion

**Activar cuando:**
- Build completado (analizar bundle size).
- Nueva feature agregada (verificar impacto).
- Usuario reporta lentitud.
- Pre-release audit.

**NO activar cuando:**
- Solo cambios de documentacion.
- Hotfix urgente (priorizar funcionalidad).

## Protocolo de Ejecucion

### FASE A: Bundle Analysis (Frontend)

1. **Medir bundle size:**
   ```bash
   cd minimarket-system && pnpm build 2>&1 | tail -20
   ```
2. **Buscar imports no optimizados:**
   ```bash
   grep -r "import \* as" minimarket-system/src/ --include="*.ts" --include="*.tsx" -l
   grep -r "from 'lodash'" minimarket-system/src/ --include="*.ts" --include="*.tsx" -l
   ```
3. **Detectar componentes sin lazy loading:**
   ```bash
   grep -r "import.*from.*pages/" minimarket-system/src/App.tsx
   ```
   Si no usa `React.lazy()` -> sugerir.

### FASE B: Query Analysis (Backend)

1. **Detectar N+1 potenciales:**
   ```bash
   grep -r "\.select(" supabase/functions/ --include="*.ts" -l
   ```
2. **Verificar paginacion:**
   ```bash
   grep -r "\.limit(" supabase/functions/ --include="*.ts" -c
   grep -r "\.range(" supabase/functions/ --include="*.ts" -c
   ```
3. **Buscar queries sin filtro:**
   ```bash
   grep -r "\.select(\"\*\")" supabase/functions/ --include="*.ts" -l
   ```

### FASE C: UX Performance Metrics

1. **Verificar estados de carga:**
   ```bash
   grep -r "isLoading" minimarket-system/src/ --include="*.tsx" -c
   ```
2. **Verificar skeleton/placeholder:**
   ```bash
   grep -r "Skeleton\|skeleton\|placeholder" minimarket-system/src/ --include="*.tsx" -l
   ```
3. **Detectar re-renders:**
   ```bash
   grep -r "useMemo\|useCallback\|React.memo" minimarket-system/src/ --include="*.tsx" -c
   ```

## Metricas y Umbrales

| Metrica | OK | Warning | Critical |
|---------|-----|---------|----------|
| Bundle (gzip) | < 100KB | 100-200KB | > 200KB |
| First Load | < 2s | 2-4s | > 4s |
| API Response | < 200ms | 200-500ms | > 500ms |
| Queries/Page | < 5 | 5-10 | > 10 |

## Salida Requerida

Generar/actualizar: `docs/PERFORMANCE_REPORT.md`

```markdown
# Performance Report
**Fecha:** [Date] | **Build Size:** [X KB gzip]

## Frontend Bundle
| Chunk | Size | Recommendation |
|-------|------|----------------|
| main.js | X KB | [OK/Optimize] |

## Backend Queries
- [x] Query X: OK (indexed)
- [ ] Query Y: WARNING (no pagination)

## Recommendations
1. [Optimizacion 1]
2. [Optimizacion 2]
```

## Anti-Loop / Stop-Conditions

**SI build falla al analizar:**
1. Usar output previo si existe.
2. Documentar limitacion.
3. Continuar con analisis estatico.

**SI bundle excede umbral critico:**
1. Listar top 5 dependencias mas pesadas.
2. Sugerir lazy loading especifico.
3. NO bloquear deploy (solo reportar).

**NUNCA:** Bloquear deploy por performance. Solo reportar.

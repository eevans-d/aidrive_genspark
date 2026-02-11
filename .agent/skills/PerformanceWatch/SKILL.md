---
name: PerformanceWatch
description: Monitoreo y optimizacion de rendimiento. Bundle size, queries lentas,
  metricas UX.
role: CODEX
version: 1.0.0
impact: HIGH
impact_legacy: 0-1
triggers:
  automatic:
  - orchestrator keyword match (PerformanceWatch)
  - 'after completion of: SentryOps'
  manual:
  - PerformanceWatch
  - performance
  - rendimiento
  - lento
chain:
  receives_from:
  - SentryOps
  sends_to:
  - DocuGuard
  required_before: []
priority: 6
---

# PerformanceWatch Skill

**ROL:** CODEX (estado frio). Analizar, medir, reportar. Proponer optimizaciones.
**PROTOCOLO:** "Medir antes de optimizar."

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos.

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

### FASE B: Query Analysis (Backend + Frontend)

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
   grep -r "\.select(\"*\")" supabase/functions/ --include="*.ts" -l
   ```
4. **Anti-patron: select('*') en frontend hooks (audit finding):**
   ```bash
   grep -rn "\.select('\*')" minimarket-system/src/hooks/ --include="*.ts" --include="*.tsx"
   ```
   Hooks con `select('*')` cargan todas las columnas innecesariamente. Reemplazar con columnas especificas.

5. **Materialized Views sin refresh:**
   ```bash
   grep -r "MATERIALIZED VIEW" supabase/migrations/ --include="*.sql" -l
   grep -r "REFRESH MATERIALIZED VIEW" supabase/migrations/ --include="*.sql" -l
   ```
   Si hay MVs sin cron de refresh -> datos desactualizados silenciosamente.

6. **Supabase Free-Tier Timeout Check:**
   El Free plan tiene timeout de **60 segundos**. Verificar funciones que pueden excederlo:
   ```bash
   # Funciones con scraping, loops, o procesamiento pesado:
   grep -rn "for.*of\|while\|forEach" supabase/functions/scraper-maxiconsumo/ --include="*.ts" | wc -l
   ```
   Si una funcion tiene loops complejos sobre datos externos -> riesgo de timeout en Free plan.

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

### FASE D: Baseline p50/p95 (Repo Script)

Ejecutar baseline de baja friccion (read-only) y registrar salida:
```bash
node scripts/perf-baseline.mjs 5
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

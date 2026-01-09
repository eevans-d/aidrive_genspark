# OBJETIVOS Y KPIS (v2)

**Estado:** vigente  
**Última actualización:** 2026-01-09  
**Alcance:** roadmap rolling 90 días (`docs/ROADMAP.md`)

---

## Objetivos

1. Mejorar mantenibilidad (eliminar monolitos y duplicacion).
2. Alinear DB con el codigo (migraciones versionadas).
3. Aumentar confiabilidad operativa (cron y scraper estables).
4. Unificar testing y habilitar CI minimo.
5. Mejorar observabilidad (logs estructurados y metricas basicas).

---

## KPIs propuestos (baseline -> target)

### Mantenibilidad
- **Funciones > 2000 lineas:** 3 -> 0
- **Archivos monoliticos (>1500 lineas):** 4+ -> 0
- **Duplicacion de utilidades CORS/logging/limiter:** multiple -> 1 implementacion

### DB alignment
- **Objetos DB sin migracion:** multiples -> 0
- **SQL funcional fuera de migraciones:** 0 (tareas_metricas ya versionado) -> 0

### Observabilidad
- **console.log en funciones criticas:** 180 -> 0
- **Logs con contexto (requestId/jobId):** no -> si

### Testing/CI
- **Framework de tests unificado:** no -> si
- **Tests ejecutables en CI:** no -> si
- **Cobertura mínima módulos críticos:** TBD -> >= 80% (propuesto)
- **Cobertura mínima total:** TBD -> >= 60% (propuesto)

### Operacion (cron/scraper)
- **Ejecuciones cron exitosas (7 dias):** TBD -> >= 98%
- **Scraper con parsing testeable:** no -> si

---

## Decisiones vigentes (ver `docs/DECISION_LOG.md`)
- D-004: Runner de integración (Vitest + Supabase local).
- D-005: Estándar de logging (`_shared/logger` + ids).
- D-006: Umbrales de cobertura (80% críticos / 60% total).

# OBJETIVOS Y KPIS (v1, borrador)

**Estado:** borrador para confirmacion  
**Alcance:** plan de 6 semanas (refactor + DB + testing + CI/CD)

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
- **Cobertura minima core modules:** TBD -> >= 60%

### Operacion (cron/scraper)
- **Ejecuciones cron exitosas (7 dias):** TBD -> >= 98%
- **Scraper con parsing testeable:** no -> si

---

## Pendientes de confirmacion
- Umbrales finales de cobertura.
- SLOs de cron (exitos/latencia).
- Limites de lineas por modulo.

# DECISION LOG

**Última actualización:** 2026-01-09  
**Propósito:** registrar decisiones para evitar ambigüedad en futuras sesiones.

| ID | Decisión | Estado | Fecha | Nota |
|----|----------|--------|-------|------|
| D-001 | Framework de tests unitarios = **Vitest** | Aprobada | 2026-01-09 | Unifica scripts y CI. |
| D-002 | Lockfiles requeridos (`package-lock.json`, `minimarket-system/pnpm-lock.yaml`) | Aprobada | 2026-01-09 | Reproducibilidad CI/local. |
| D-003 | Estrategia de ramas = **solo `main`** | Aprobada | 2026-01-09 | Simplifica delivery. |
| D-004 | Runner de integración (Vitest + Supabase local) | Propuesta | 2026-01-09 | Definir scripts/CI. |
| D-005 | Estándar de logging: `_shared/logger` + `requestId/jobId/runId` | Propuesta | 2026-01-09 | Pendiente adopción total. |
| D-006 | Cobertura mínima: **80% módulos críticos**, **60% total** | Propuesta | 2026-01-09 | Ajustar si cambia alcance. |

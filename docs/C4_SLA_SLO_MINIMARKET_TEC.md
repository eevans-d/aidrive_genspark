> [DEPRECADO: 2026-02-13] Documento historico/referencial. No usar como fuente primaria. Fuente vigente: `docs/ESTADO_ACTUAL.md`, `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md`, `docs/closure/OPEN_ISSUES.md`.

# C4 — SLA / SLO (MINI MARKET)

**Fecha:** 2026-01-22  
**Estado:** Borrador operativo

---

## 1) SLA (externo)
- Disponibilidad objetivo: **99.5%** (pendiente de aprobación).
- Ventana de mantenimiento: semanal (pendiente de aprobación).

## 2) SLO (interno)
- Latencia P95 API: **< 500 ms** (pendiente de medición real).
- Tasa de error 5xx: **< 1%**.
- Éxito de cron jobs: **> 98%**.

## 3) Métricas y fuentes
- Logs estructurados en Edge Functions.
- Métricas básicas en `cron_jobs_execution_log`.

## 4) Observaciones
- Valores sujetos a validación con datos reales.

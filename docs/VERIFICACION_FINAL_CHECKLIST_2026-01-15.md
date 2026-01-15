# Checklist de Verificación Final MPC (2026-01-15)

**Modo:** paso a paso, con tildes por tarea ejecutada.

## V1 — Integridad Estructural
- [x] Verificar existencia de archivos P0
- [x] Verificar existencia de archivos P1
- [x] Revisar fechas en headers (≥ 2026-01-14)
- [x] Validar que MPC_INDEX lista solo archivos existentes

## V2 — Coherencia C0 ↔ C1
- [x] Extraer activos/restricciones/deuda de C0
- [x] Verificar cobertura en C1 (alcance/restricciones/gaps)
- [x] Cruzar riesgos C0 vs RAID en C1
- [x] Validar Stakeholders vs Owners en PLAN_WS

## V3 — Coherencia C1 Interna
- [x] Mapear etapas E1–E5 y fases F1.1–F5.3
- [x] Validar que cada WS del ROADMAP existe en PLAN_WS
- [x] Verificar ADRs en C1 existen en DECISION_LOG
- [x] Validar prioridades P0/P1 sin contradicciones
- [x] Alinear checkpoints con CHECKLIST_CIERRE

## V4 — Coherencia Docs ↔ Código Real
- [x] Verificar existencia de funciones en supabase/functions/
- [x] Verificar estructura de tests/ vs CHECKLIST_CIERRE
- [x] Confirmar scripts (run-*.sh, rls_audit.sql)
- [x] Validar DECISION_LOG refleja Vitest (sin Jest)
- [x] Revisar arquitectura vs ARCHITECTURE_DOCUMENTATION

## V5 — Completitud MPC
- [x] Verificar MPC_INDEX cubre todo
- [x] Confirmar nivel Intermedio correcto (C0+C1+C4)
- [x] Verificar terminología TEC
- [x] Buscar placeholders [TODO], [PENDIENTE], TBD en P0

## V6 — Pulido Final
- [x] Corregir hallazgos P0/P1
- [x] Actualizar fechas inconsistentes
- [x] Ajustar referencias cruzadas
- [x] Actualizar CHECKLIST_CIERRE con estado real
- [x] Re-ejecutar checks críticos

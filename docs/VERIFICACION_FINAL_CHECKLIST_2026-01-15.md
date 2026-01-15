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

---

# Planificación Definitiva Final (Código Real)

**Objetivo:** cerrar brechas reales detectadas en código: RLS ausente en tablas P0, falta de `UNIQUE` en `productos.sku`, ausencia de `CHECK` en stock.

## Alcance
- Tablas P0: `productos`, `stock_deposito`, `movimientos_deposito`, `precios_historicos`, `proveedores`, `personal`.
- Constraints: `UNIQUE` en `productos.sku`, `CHECK` de no-negatividad y coherencia de stock.
- Políticas RLS: **permisivas** para `authenticated` (según decisión).

## Dependencias y Precondiciones
- Dataset actual sin duplicados de `sku` ni valores negativos de stock.
- Acceso a entorno local Supabase para validar migraciones.

## Fases de Ejecución

### Fase 1 — Diagnóstico de Datos (Pre-Constraint)
1. Ejecutar diagnóstico de duplicados en `productos.sku`.
2. Ejecutar diagnóstico de valores negativos en `stock_deposito`.
3. Resolver inconsistencias antes de aplicar constraints.

### Fase 2 — Integridad de Datos (Migración)
1. Crear migración `20260115010000_add_data_integrity_constraints.sql`.
2. Agregar `UNIQUE INDEX` en `productos.sku` (excluir `NULL`).
3. Agregar `CHECK` para `cantidad_actual >= 0`.
4. Agregar `CHECK` para `stock_minimo >= 0`.
5. Agregar `CHECK` para `stock_maximo >= stock_minimo`.

### Fase 3 — RLS Permisivo (Migración)
1. Crear migración `20260115020000_enable_rls_permissive.sql`.
2. Habilitar RLS en tablas P0.
3. Crear políticas `SELECT/INSERT/UPDATE/DELETE` para `authenticated`.
4. Restringir `personal` a `service_role` para escrituras si aplica.

### Fase 4 — Tests de Regresión
1. Test: `UNIQUE` en `productos.sku`.
2. Test: `CHECK` de stock no negativo.
3. Test: `authenticated` puede leer/escribir en tablas P0.

### Fase 5 — Validación Post-Deploy
1. Smoke test de frontend (login → CRUD básico).
2. Verificar que RLS está activo en todas las tablas P0.
3. Validar ausencia de errores RLS en logs de Edge Functions.

---

# Checklist de Ejecución (Para Tachar)

## Fase 1 — Diagnóstico de Datos
- [ ] Ejecutar query de duplicados en `productos.sku`
- [ ] Ejecutar query de stock negativo en `stock_deposito`
- [ ] Corregir inconsistencias detectadas

## Fase 2 — Integridad de Datos
- [ ] Crear migración `20260115010000_add_data_integrity_constraints.sql`
- [ ] Agregar `UNIQUE INDEX` en `productos.sku`
- [ ] Agregar `CHECK` `cantidad_actual >= 0`
- [ ] Agregar `CHECK` `stock_minimo >= 0`
- [ ] Agregar `CHECK` `stock_maximo >= stock_minimo`
- [ ] Aplicar migración en local

## Fase 3 — RLS Permisivo
- [ ] Crear migración `20260115020000_enable_rls_permissive.sql`
- [ ] `ENABLE ROW LEVEL SECURITY` en tablas P0
- [ ] Políticas permisivas para `authenticated`
- [ ] Política restringida para `personal` (si aplica)
- [ ] Aplicar migración en local

## Fase 4 — Tests de Regresión
- [ ] Crear tests de constraints
- [ ] Crear tests de RLS básico
- [ ] Ejecutar tests unitarios

## Fase 5 — Validación Post-Deploy
- [ ] Smoke test frontend
- [ ] Verificar RLS activo en tablas P0
- [ ] Verificar logs sin errores RLS

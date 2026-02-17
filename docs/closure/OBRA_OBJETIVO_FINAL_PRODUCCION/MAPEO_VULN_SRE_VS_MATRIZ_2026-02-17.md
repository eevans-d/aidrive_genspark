# Mapeo VULN-SRE vs Matriz de Contraste

- **Fecha:** 2026-02-17
- **Fuente SRE:** `docs/closure/REPORTE_AUDITORIA_SRE_DEFINITIVO_2026-02-17.md`
- **Fuente Matriz:** `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/MATRIZ_CONTRASTE_PREPROD_VS_OBJETIVO.md`

---

## Tabla de Mapeo

| VULN | Severidad SRE | Eje(s) de Matriz | Estado | Evidencia / Accion | Owner |
|---|---|---|---|---|---|
| VULN-001 | CRITICO | Eje 13 (CI/CD, backup y restore) | **CERRADO (D-128)** | `deploy.sh` corregido: `db push` para staging/production, `db reset` solo dev local. | Agente |
| VULN-002 | CRITICO | Eje 11 (Casos borde y concurrencia) | **CERRADO (D-126)** | `sp_procesar_venta_pos` hardened con `FOR UPDATE` en idempotency check + `EXCEPTION WHEN unique_violation`. Migración: `20260217100000`. | Agente |
| VULN-003 | ALTO | Eje 11 (Casos borde y concurrencia) | **CERRADO (D-129)** | `sp_movimiento_inventario` reescrito con `FOR UPDATE` en `stock_deposito` y `ordenes_compra`. Validación de pendiente dentro del SP. Migración: `20260217200000`. | Agente |
| VULN-004 | ALTO | Eje 11 (Casos borde y concurrencia) | **CERRADO (D-129)** | Nuevo `sp_actualizar_pago_pedido` con `FOR UPDATE` en `pedidos`. Reemplaza read-compute-write en handler. Migración: `20260217200000`. | Agente |
| VULN-005 | ALTO | Eje 10 (Rendimiento/escalabilidad), Eje 8 (Manejo de errores) | **PARCIAL** | Retry de scraper sin timeout: `AbortSignal.timeout` agregado en shared infra (D-126). Falta idempotency por `request_id` en scraper. | Agente (proxima sesion) |
| VULN-006 | ALTO | Eje 10 (Rendimiento/escalabilidad) | **PARCIAL** | Timeouts en `cron-notifications` agregados (D-126). Falta estandarizar `fetchWithTimeout` en todos los handlers de `api-proveedor`. | Agente (proxima sesion) |
| VULN-007 | MEDIO | Eje 14 (Observabilidad operativa) | **ABIERTO** | Health check con dependencias hardcodeadas como "healthy". Requiere probes reales con timeout. | Agente (proxima sesion) |
| VULN-008 | MEDIO | Eje 8 (Manejo de errores), Eje 11 (Casos borde) | **CERRADO (D-126)** | Frontend hardened con scanner lock, ESC guard, smart retry solo 5xx, optimistic updates. | Agente |

---

## Resumen de cobertura

| Estado | Cantidad | VULNs |
|---|---|---|
| CERRADO | 6 | VULN-001, VULN-002, VULN-003, VULN-004, VULN-008 |
| PARCIAL | 2 | VULN-005, VULN-006 |
| ABIERTO | 1 | VULN-007 |

---

## Impacto en Ejes de Matriz

| Eje | VULNs asociadas | Estado resultante |
|---|---|---|
| Eje 8 (Manejo de errores) | VULN-005, VULN-008 | PARCIAL (VULN-005 parcial) |
| Eje 10 (Rendimiento/escalabilidad) | VULN-005, VULN-006 | PARCIAL (timeouts parciales) |
| Eje 11 (Concurrencia) | VULN-002, VULN-003, VULN-004, VULN-008 | **ALINEADO** (todos cerrados) |
| Eje 13 (CI/CD) | VULN-001 | **ALINEADO** (corregido D-128) |
| Eje 14 (Observabilidad) | VULN-007 | PARCIAL (health check statico) |

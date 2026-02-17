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
| VULN-005 | ALTO | Eje 10 (Rendimiento/escalabilidad), Eje 8 (Manejo de errores) | **CERRADO (D-131)** | `fetchWithRetry` hardened: usa `fetchWithTimeout` internamente (`http.ts:6`), solo retry 5xx/429 (`http.ts:30-32`). `Idempotency-Key` en POST scrape/compare (`sincronizar.ts:76,110`). | Agente |
| VULN-006 | ALTO | Eje 10 (Rendimiento/escalabilidad) | **CERRADO (D-131)** | 8/8 handlers de `api-proveedor` usan `fetchWithTimeout` (5s main, 3s stats/count). Zero bare `fetch()` en handlers. Incluye: `precios.ts`, `productos.ts`, `comparacion.ts`, `alertas.ts`, `estadisticas.ts`, `configuracion.ts`, `sincronizar.ts`, `proveedores.ts`. | Agente |
| VULN-007 | MEDIO | Eje 14 (Observabilidad operativa) | **CERRADO (D-131)** | `checkExternalDependencies()` reescrito con probes HTTP reales via `fetchProbe()` con timeout 3s (`health.ts:101-116,146-157`). `checkScraperHealth` y `checkDatabaseHealth` usan `fetchWithTimeout` 5s. | Agente |
| VULN-008 | MEDIO | Eje 8 (Manejo de errores), Eje 11 (Casos borde) | **CERRADO (D-126)** | Frontend hardened con scanner lock, ESC guard, smart retry solo 5xx, optimistic updates. | Agente |

---

## Resumen de cobertura

| Estado | Cantidad | VULNs |
|---|---|---|
| CERRADO | 8 | VULN-001, VULN-002, VULN-003, VULN-004, VULN-005, VULN-006, VULN-007, VULN-008 |
| PARCIAL | 0 | — |
| ABIERTO | 0 | — |

---

## Impacto en Ejes de Matriz

| Eje | VULNs asociadas | Estado resultante |
|---|---|---|
| Eje 8 (Manejo de errores) | VULN-005, VULN-008 | **ALINEADO** (VULN-005 cerrada D-131, VULN-008 cerrada D-126) |
| Eje 10 (Rendimiento/escalabilidad) | VULN-005, VULN-006 | PARCIAL (VULNs cerradas; falta ciclo recurrente con umbrales) |
| Eje 11 (Concurrencia) | VULN-002, VULN-003, VULN-004, VULN-008 | **ALINEADO** (todos cerrados) |
| Eje 13 (CI/CD) | VULN-001 | **ALINEADO** (corregido D-128) |
| Eje 14 (Observabilidad) | VULN-007 | **ALINEADO** (probes reales D-131) |

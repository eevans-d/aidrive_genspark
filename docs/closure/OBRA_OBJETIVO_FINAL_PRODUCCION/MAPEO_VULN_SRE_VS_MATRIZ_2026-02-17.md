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
| VULN-003 | ALTO | Eje 11 (Casos borde y concurrencia) | **ABIERTO** | Recepción OC sin lock transaccional (`FOR UPDATE`). Requiere nuevo SP `sp_recepcionar_orden`. | Agente (proxima sesion) |
| VULN-004 | ALTO | Eje 11 (Casos borde y concurrencia) | **ABIERTO** | Pago de pedido con read-modify-write no atomico. Requiere nuevo SP `sp_actualizar_pago_pedido`. | Agente (proxima sesion) |
| VULN-005 | ALTO | Eje 10 (Rendimiento/escalabilidad), Eje 8 (Manejo de errores) | **PARCIAL** | Retry de scraper sin timeout: `AbortSignal.timeout` agregado en shared infra (D-126). Falta idempotency por `request_id` en scraper. | Agente (proxima sesion) |
| VULN-006 | ALTO | Eje 10 (Rendimiento/escalabilidad) | **PARCIAL** | Timeouts en `cron-notifications` agregados (D-126). Falta estandarizar `fetchWithTimeout` en todos los handlers de `api-proveedor`. | Agente (proxima sesion) |
| VULN-007 | MEDIO | Eje 14 (Observabilidad operativa) | **ABIERTO** | Health check con dependencias hardcodeadas como "healthy". Requiere probes reales con timeout. | Agente (proxima sesion) |
| VULN-008 | MEDIO | Eje 8 (Manejo de errores), Eje 11 (Casos borde) | **CERRADO (D-126)** | `queryClient.ts` actualizado: `refetchOnWindowFocus: true` era la propuesta pero se opto por smart retry en frontend (D-126). Frontend hardened con scanner lock, ESC guard, optimistic updates. | Agente |

---

## Resumen de cobertura

| Estado | Cantidad | VULNs |
|---|---|---|
| CERRADO | 4 | VULN-001, VULN-002, VULN-008, (VULN-001 en esta sesion) |
| PARCIAL | 2 | VULN-005, VULN-006 |
| ABIERTO | 2 | VULN-003, VULN-004 |

---

## Impacto en Ejes de Matriz

| Eje | VULNs asociadas | Estado resultante |
|---|---|---|
| Eje 8 (Manejo de errores) | VULN-005, VULN-008 | PARCIAL (VULN-005 parcial) |
| Eje 10 (Rendimiento/escalabilidad) | VULN-005, VULN-006 | PARCIAL (timeouts parciales) |
| Eje 11 (Concurrencia) | VULN-002, VULN-003, VULN-004, VULN-008 | PARCIAL (VULN-003 y VULN-004 abiertos) |
| Eje 13 (CI/CD) | VULN-001 | ALINEADO (corregido D-128) |
| Eje 14 (Observabilidad) | VULN-007 | PARCIAL (health check statico) |

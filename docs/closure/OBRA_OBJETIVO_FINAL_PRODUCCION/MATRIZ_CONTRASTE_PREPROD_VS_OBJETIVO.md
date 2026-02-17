# Matriz de Contraste: Preproduccion vs Obra Objetivo Final

- Fecha: `2026-02-17`
- Documento a contrastar: `docs/closure/REPORTE_AUDITORIA_PREPRODUCCION_DEFINITIVO_2026-02-16.md`
- Referencia objetivo: `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md`

## Escala de estado

- `ALINEADO`: cumple el criterio objetivo final.
- `PARCIAL`: implementado en parte, con brecha concreta pendiente.
- `NO_ALINEADO`: gap bloqueante frente al objetivo.
- `NO_APLICA`: fuera de alcance del eje.

---

## Matriz verificada (codigo real + docs)

| # | Eje de contraste | Estado 2026-02-17 | Gap exacto a cerrar | Evidencia primaria |
|---:|---|---|---|---|
| 1 | Identificacion/inventario base | PARCIAL | Ajustar drift en conteos historicos del reporte preprod vs estado actual | `docs/closure/REPORTE_AUDITORIA_PREPRODUCCION_DEFINITIVO_2026-02-16.md`, `docs/ESTADO_ACTUAL.md` |
| 2 | Arquitectura por capas | ALINEADO | Sin gap estructural mayor detectado | `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md` |
| 3 | Gateway `api-minimarket` (rutas) | ALINEADO | 35 literal + 20 regex = 55 guards. Inventario en `API_README.md:244-296` coincide con `index.ts`. Verificado D-132. | `supabase/functions/api-minimarket/index.ts`, `docs/API_README.md` |
| 4 | API proveedor: contrato vs runtime | ALINEADO | ~~spec publica `/scrape|/compare|/alerts` y omite `/health` runtime~~ CERRADO D-129: 14 mismatches corregidos, 3 endpoints fantasma eliminados, `/health` agregado | `docs/api-proveedor-openapi-3.1.yaml`, `supabase/functions/api-proveedor/schemas.ts` |
| 5 | API proveedor: restricciones de metodo | ALINEADO | ~~falta enforcement estricto por endpoint~~ CERRADO D-129: `allowedMethods` en `schemas.ts` + validacion en `router.ts` (405 para metodos invalidos) | `supabase/functions/api-proveedor/index.ts`, `supabase/functions/api-proveedor/router.ts` |
| 6 | Middleware/guards | ALINEADO | Ejes 4 y 5 cerrados (D-129). Enforcement HTTP + OpenAPI sync + auth guards + rate-limit/circuit-breaker con timeouts (D-126, D-131). | `supabase/functions/_shared/*`, `supabase/functions/api-minimarket/index.ts` |
| 7 | Modelo de datos/migraciones | ALINEADO | 43/43 migraciones synced (D-132). Schema doc actualizado. 5 SPs documentados. Migraciones de concurrency locks (D-126, D-129) aplicadas en remoto. | `supabase/migrations/*.sql`, `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` |
| 8 | Manejo de errores y validaciones | ALINEADO | `fetchWithTimeout` estandarizado en todos los handlers (D-131). `toAppError`/`fromFetchResponse` unificados. Circuit breaker + rate limiter con timeouts (D-126). Frontend: `ApiError` + smart retry solo 5xx (D-126). | `supabase/functions/api-minimarket/index.ts`, `supabase/functions/api-proveedor/index.ts` |
| 9 | Seguridad aplicativa | PARCIAL | cerrar pendientes operativos y asegurar evidencia remota reproducible | `docs/closure/OPEN_ISSUES.md`, evidencias security gates |
| 10 | Rendimiento/escalabilidad | PARCIAL | baseline existe, falta consolidar ciclo recurrente con umbrales de aceptacion | `docs/METRICS.md`, `docs/closure/OPEN_ISSUES.md` |
| 11 | Casos borde y concurrencia | ALINEADO | VULN-002 (sp_procesar_venta_pos FOR UPDATE + unique_violation, D-126), VULN-003 (sp_movimiento_inventario FOR UPDATE, D-129), VULN-004 (sp_actualizar_pago_pedido FOR UPDATE, D-129). Frontend race guards en Pos.tsx (D-126). | `tests/unit/*`, `tests/e2e/*` |
| 12 | Testing/calidad reproducible | NO_ALINEADO | integration no corre sin `.env.test` | `test-reports/quality-gates_20260217-032720.log` |
| 13 | CI/CD, backup y restore | PARCIAL | ejecutar y evidenciar ciclos periodicos completos en entorno objetivo | `.github/workflows/*`, `scripts/db-restore-drill.sh` |
| 14 | Observabilidad operativa | ALINEADO | VULN-007 cerrada (D-131): health checks reales con `fetchProbe` timeout 3s. Sentry activo (Gate 16). `cron-health-monitor` operativo. `cron-notifications` con timeouts en 7 fetch calls (D-126). | `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`, funciones `cron-health-*` |
| 15 | Continuidad entre sesiones IA | ALINEADO | mantener disciplina de cierre y handoff | `docs/closure/CONTINUIDAD_SESIONES.md`, este paquete |
| 16 | Coherencia temporal del reporte preprod | ALINEADO | Addendum D-132 agregado al reporte: 8 hallazgos historicos marcados como SUPERADO con referencia a remediacion (D-126..D-131). Cuerpo original preservado por trazabilidad. | `docs/closure/REPORTE_AUDITORIA_PREPRODUCCION_DEFINITIVO_2026-02-16.md` |
| 17 | Estado `reportes-automaticos` | ALINEADO | no gap de esquema detectado hoy en consulta de movimientos | `supabase/functions/reportes-automaticos/index.ts` |
| 18 | Veredicto GO 100/100 | PARCIAL | 12/18 ALINEADO, 5/18 PARCIAL (1,9,10,13,18), 1/18 NO_ALINEADO (eje 12: `.env.test` owner). Ejes criticos 4, 5 cerrados. Deploy D-132 completado (43/43 migrations, api-proveedor v19, api-minimarket v27). 8/8 VULNs SRE CERRADO. | esta matriz + `docs/ESTADO_ACTUAL.md` |

---

## Condicion de salida para declarar "Obra Alcanzada"

1. Todos los ejes quedan en `ALINEADO`.
2. Ejes `4`, `5`, `12` y `18` deben quedar `ALINEADO` sin excepciones.
3. `docs/ESTADO_ACTUAL.md` y `docs/closure/OPEN_ISSUES.md` deben reportar el mismo veredicto operativo final.

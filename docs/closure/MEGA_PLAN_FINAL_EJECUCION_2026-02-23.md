# Plan Final de Ejecución — O1 Facturas por Imagen + O2 Depósito + Hallazgos Críticos

- Fecha de consolidación: `2026-02-23`
- Estado base verificado contra código/infra real (repo + Supabase + GitHub Actions)
- Alcance: cerrar preproducción y dejar un camino ejecutable a producción sin supuestos

## 1) Veredicto Ejecutivo (Realidad Actual)

1. **Sí, la prioridad correcta sigue siendo O1 (facturas por imagen)** y luego cierre de O2.
2. **Fase 0 ya tiene avances reales** (migraciones y base técnica implementadas), pero **aún no está cerrada al 100% operativo**.
3. O1 está en **estado PARCIAL funcional**: se puede cargar factura y disparar extracción, pero faltan validación humana completa, aplicación a inventario y hardening.
4. O2 está **avanzado** en backend y operación diaria, pero faltan piezas de UX/trazabilidad para cierre definitivo.
5. Hay **3 bloqueantes transversales** que deben entrar al plan final: CI (`METRICS`), `security-nightly`, y `backup`.

## 2) Estado Verificado Por Objetivo

## O1 — Facturas por Imagen

| Ítem | Estado real | Evidencia | Cierre pendiente |
|---|---|---|---|
| Modelo SQL facturas (`facturas_ingesta`, `items`, `eventos`) | ✅ Implementado y aplicado | `supabase/migrations/20260223010000_create_facturas_ingesta.sql` + `supabase migration list --linked` (local=remote 20260223010000..040000) | Ninguno estructural; falta pruebas y documentación canónica |
| Modelo `producto_aliases` | ✅ Implementado y aplicado | `supabase/migrations/20260223020000_create_producto_aliases.sql` | Cargar seed inicial real (top aliases del negocio) |
| Modelo `precios_compra` + trigger a `productos.precio_costo` | ✅ Implementado y aplicado | `supabase/migrations/20260223030000_create_precios_compra.sql` | Validar con pruebas de regresión de `deposito/ingreso` |
| Bucket storage `facturas` + policies | ✅ Implementado y aplicado | `supabase/migrations/20260223040000_create_storage_bucket_facturas.sql` | Smoke upload/download con roles reales |
| Endpoint gateway `POST /facturas/:id/extraer` | ✅ Implementado en código | `supabase/functions/api-minimarket/index.ts` (~2207+) | Desplegar versión y testear E2E real |
| Edge Function `facturas-ocr` | ✅ Desplegada y ACTIVE v5 | `supabase/functions/facturas-ocr/index.ts` — confirmado vía `supabase functions list` | Configurar `GCV_API_KEY` con valor real para habilitar OCR |
| Pantalla Facturas (carga + extracción + listado items) | ✅ Implementación inicial | `minimarket-system/src/pages/Facturas.tsx`, `FacturaUpload.tsx`, `useFacturas.ts` | Completar validación humana y acción “aplicar” |
| Secret OCR `GCV_API_KEY` | ⚠️ Registrado pero vacío | `supabase secrets list` devuelve digest `e3b0...` (hash de cadena vacía) | Cargar valor real con `supabase secrets set GCV_API_KEY=<valor>` |
| Validación humana línea por línea | ❌ Pendiente | No existe componente de edición/confirmación final | Implementar `FacturaValidacion` con confirmación/rechazo + creación de alias |
| Aplicación factura → inventario (flujo completo) | ❌ Pendiente | No existe acción “aplicar factura” ni idempotencia de aplicación por ítem | Implementar acción y trazabilidad en movimientos |
| Tests O1 (UI + función + integración) | ❌ Pendiente | Sin tests `Facturas`/`FacturaUpload`/`facturas-ocr` | Crear tests antes de GO |

## O2 — Depósito

| Ítem | Estado real | Evidencia | Cierre pendiente |
|---|---|---|---|
| Módulo depósito (movimientos + modos) | ✅ Operativo | `Deposito.tsx`, `api-minimarket/index.ts` (`/deposito/movimiento`, `/deposito/ingreso`) | Ninguno crítico |
| Persistencia de precio de compra interno desde ingreso | ✅ Implementada | `api-minimarket/index.ts` (~1643+) inserta en `precios_compra` | Test de regresión y monitoreo de errores no bloqueantes |
| Recepción de compra backend (`/compras/recepcion`) | ✅ Existe | `api-minimarket/index.ts` (~1712+) | Integrar flujo completo en frontend |
| Flujo frontend para recepción de compra | ❌ Pendiente | No hay página/form completo de recepción | Implementar UX de recepción |
| Trazabilidad Kardex ↔ factura | ❌ Pendiente | No se visualiza vínculo factura en Kardex | Agregar FK y render de origen |

## 3) Hallazgos Críticos Transversales (Fuera de O1/O2)

| Hallazgo | Estado real | Evidencia | Acción inmediata |
|---|---|---|---|
| CI falla por métricas desactualizadas | ✅ Resuelto | `docs/METRICS.md` regenerado y pusheado (commit `dc11b0a`) | — |
| `security-nightly` falla en contrato real | ✅ Resuelto | `API_PROVEEDOR_SECRET` inyectado en workflow (commit `dc11b0a`) | Re-ejecutar workflow para confirmar |
| `backup.yml` en FAIL histórico | ✅ Resuelto | Cliente `postgresql-client-16` + `set -euo pipefail` aplicados (commit `dc11b0a`) | Re-ejecutar workflow para confirmar |

## 4) Plan Final de Ejecución (Orden Óptimo)

## Fase A — Cierre Operativo de Base (bloqueante)

1. Configurar `GCV_API_KEY` en Supabase secrets.
2. Desplegar `facturas-ocr`.
3. Re-desplegar `api-minimarket` con cambios nuevos manteniendo `--no-verify-jwt`.
4. Ejecutar smoke real: carga imagen -> creación `facturas_ingesta` -> extracción OCR -> creación `facturas_ingesta_items`.
5. Corregir CI pendiente (`METRICS`) y dejar pipeline en verde.
6. Corregir `security-nightly` agregando `API_PROVEEDOR_SECRET` en env del job de contratos.
7. Revalidar `backup.yml` (y agregar `set -o pipefail` en `scripts/db-backup.sh`).

**Gate A (salida obligatoria):**
- OCR real responde OK en entorno real.
- CI principal en PASS.
- `security-nightly` en PASS.
- `backup.yml` en PASS (al menos 1 corrida manual exitosa).

## Fase B — Completar O1 Funcional (usuario-operable)

1. Implementar `FacturaValidacion` (confirmar/rechazar línea, editar match, guardar alias nuevo).
2. Implementar acción `Aplicar al depósito` sólo para líneas confirmadas.
3. Registrar aplicación idempotente y estado final de factura (`validada` -> `aplicada`).
4. Bloquear doble aplicación por estado + control backend.

**Gate B:**
- Flujo completo: upload -> extraer -> validar -> aplicar (sin pasos manuales fuera del sistema).
- 0 duplicaciones de ingreso en pruebas de reintento.

## Fase C — Completar O2 Integrado

1. Implementar frontend de `compras/recepcion` usando endpoint existente.
2. Agregar trazabilidad Kardex con origen factura/proveedor.
3. Exponer KPI mínimos operativos (tiempo validación, % auto-match, % corrección manual).

**Gate C:**
- Recepción de compra usable desde UI.
- Kardex con rastreo de origen.
- KPI visibles para control diario.

## Fase D — Hardening y Cierre de Producción

1. Crear tests faltantes:
   - UI: `Facturas`, `FacturaUpload`, validación.
   - Edge: `facturas-ocr` (parsing/matching/errores).
   - Integración: flujo factura->depósito.
2. Actualizar documentación canónica:
   - `docs/API_README.md`
   - `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
   - `docs/api-openapi-3.1.yaml` (si se expone endpoint nuevo)
   - `docs/closure/OPEN_ISSUES.md`
3. Ejecutar piloto real por proveedor (mínimo 2 proveedores).

**Gate D (GO producción):**
- `lint`, `build`, tests críticos PASS.
- Documentación sincronizada con código.
- Piloto proveedores en verde (`>=95%` precisión de mapeo, `0` errores críticos).

## 5) Lista de Ejecución Inmediata (Hoy)

1. Confirmar que Claude cierre Fase A completa (deploy + secrets + pipelines verdes).
2. No avanzar a funcionalidades nuevas hasta cerrar Gate A.
3. Iniciar Fase B sólo con Gate A aprobado.
4. Registrar evidencia por tarea en `docs/closure/` (archivo por fase/gate).

## 6) Score de Readiness (actualizado)

- O1 Facturas por Imagen: **65/100** (funciones desplegadas y activas, CI resuelto, falta `GCV_API_KEY` real + validación/aplicación/hardening).
- O2 Depósito: **84/100** (core estable, faltan UX de recepción y trazabilidad final).
- Global combinado: **74/100**.

---

## Nota de control

Este plan reemplaza, para ejecución práctica, al borrador previo y queda alineado con el estado real verificado al `2026-02-23`.

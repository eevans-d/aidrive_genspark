# Restos de Cierre Verificados (2026-02-13)

## Objetivo
Identificar y cerrar detalles pendientes/incompletos tras la ejecución de hardening y RLS, dejando evidencia verificable y estado canónico.

## Matriz 15 restos

| ID | Detalle detectado | Verificación | Estado | Resolución / Acción |
|---|---|---|---|---|
| R-01 | Fallback legacy de `cron-testing-suite` | `./scripts/verify_5steps.sh` | ✅ Cerrado | Ref legacy no presente en `supabase/functions/cron-testing-suite/index.ts`. |
| R-02 | Credenciales visibles en login | `./scripts/verify_5steps.sh` + `rg` | ✅ Cerrado | Eliminadas credenciales hardcodeadas de `minimarket-system/src/pages/Login.tsx`. |
| R-03 | Links rotos de subplanes MPC en formato URL local legacy | `node scripts/validate-doc-links.mjs` | ✅ Cerrado | Enlaces reemplazados por rutas válidas `docs/mpc/C2_SUBPLAN_E1..E7_v1.1.0.md`. |
| R-04 | Referencia rota al plan legado de tres puntos | `./scripts/verify_5steps.sh` | ✅ Cerrado | Referencia normalizada en docs canónicas. |
| R-05 | Doc RLS con roles legacy desactualizados | Revisión manual + diff | ✅ Cerrado | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` actualizado (clientes/pedidos/detalle). |
| R-06 | Auditoría endpoint con rol `jefe` operativo | Revisión manual + diff | ✅ Cerrado | `docs/SECURITY_ENDPOINT_AUDIT.md` alineado (pago pedido: `admin|deposito`). |
| R-07 | Referencias canónicas faltantes en `docs/closure/` | scanner de links + `node scripts/validate-doc-links.mjs` | ✅ Cerrado | Se crearon/normalizaron archivos de continuidad para evitar roturas de referencia. |
| R-08 | Script de verificación 5 pasos inexistente | `ls scripts/verify_5steps.sh` | ✅ Cerrado | Script creado y ejecutable para revalidación rápida. |
| R-09 | `Login.tsx` con error inline heterogéneo | revisión de código | ✅ Cerrado | Migrado a `ErrorMessage` (`size="sm"`). |
| R-10 | `Clientes.tsx` con bloque rojo plano sin retry | revisión de código | ✅ Cerrado | Migrado a `ErrorMessage` con `onRetry` y `isFetching`. |
| R-11 | `Deposito.tsx` sin manejo homogéneo de error de catálogos | revisión de código | ✅ Cerrado | Añadido `ErrorMessage` para fallas de `productos/proveedores` con retry dual. |
| R-12 | `Pocket.tsx` sin feedback de error para catálogo de productos | revisión de código | ✅ Cerrado | Añadido `ErrorMessage` en modo scan cuando falla query de catálogo. |
| R-13 | `Pedidos.tsx` con `console.error` y error plano | `rg -n "console.error" minimarket-system/src/pages` | ✅ Cerrado | Reemplazo por `toast.error` + `ErrorMessage` con retry. |
| R-14 | Gate 16 (Sentry DSN real) | `docs/closure/OPEN_ISSUES.md` | ⚠️ Abierto (Owner) | Crear proyecto Sentry y definir `VITE_SENTRY_DSN` en entorno de despliegue. |
| R-15 | Revalidación SQL remota desde este host (IPv6) | `docs/closure/EVIDENCIA_RLS_REVALIDACION_2026-02-13.md` | ⚠️ Abierto (Infra) | Ejecutar `scripts/rls_audit.sql` + `scripts/rls_fine_validation.sql` desde runner con conectividad IPv6. |

## Resultado
- Restos cerrados por ejecución local/documental: **13/15**.
- Restos abiertos bloqueados por owner/infra: **2/15**.

## Próximo bloque de ejecución (orden recomendado)
1. Owner: cerrar Gate 16 (`VITE_SENTRY_DSN`) y adjuntar evidencia.
2. Infra: correr revalidación SQL RLS desde runner con IPv6 y registrar evidencia fechada.
3. DocuGuard final: actualizar `docs/closure/OPEN_ISSUES.md` y `docs/ESTADO_ACTUAL.md` con estado 15/15.

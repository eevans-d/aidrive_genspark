# Open Issues (Canónico)

**Última actualización:** 2026-02-11
**Fuente principal:** `docs/closure/CONTEXTO_CANONICO_AUDITORIA_2026-02-11.md`

---

## P0 (bloquean cierre Piloto)

| Pendiente | Gate | Estado | Evidencia actual | Siguiente acción |
|-----------|------|--------|------------------|------------------|
| E2E completo de POS (flujo venta end-to-end) | 3 | ⚠️ PARCIAL | UX POS mejorada, falta corrida E2E integral documentada. | Ejecutar smoke/flujo completo y registrar evidencia reproducible. |
| Canal real de alertas stock bajo al operador | 4 | ⚠️ PARCIAL | Cron auth + runtime mejorados; no hay canal final push/email/acción clara. | Activar canal operativo y validar recepción end-user. |
| Monitoreo real en producción | 16 | ❌ FALLA | Sentry bloqueado por DSN; sin alerting real activo. | Configurar DSN real + alerta y verificar evento de prueba. |
| Endurecimiento CI legacy suites | 18 | ⚠️ PARCIAL | Job opcional legacy con `continue-on-error`. | Definir política de gate verificable (al menos en scheduled/manual sin tolerar fallo). |

---

## P1 (riesgo medio)

| Pendiente | Estado | Siguiente acción |
|-----------|--------|------------------|
| Validación fina de RLS por reglas de negocio/rol | ⚠️ PARCIAL | Ejecutar batería SQL de validación de acceso por roles reales sobre tablas nuevas. |
| Backup automatizado (hoy manual) | ⚠️ PARCIAL | Definir scheduler externo + retención + prueba de restore periódica. |
| UX error coverage total (13/13 páginas) | ⚠️ PARCIAL | Completar páginas faltantes con ErrorMessage/Skeleton según criterio SP-D. |

---

## Notas operativas

- Migraciones: `36/36` local=remoto (verificado 2026-02-11).
- CORS productivo: corregido para dominio actual.
- `api-minimarket` debe mantenerse con `verify_jwt=false`.


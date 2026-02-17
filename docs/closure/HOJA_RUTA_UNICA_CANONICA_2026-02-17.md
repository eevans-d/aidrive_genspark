# HOJA DE RUTA UNICA CANONICA — Camino a Produccion 100%

**Fecha:** 2026-02-17
**Estado base:** Score operativo 92/100. Todos los P0 cerrados. Deploy D-127 completado.
**Fuentes consolidadas:**
- `docs/closure/REPORTE_AUDITORIA_SRE_DEFINITIVO_2026-02-17.md` (VULN-001..008)
- `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/MATRIZ_CONTRASTE_PREPROD_VS_OBJETIVO.md` (18 ejes)
- `docs/closure/OPEN_ISSUES.md` (pendientes operativos)
- `docs/closure/OBJETIVO_FINAL_PRODUCCION.md` (prerequisitos de activacion)

---

## Objetivo unico

Cerrar todos los ejes NO_ALINEADO de la matriz de contraste y resolver las VULNs SRE abiertas para declarar "Obra Alcanzada" (GO 100/100).

---

## Top 10 Prioridades (sin duplicados)

| # | Tarea | Severidad | Gate | DoD verificable | Dependencia |
|---|---|---|---|---|---|
| 1 | ~~Corregir `deploy.sh` (VULN-001)~~ | CRITICO | G13 | `grep "db reset --linked" deploy.sh` retorna 0 resultados | Ninguna. **CERRADO D-128** |
| 2 | Enforcement de metodo HTTP en `api-proveedor` (Eje 5) | CRITICO | G3 | Cada endpoint responde 405 a metodos no permitidos | Ninguna |
| 3 | Sincronizar OpenAPI `api-proveedor` con runtime (Eje 4) | CRITICO | G2 | `spec_only=[]`, `runtime_only=[]` en script de contraste | Depende de #2 |
| 4 | Quality gates de integracion reproducibles (Eje 12) | CRITICO | G6 | `npm run test:integration` PASS con `.env.test` configurado | Owner: proveer `.env.test` |
| 5 | Recepcion OC transaccional con lock (VULN-003) | ALTO | G3 | SP `sp_recepcionar_orden` con `FOR UPDATE` + test concurrente | Ninguna |
| 6 | Pago de pedido atomico (VULN-004) | ALTO | G3 | SP `sp_actualizar_pago_pedido` con lock + test | Ninguna |
| 7 | Health checks reales con probes (VULN-007) | MEDIO | G8 | `checkExternalDependencies()` hace fetch real con timeout | Ninguna |
| 8 | Idempotencia en sincronizacion scraper (VULN-005 residual) | MEDIO | G3 | Retry por `request_id`, deduplicacion server-side | Ninguna |
| 9 | Timeouts estandarizados en api-proveedor (VULN-006 residual) | MEDIO | G3 | Todos los handlers usan `fetchWithTimeout` | Depende de #8 |
| 10 | Activar `NOTIFICATIONS_MODE=real` en produccion | MEDIO | G4 | Smoke test con `cron-notifications` retorna 200 (no 503) | Owner: configurar secrets |

---

## Fases secuenciales

### Fase A — Quick Wins (ya completados en esta sesion)
- [x] VULN-001: deploy.sh corregido (D-128)
- [x] Referencias rotas a `.claude/plans/` eliminadas
- [x] Snapshots pre-deploy etiquetados como historicos
- [x] Reporte SRE canonizado en git
- [x] Objetivo final consolidado (unico documento maestro)
- [x] Mapeo VULN-SRE vs Matriz creado

### Fase B — Safety/Infra (D-129, COMPLETADA)
- [x] #2: Enforcement metodo HTTP en api-proveedor (405 para metodos invalidos)
- [x] #3: Sync OpenAPI proveedor (14 mismatches corregidos, 3 endpoints fantasma eliminados)
- [x] #5: SP `sp_movimiento_inventario` con FOR UPDATE (VULN-003)
- [x] #6: SP `sp_actualizar_pago_pedido` con lock atomico (VULN-004)

### Fase C — Observabilidad + Calidad (COMPLETADA parcial D-131)
- [ ] #4: Quality gates integracion (requiere `.env.test` del owner)
- [x] #7: Health checks reales (VULN-007 cerrada D-131)
- [x] #8: Idempotencia scraper (VULN-005 cerrada D-131)
- [x] #9: Timeouts api-proveedor (VULN-006 cerrada D-131)
- Rollback: no destructivo (solo agrega funcionalidad)

### Fase D — Operacion Productiva (owner)
- [ ] #10: Activar NOTIFICATIONS_MODE=real
- [ ] Configurar `SUPABASE_DB_URL` para backup automatizado (Gate 15)
- [ ] Revocar API key anterior de SendGrid
- [ ] Configurar `VITE_SENTRY_DSN` para error tracking
- Rollback: cambiar NOTIFICATIONS_MODE a simulation

---

## Condicion de salida (GO 100/100)

```
GO_100 = (
    todos_ejes_matriz == ALINEADO
    AND todos_VULN_SRE == CERRADO
    AND unit_tests_PASS
    AND integration_tests_PASS
    AND security_tests_PASS
    AND build_PASS
    AND NOTIFICATIONS_MODE == real
    AND VITE_SENTRY_DSN configurado
    AND backup_automatizado_verificado
)
```

---

## Single Source of Truth

| Que | Donde |
|---|---|
| Estado actual del proyecto | `docs/ESTADO_ACTUAL.md` |
| Decisiones tomadas | `docs/DECISION_LOG.md` |
| Issues abiertos/cerrados | `docs/closure/OPEN_ISSUES.md` |
| Objetivo final (maestro) | `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md` |
| Objetivo final (operativo/detallado) | `docs/closure/OBJETIVO_FINAL_PRODUCCION.md` (subordinado) |
| Auditoria SRE (hallazgos) | `docs/closure/REPORTE_AUDITORIA_SRE_DEFINITIVO_2026-02-17.md` |
| Mapeo VULN vs Matriz | `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/MAPEO_VULN_SRE_VS_MATRIZ_2026-02-17.md` |
| Roadmap unico | este documento |
| Continuidad entre sesiones | `docs/closure/CONTINUIDAD_SESIONES.md` |
| Indice de lectura canonico | `docs/closure/README_CANONICO.md` |
| API endpoints | `docs/API_README.md` |
| Esquema DB | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` |

---

_Documento canonico de roadmap. Actualizar en cada cierre de sesion que modifique prioridades._

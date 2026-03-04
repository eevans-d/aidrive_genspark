# CONTEXT PROMPT — CLAUDE CODE
## Ejecucion Secuencial De 15 Tareas Complejas (Con Auto-Continuidad)

**Fecha:** 2026-03-04 04:45 UTC  
**Proyecto:** `aidrive_genspark`  
**Fuente de verdad usada:** `docs/ESTADO_ACTUAL.md`, `docs/closure/OPEN_ISSUES.md`, `docs/DECISION_LOG.md`  
**Estado base confirmado:** sistema listo para produccion con backlog acotado; bloqueante externo principal `OCR-007`.

## Modo de ejecucion obligatorio para Claude Code

1. Ejecutar las tareas en orden `T01 -> T15`.
2. Si una tarea depende de factor externo (billing, credenciales, servicios terceros):
   - marcar `BLOCKED_EXTERNAL`,
   - registrar evidencia,
   - continuar inmediatamente con la siguiente tarea (`Tn+1`) sin esperar aprobacion.
3. No usar comandos destructivos.
4. No imprimir secretos/JWTs (solo nombres de variables).
5. Mantener `api-minimarket` con `verify_jwt=false` en caso de redeploy.
6. Al cerrar cada tarea, generar evidencia en `docs/closure/execution-logs/TXX_<YYYY-MM-DD_HHMMSS>.md`.

## Score de partida (para seguimiento)
- **Production Readiness Score inicial:** `86/100`
- Penalizaciones actuales: `OCR-007` (externo), `AUDIT-001` (hallazgos MEDIUM pendientes), migraciones pendientes.

## Plantilla obligatoria por tarea

```markdown
# TXX - <titulo>
- Estado: DONE | BLOCKED_EXTERNAL | PARTIAL
- Fecha: <UTC>
- Responsable: Claude Code
- Archivos tocados:
  - <ruta>
- Comandos ejecutados:
  - <cmd>
- Resultado:
  - <hechos verificables>
- Evidencia:
  - <ruta reporte/test>
- Siguiente accion:
  - <Tn+1 o follow-up>
```

---

## T01 — Desbloqueo OCR externo (OCR-007)
**Tipo:** Externo (no bloquea continuidad del plan)  
**Impacto:** 3  
**DoD:** OCR real deja de fallar por timeout/403 asociado a billing.

### Subtareas
- Verificar billing activo en GCP del proyecto de Vision.
- Verificar Vision API habilitada y key operativa (sin exponer valor).
- Ejecutar smoke real de `facturas-ocr`.

### Micro pasos
1. Registrar estado de billing (`ACTIVE`/`INACTIVE`) en evidencia.
2. Confirmar que `GCV_API_KEY` existe por nombre en entorno de Edge Function.
3. Invocar `POST /facturas/{id}/extraer` contra factura de prueba.
4. Si sigue bloqueado: `BLOCKED_EXTERNAL` y continuar con `T02`.

### Verificacion
- Evento OCR en BD cambia de timeout/403 a procesamiento valido o error funcional distinto a billing.

### Rollback
- No aplica (externo).

---

## T02 — Lock de concurrencia OCR en gateway (RC-01)
**Tipo:** Backend  
**Impacto:** 2  
**DoD:** dos requests simultaneos para misma factura no generan doble extraccion activa.

### Subtareas
- Implementar guard atomico por `factura_id` en `api-minimarket`.
- Retornar `409` consistente cuando haya proceso en curso.
- Crear tests de carrera.

### Micro pasos
1. Agregar pre-check de estado con condicion atomica.
2. Estandarizar codigo de error (`INVALID_STATE` o nuevo code consistente).
3. Añadir test concurrente en `tests/unit/`.
4. Ejecutar `npm run test:unit` (o subset + full al final).

### Verificacion
- Test concurrente PASS.
- No hay doble cambio de estado simultaneo para misma factura.

### Rollback
- Revertir cambios de handler y tests si falla compatibilidad.

---

## T03 — Transaccionalidad de insercion OCR (D1)
**Tipo:** Edge Function  
**Impacto:** 2  
**DoD:** no hay inserciones parciales de items OCR ante fallos.

### Subtareas
- Encapsular insercion de items en flujo transaccional/compensado.
- Registrar evento de rollback estructurado.
- Ajustar tests de error parcial.

### Micro pasos
1. Revisar `facturas-ocr/index.ts` ruta de insercion.
2. Convertir lote a all-or-nothing o compensacion completa.
3. Asegurar evento `ocr_rollback_items` (nombre consistente) con metadatos.
4. Correr tests unitarios OCR.

### Verificacion
- Caso de fallo parcial no deja items huérfanos.

### Rollback
- Restaurar estrategia previa y mantener reporte `PARTIAL`.

---

## T04 — Mutex interno de extraccion OCR en edge (D2)
**Tipo:** Edge Function  
**Impacto:** 2  
**DoD:** una sola extraccion activa por factura incluso si gateway falla en serializar.

### Subtareas
- Añadir mutex lógico (DB-backed preferido) por factura.
- Liberacion segura en success/error.
- Test de reentrada.

### Micro pasos
1. Crear lock temporal por `factura_id`.
2. Validar timeout/cleanup del lock.
3. Testear doble invocacion simultanea.

### Verificacion
- Segunda invocacion recibe rechazo controlado.

### Rollback
- Deshabilitar lock feature-flag si degrada throughput.

---

## T05 — Idempotencia en `POST /deposito/ingreso` (ID-02)
**Tipo:** Backend + SQL  
**Impacto:** 2  
**DoD:** reintento con misma key no duplica movimiento.

### Subtareas
- Añadir soporte `idempotency_key`.
- Persistir y deduplicar por clave.
- Tests de replay.

### Micro pasos
1. Crear migracion SQL (columna + indice único según diseño vigente).
2. Actualizar handler y contrato API.
3. Agregar tests de doble submit.
4. Actualizar docs API.

### Verificacion
- Misma key => mismo resultado, sin duplicado de inventario.

### Rollback
- Mantener endpoint legacy tras feature flag temporal.

---

## T06 — Idempotencia en `POST /compras/recepcion` (ID-03)
**Tipo:** Backend + SQL  
**Impacto:** 2  
**DoD:** reintento no duplica recepciones.

### Subtareas
- Repetir patrón de T05.
- Validar con pruebas de concurrencia.

### Micro pasos
1. Extender schema/handler para idempotencia.
2. Tests de replay y simultaneidad.
3. Verificar impactos en stock y kardex.

### Verificacion
- No hay doble efecto por retransmisión.

### Rollback
- Toggle a flujo anterior mientras se corrige.

---

## T07 — Error visible en fallo de `precio_compra` (ES-01)
**Tipo:** UX + Backend  
**Impacto:** 1  
**DoD:** fallo deja feedback visible al operador (no solo log).

### Subtareas
- Elevar warning silencioso a error funcional.
- Propagar mensaje legible al frontend.
- Agregar test de error UX.

### Micro pasos
1. Detectar punto de warning actual en flujo de ingreso.
2. Emitir error normalizado con `requestId`.
3. Mostrar `toast/error message` persistente en UI.

### Verificacion
- Usuario recibe error claro y accionable.

### Rollback
- Revertir a warning + marcar `PARTIAL`.

---

## T08 — Error visible en auto-validacion factura (ES-02)
**Tipo:** UX + Backend  
**Impacto:** 1  
**DoD:** si auto-validacion falla, operador lo ve y sabe siguiente accion.

### Subtareas
- Cambiar warning silencioso por respuesta de error/estado claro.
- Mostrar feedback en `Facturas.tsx`.

### Micro pasos
1. Localizar fallback silencioso en gateway.
2. Definir code y mensaje UX.
3. Añadir estado visible en UI y test.

### Verificacion
- Se muestra alerta/toast en escenario de fallo.

### Rollback
- Mantener warning pero registrar deuda documentada.

---

## T09 — Escalar `GET /reportes/efectividad-tareas` (RE-01)
**Tipo:** Performance  
**Impacto:** 1  
**DoD:** endpoint no crece en memoria de forma no acotada.

### Subtareas
- Mover agregacion pesada a SQL/SP o paginado.
- Limitar rango temporal por default.
- Medir p50/p95.

### Micro pasos
1. Perf profile baseline.
2. Refactor agregacion.
3. Perf compare before/after.

### Verificacion
- p95 y memoria dentro de budget definido.

### Rollback
- Mantener path legacy detrás de flag.

---

## T10 — Aplicar migraciones pendientes (4)
**Tipo:** Operacion DB  
**Impacto:** 3  
**DoD:** 4 migraciones aplicadas en entorno objetivo con smoke PASS.

### Subtareas
- Aplicar en staging.
- Ejecutar smoke funcional.
- Aplicar en produccion en ventana controlada.

### Micro pasos
1. `supabase db push` en staging.
2. Correr unit + integration + componentes + build.
3. Ejecutar checklist API mínimo.
4. Si staging PASS, repetir en prod.

### Verificacion
- Esquema alineado con repo; endpoints críticos estables.

### Rollback
- SQL rollback predefinido por migracion + backup previo.

---

## T11 — Completar `DATA_HANDLING_POLICY.md` (pendiente Tier 2)
**Tipo:** Documentacion compliance  
**Impacto:** 1  
**DoD:** política publicada y enlazada desde docs canónicos.

### Subtareas
- Definir clasificación de datos.
- Definir retención y borrado.
- Definir backup/restore y responsables.

### Micro pasos
1. Crear doc en `docs/`.
2. Agregar referencias desde `ESTADO_ACTUAL`/README si corresponde.
3. Validar consistencia con prácticas actuales.

### Verificacion
- DocuGuard PASS sin `DOC_FANTASMA`.

### Rollback
- No aplica.

---

## T12 — Baseline de performance v2 con presupuesto
**Tipo:** Performance + observabilidad  
**Impacto:** 1  
**DoD:** baseline versionado con p50/p95 por rutas críticas.

### Subtareas
- Medir endpoints y UI críticas.
- Publicar reporte en `docs/closure`.
- Definir thresholds de alerta.

### Micro pasos
1. Ejecutar script/colección de medición.
2. Consolidar resultados en markdown.
3. Establecer budgets por endpoint.

### Verificacion
- Reporte nuevo en `docs/closure` + thresholds definidos.

### Rollback
- No aplica.

---

## T13 — Nightly gates automáticos
**Tipo:** CI/CD  
**Impacto:** 2  
**DoD:** pipeline nocturno ejecuta gates y publica artefactos.

### Subtareas
- Configurar cron workflow en GitHub Actions.
- Ejecutar suites clave.
- Publicar resumen y alertado.

### Micro pasos
1. Crear/ajustar workflow scheduled.
2. Integrar comandos quality gates.
3. Guardar reporte en artefactos.

### Verificacion
- 3 corridas nocturnas consecutivas exitosas.

### Rollback
- Deshabilitar schedule si genera ruido excesivo.

---

## T14 — Asistente IA Sprint 3: `actualizar_estado_pedido`
**Tipo:** Producto + backend + frontend  
**Impacto:** 2  
**DoD:** intent disponible con flujo plan->confirm seguro.

### Subtareas
- Extender parser y plan card.
- Reusar confirm token.
- Aplicar matriz de permisos.

### Micro pasos
1. Nuevo intent + extracción de parámetros.
2. Ejecutor backend hacia endpoint correspondiente.
3. Tests unit/component/seguridad.

### Verificacion
- Intent funciona end-to-end con confirmación explícita.

### Rollback
- Feature flag para desactivar intent.

---

## T15 — Asistente IA Sprint 3: `aplicar_factura` + auditoría persistente
**Tipo:** Producto crítico  
**Impacto:** 3  
**DoD:** acción crítica asistida por IA con confirmación y trazabilidad persistente.

### Subtareas
- Intent de acción crítica con validaciones previas de estado OCR.
- Registro persistente de acciones IA (audit trail).
- UI admin para consultar historial.

### Micro pasos
1. Implementar intent y flujo plan->confirm reforzado.
2. Crear tabla/evento de auditoría IA.
3. Exponer consulta de historial en frontend.
4. Tests de seguridad y no-regresión.

### Verificacion
- Cada acción IA queda auditada con actor, parámetros y resultado.

### Rollback
- Desactivar intent y conservar modo consulta.

---

## Quality Gates globales (cada 2-3 tareas)
1. `npm run test:unit`
2. `npm run test:integration` (si entorno disponible)
3. `npm run test:e2e` (si entorno disponible)
4. `pnpm -C minimarket-system test:components`
5. `pnpm -C minimarket-system lint`
6. `pnpm -C minimarket-system build`
7. `docs: cierre DocuGuard con evidencia`

## Regla de continuidad por bloqueos externos

Si una tarea se bloquea por factor externo:
1. Crear evidencia `TXX_*` con estado `BLOCKED_EXTERNAL`.
2. Registrar causa externa concreta (servicio, cuenta, permiso, dependencia).
3. Registrar precondición de reintento.
4. Continuar de inmediato con la siguiente tarea secuencial.

## Cierre obligatorio de ciclo
- Actualizar `docs/ESTADO_ACTUAL.md`.
- Actualizar `docs/DECISION_LOG.md`.
- Actualizar `docs/closure/OPEN_ISSUES.md` (si cambia estado de un issue).
- Generar `docs/closure/SESSION_CLOSE_<timestamp>.md` con resumen de T01..T15.

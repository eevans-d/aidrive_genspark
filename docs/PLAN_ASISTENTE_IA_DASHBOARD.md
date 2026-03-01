# PLAN ASISTENTE IA EN DASHBOARD (V2 - EJECUTABLE)

**Fecha:** 2026-03-01
**Estado:** Sprint 1 COMPLETADO — Sprint 2 pendiente
**Objetivo:** habilitar un asistente conversacional para usuario no tecnico (principalmente perfil admin), que consulte y ejecute acciones del sistema con seguridad.

## 1) Estado actual de implementacion

**Sprint 1 (read-only) completado.** Implementacion verificada en:
- Ruta `/asistente` activa con `ProtectedRoute` admin-only: `minimarket-system/src/App.tsx:30,230`
- Pagina `Asistente.tsx` con chat, quick-prompts y sugerencias: `minimarket-system/src/pages/Asistente.tsx`
- Cliente API `assistantApi.ts` con `sendMessage()`: `minimarket-system/src/lib/assistantApi.ts`
- Edge Function `api-assistant` con parser rule-based y 5 handlers: `supabase/functions/api-assistant/index.ts`
- Parser separado para testabilidad (sin dependencias Deno): `supabase/functions/api-assistant/parser.ts`
- Permiso admin en `roles.ts`: `minimarket-system/src/lib/roles.ts:39`
- Nav item en sidebar: `minimarket-system/src/components/Layout.tsx:44`
- CTA en Dashboard: `minimarket-system/src/pages/Dashboard.tsx:21`
- 74 unit tests para parser: `tests/unit/assistant-intent-parser.test.ts`

**Pendiente:** deploy de `api-assistant` a Supabase (`supabase functions deploy api-assistant --use-api`, mantener `verify_jwt=true` por D-086).

## 2) Diseño real (sin humo)

## 2.1 UX objetivo para usuario no tecnico

En Dashboard aparece tarjeta: **"Asistente Operativo"** con 3 accesos:
1. "Consultar" (solo lectura)
2. "Pedir accion" (requiere confirmacion)
3. "Ver historial" (auditoria simple)

Flujo de uso:
1. Usuario escribe: "registrar pago 5000 de Juan Perez".
2. Asistente responde un **plan estructurado** (no ejecuta):
   - accion detectada
   - datos extraidos
   - validaciones
   - riesgo
3. Usuario presiona **Confirmar**.
4. Se ejecuta y se devuelve resultado + `request_id`.

## 2.2 Principio tecnico

El asistente **NO** implementa logica de negocio nueva.
Solo orquesta endpoints ya existentes del gateway `api-minimarket`.

## 3) Arquitectura concreta

## 3.1 Frontend

Artefactos Sprint 1 (implementados):
- `minimarket-system/src/pages/Asistente.tsx` — pagina chat completa
- `minimarket-system/src/lib/assistantApi.ts` — cliente API con auth JWT

Artefactos Sprint 2 (pendientes):
- `minimarket-system/src/components/assistant/AssistantPanel.tsx`
- `minimarket-system/src/components/assistant/ActionCard.tsx`
- `minimarket-system/src/components/assistant/ConfirmationModal.tsx`

Cambios Sprint 1 (implementados):
- Ruta `/asistente` en `App.tsx` con lazy loading.
- Permiso admin-only en `roles.ts`.
- CTA en `Dashboard.tsx` y nav item en `Layout.tsx`.

## 3.2 Backend

Nueva Edge Function:
- `supabase/functions/api-assistant/index.ts`

Responsabilidades:
1. Validar JWT y rol.
2. Parsear intencion.
3. Ejecutar consultas read-only via endpoints existentes (`api-minimarket`) y PostgREST cuando aplique.
4. Devolver respuesta estructurada por `POST /message`.
5. Rechazar cualquier operacion mutante en Sprint 1.
6. Registrar `request_id` para trazabilidad.

## 3.3 Modo de inteligencia (estrategia pragmatica)

MVP (semana 1-2):
- **Parser por reglas + plantillas** (sin LLM obligatorio).
- Ventaja: rapido, barato, predecible para comandos frecuentes.

Fase posterior:
- LLM opcional solo para NLU avanzada, manteniendo confirmacion obligatoria.

## 4) Mapa de intents -> endpoints reales existentes

## 4.1 Read-only (MVP inicial)

1. `consultar_stock_bajo`
- Endpoint: `GET /stock/minimo`
- Fuente: `api-minimarket/index.ts` (ruta 15)

2. `consultar_pedidos_pendientes`
- Endpoint: `GET /pedidos?estado=pendiente&limit=...`
- Fuente: `api-minimarket/index.ts` (ruta 24)

3. `consultar_resumen_cc`
- Endpoint: `GET /cuentas-corrientes/resumen`
- Fuente: `api-minimarket/index.ts` (ruta 36)

4. `consultar_ventas_dia`
- Endpoint: `GET /ventas?fecha_desde=...&fecha_hasta=...`
- Fuente: `api-minimarket/index.ts` (ruta 40)

5. `consultar_estado_ocr_facturas`
- Endpoint: lectura de `facturas_ingesta` (via query existente en frontend) o endpoint dedicado en fase 2.

## 4.2 Write con confirmacion (fase 2)

1. `crear_tarea`
- Endpoint: `POST /tareas`
- Payload real: `titulo`, `descripcion`, `prioridad`, `fecha_vencimiento?`

2. `registrar_pago_cc`
- Endpoint: `POST /cuentas-corrientes/pagos`
- Payload real: `cliente_id`, `monto`, `descripcion?`

3. `actualizar_estado_pedido`
- Endpoint: `PUT /pedidos/:id/estado`

4. `aplicar_factura`
- Endpoint: `POST /facturas/:id/aplicar`
- Mantiene validaciones existentes (`estado`, confianza OCR, lock optimista).

## 5) Contrato API del asistente

## 5.1 Sprint 1 (implementado) — `POST /message`

Request:
```json
{
  "message": "hay pedidos pendientes?",
  "context": {
    "ui_route": "/",
    "timezone": "America/Argentina/Buenos_Aires"
  }
}
```

Response:
```json
{
  "intent": "consultar_pedidos_pendientes",
  "confidence": 0.9,
  "mode": "answer",
  "answer": "Hay 3 pedidos pendientes...",
  "data": [
    { "id": "uuid", "numero_pedido": 1234 }
  ],
  "request_id": "..."
}
```

## 5.2 Sprint 2 (pendiente) — `POST /confirm`

Request:
```json
{
  "confirm_token": "token_1uso_120s"
}
```

Response:
```json
{
  "executed": true,
  "operation": "registrar_pago_cc",
  "result": {
    "cliente_id": "uuid",
    "saldo": 12000
  },
  "request_id": "..."
}
```

**Nota:** `POST /confirm` aun no existe en Sprint 1; queda como contrato objetivo para Sprint 2.

## 6) Guardrails obligatorios (produccion)

1. Rol inicial permitido: `admin`.
2. Allowlist cerrada de intents.
3. Ninguna escritura sin `confirm_token` valido.
4. `confirm_token` de un solo uso + expiracion corta.
5. Rechazo por ambiguedad: si hay mas de una entidad candidata, no ejecutar.
6. Auditoria de extremo a extremo (mensaje, plan, confirmacion, resultado, request_id, usuario).
7. Rate limit por usuario y por IP.
8. Timeout y circuit-breaker heredados del stack actual.

## 7) Plan de ejecucion por sprints

## Sprint 1 — MVP consulta — COMPLETADO (2026-03-01)

Entregables (todos implementados):
1. Ruta `/asistente` + UI basica con chat conversacional. ✅
2. `api-assistant` edge function con auth JWT interno. ✅
3. 5 intents read-only funcionando (parser rule-based). ✅
4. 74 unit tests para parser + edge cases. ✅
5. Quick-prompts + sugerencias inline en UI. ✅

Definition of Done (verificado):
- 0 escrituras habilitadas. ✅
- 95% de prompts del set de prueba con intent correcto. ✅ (74/74 tests PASS)
- Build y lint limpios. ✅

Evidencia: `tests/unit/assistant-intent-parser.test.ts`, `supabase/functions/api-assistant/`, `minimarket-system/src/pages/Asistente.tsx`

Pendiente post-Sprint 1:
- Deploy de `api-assistant` a Supabase Cloud (`supabase functions deploy api-assistant --use-api`).

## Sprint 2 (5 dias) - acciones confirmadas

Entregables:
1. Flujo `plan -> confirm`.
2. Acciones habilitadas: `crear_tarea`, `registrar_pago_cc`.
3. Auditoria persistente.
4. Manejo de ambiguedad y cancelacion.

Definition of Done:
- 0 ejecuciones sin confirmacion.
- 100% de acciones con registro auditable.
- 0 regresiones en tests existentes.

## Sprint 3 (3-5 dias) - hardening y adopcion

Entregables:
1. Acciones adicionales (`actualizar_estado_pedido`, `aplicar_factura` si corresponde).
2. Guia visual para usuario no tecnico.
3. Panel "historial de acciones IA".

Definition of Done:
- Piloto con usuario real (tu padre) completando 3 tareas sin asistencia tecnica.

## 8) Backlog tecnico priorizado (realista)

P0 (Sprint 1 — COMPLETADO):
1. ~~Crear `assistantApi.ts` (frontend).~~ ✅
2. ~~Crear page `Asistente.tsx`.~~ ✅
3. ~~Agregar ruta y permiso de rol.~~ ✅
4. ~~Crear `api-assistant` read-only.~~ ✅
5. ~~Parser de intents por reglas.~~ ✅

P1 (Sprint 2 — pendiente):
6. Resolver entidades (cliente/pedido/factura) con `searchApi` y validaciones.
7. Implementar `confirm_token` 1 uso.
8. Implementar acciones de escritura low-risk.

P2:
9. Auditoria de acciones IA y vista de historial.
10. Mejora de lenguaje natural (sin romper reglas de seguridad).

## 9) Riesgos reales y mitigacion

1. Ambiguedad de nombres (clientes repetidos).
- Mitigacion: forzar desambiguacion antes de confirmar.

2. Usuario no tecnico aprieta confirmar por error.
- Mitigacion: resumen en lenguaje claro + datos destacados + boton cancelar prominente.

3. Dependencia de LLM costosa/inestable.
- Mitigacion: MVP rule-based; LLM opcional despues.

4. Riesgo de "prompt injection".
- Mitigacion: nunca ejecutar texto libre; solo intents allowlist + payload validado.

## 10) KPI de exito

1. Tiempo promedio para "registrar pago" menor al flujo manual.
2. Tasa de finalizacion de tareas sin ayuda > 80% en piloto.
3. 0 incidentes de ejecucion no confirmada.
4. NPS interno del usuario objetivo >= 8/10.

## 11) Recomendacion ejecutiva

Sprint 1 (read-only) esta **COMPLETADO** y funcional.
Siguiente paso: deploy a produccion y comenzar Sprint 2 (acciones con confirmacion).
Ruta recomendada:
- Deployar `api-assistant` a Supabase Cloud
- Implementar Sprint 2 con `confirm_token` y acciones low-risk
- Recien despues evaluar LLM para mejorar interpretacion.

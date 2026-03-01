# CONTEXT PROMPT — CLAUDE CODE (EJECUCION EXCLUSIVA SPRINT 1 ASISTENTE IA)
## Proyecto: `aidrive_genspark`
## Fecha: 2026-03-01
## Modo: ejecucion tecnica exclusiva por Claude Code

Actua como ejecutor tecnico senior. No teorices. Implementa y valida.

## Mandato estricto
Debes ejecutar **solo Sprint 1 (MVP read-only)** del plan:
- Fuente: `docs/PLAN_ASISTENTE_IA_DASHBOARD.md`
- Alcance: consultas y UX de asistente sin escrituras en BD.
- Prohibido en esta sesion: acciones mutantes (`crear`, `actualizar`, `aplicar`, `pagar`).

## Objetivo de salida
Dejar operativo un asistente en Dashboard/route dedicada que:
1. reciba texto del usuario,
2. detecte intencion read-only,
3. consulte endpoints existentes,
4. devuelva respuesta clara y accionable,
5. no ejecute cambios de datos.

---

## Guardrails obligatorios
1. No imprimir secretos/JWT/API keys (solo nombres de variables).
2. No usar git destructivo (`git reset --hard`, `git checkout -- <file>`, force-push).
3. No implementar escrituras de negocio en esta sesion.
4. No duplicar logica de negocio existente en `api-minimarket`.
5. Mantener estilo y patrones actuales del repo.
6. Toda afirmacion final debe tener evidencia (archivo:linea o comando).

---

## Contexto canonico (leer antes de tocar)
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/PLAN_ASISTENTE_IA_DASHBOARD.md`
4. `docs/API_README.md`
5. `minimarket-system/src/lib/apiClient.ts`
6. `supabase/functions/api-minimarket/index.ts`

---

## Alcance tecnico exacto (Sprint 1)

## A) Frontend
Implementar:
1. Nueva pagina: `minimarket-system/src/pages/Asistente.tsx`
2. Nuevo cliente: `minimarket-system/src/lib/assistantApi.ts`
3. Nueva ruta protegida: `/asistente` en `minimarket-system/src/App.tsx`
4. Permiso de ruta en `minimarket-system/src/lib/roles.ts` (solo `admin`)
5. CTA de acceso desde Dashboard (`/`)

UI minima requerida:
- input de texto
- boton enviar
- historial simple (usuario/asistente)
- estado loading/error
- respuestas con `summary` + `request_id`

## B) Backend
Implementar nueva edge function read-only:
- `supabase/functions/api-assistant/index.ts`

Endpoints a exponer:
1. `POST /message`

Request:
```json
{ "message": "texto libre" }
```

Response minima:
```json
{
  "intent": "consultar_stock_bajo|consultar_pedidos_pendientes|consultar_resumen_cc|consultar_ventas_dia|consultar_estado_ocr_facturas|desconocido",
  "summary": "texto claro para usuario no tecnico",
  "data": {},
  "request_id": "..."
}
```

Parser de intenciones (v1):
- rule-based por keywords y regex.
- si hay ambiguedad => `desconocido` con sugerencias.

Intents read-only obligatorios:
1. `consultar_stock_bajo` -> `GET /stock/minimo`
2. `consultar_pedidos_pendientes` -> `GET /pedidos?estado=pendiente&limit=20`
3. `consultar_resumen_cc` -> `GET /cuentas-corrientes/resumen`
4. `consultar_ventas_dia` -> `GET /ventas?fecha_desde=...&fecha_hasta=...`
5. `consultar_estado_ocr_facturas` -> lectura agregada de `facturas_ingesta` (via PostgREST)

No incluir:
- `confirm_token`
- `POST /confirm`
- ningun endpoint de escritura

## C) Seguridad minima
- validar JWT (usar patrones actuales del repo)
- restringir rol a `admin`
- rate limit basico por IP/usuario (si reutilizable)
- incluir `x-request-id` y devolver `request_id`

---

## Plan de ejecucion (orden estricto)

### Fase 0 — Baseline
```bash
git status --short
git rev-parse --short HEAD
date -u +"%Y-%m-%d %H:%M:%S UTC"
```

### Fase 1 — Implementacion backend read-only
- crear `api-assistant` con parser e intents read-only
- consumir `api-minimarket` existente para consultas
- manejar errores con formato estandar (`success/error/request_id`)

### Fase 2 — Implementacion frontend
- crear `assistantApi.ts`
- crear `Asistente.tsx`
- agregar ruta en `App.tsx`
- agregar permiso en `roles.ts`
- agregar CTA en `Dashboard.tsx`

### Fase 3 — Tests
Minimo obligatorio:
1. Unit tests parser intents (backend)
2. Unit/component test basico de `Asistente.tsx` (render + envio + respuesta mock)

### Fase 4 — Validacion tecnica
Ejecutar:
```bash
npm run test:unit
pnpm -C minimarket-system test:components
pnpm -C minimarket-system build
pnpm -C minimarket-system lint
node scripts/validate-doc-links.mjs
```

Si algo falla:
- corregir y reintentar
- no cerrar con TODO pendiente

### Fase 5 — Documentacion minima
Actualizar solo si hubo cambios reales:
- `docs/API_README.md` (nueva edge function y endpoint `/message`)
- `docs/api-openapi-3.1.yaml` (si corresponde)
- `docs/ESTADO_ACTUAL.md` (estado Sprint 1)
- `docs/DECISION_LOG.md` (decision de alcance read-only)

---

## Criterios de aceptacion (DoD Sprint 1)
1. `/asistente` disponible para `admin` y oculto/no permitido para otros roles.
2. 5 intents read-only funcionando.
3. Ninguna accion de escritura habilitada desde asistente.
4. tests nuevos pasando + sin romper suite existente.
5. build/lint/docs-links en verde.
6. evidencia final con comandos y archivos.

---

## Formato de entrega final (obligatorio)
Responder con:
1. `Estado final`: `COMPLETADO` o `PARCIAL (BLOCKED)`
2. `Cambios implementados` (bullet list)
3. `Evidencia` (comandos + resultado resumido)
4. `Archivos modificados`
5. `Riesgos residuales` (si existen)
6. `Siguiente paso unico` (Sprint 2)

No agregar relleno.

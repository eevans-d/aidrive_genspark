> [DEPRECADO: 2026-02-13] Documento historico. No usar como fuente primaria. Fuente vigente: `docs/ESTADO_ACTUAL.md`, `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md`, `docs/closure/OPEN_ISSUES.md`.

# C2 — Subplan E4 Seguridad Operacional (MPC v2.1)

**Etapa:** E4  
**Fecha:** 2026-01-25  
**Versión:** 1.1.0  
**Estado:** ✅ Completado (WS7.5 aplicado)  

---


## Nota de ejecucion (para ejecutores)
- Seguir plantilla obligatoria definida en `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`.
- No improvisar comandos ni flujos fuera del plan.
- Registrar evidencia y actualizar `docs/CHECKLIST_CIERRE.md` y `docs/DECISION_LOG.md`.

## 1) Estado actual

- Auditoría RLS completada (WS7.1).
- CORS restringido por `ALLOWED_ORIGINS` (WS7.4).
- Lecturas sin service role en gateway (WS7.3).
- **Completado:** WS7.5 roles server-side (sin fallback a `user_metadata`).

---

## 1.1 Criterio WS7.5 (implementacion exacta)

- Fuente de rol: `app_metadata.role`.
- Prohibido usar `user_metadata` para autorizacion.
- Si `role` falta, denegar acceso (sin fallback).

## 2) Alcance

- **WS7.1** Auditoría RLS.
- **WS7.3** Gateway sin service role para lecturas normales.
- **WS7.4** CORS restringido por origen.
- **WS7.5** Roles server-side.

---

## 3) Evidencias y referencias

- Auditoría RLS: `docs/AUDITORIA_RLS_CHECKLIST.md`.
- CORS compartido: `supabase/functions/_shared/cors.ts`.
- Gateway principal: `supabase/functions/api-minimarket/index.ts`.
- Helpers auth: `supabase/functions/api-minimarket/helpers/auth.ts`.

---

## 4) Subtareas

| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| E4-T1 | Ejecutar auditoría RLS | ✅ | `docs/AUDITORIA_RLS_CHECKLIST.md` |
| E4-T2 | Verificar CORS por `ALLOWED_ORIGINS` | ✅ | `_shared/cors.ts` |
| E4-T3 | Verificar lecturas con anon/JWT | ✅ | `api-minimarket` |
| E4-T4 | Validar roles server-side (WS7.5) | ✅ | `supabase/functions/api-minimarket/helpers/auth.ts` |

---

## 5) Variables de entorno críticas

- `ALLOWED_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 6) Comandos exactos

- `rg -n "user_metadata" supabase/functions/api-minimarket` (no debe usarse para auth).
- `npx vitest run tests/unit/gateway-auth.test.ts` (roles).
- `npx vitest run tests/unit/gateway-validation.test.ts` (validaciones relacionadas).

## 7) Plan de testing

- Smoke con roles `anon/authenticated`.
- Unit tests de auth en gateway.

---

## 8) Plan de rollback

1. Revertir cambios de roles si rompen autorización.
2. Mantener CORS restrictivo en producción.

---

## 9) Checklist post-implementación

- [x] Auditoría RLS con evidencia.
- [x] CORS validado.
- [x] WS7.5 completado.

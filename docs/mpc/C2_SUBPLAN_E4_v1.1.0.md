# C2 — Subplan E4 Seguridad Operacional (MPC v2.1)

**Etapa:** E4  
**Fecha:** 2026-01-23  
**Versión:** 1.1.0  
**Estado:** ⚠️ Parcial (WS7.5 pendiente)  

---

## 1) Estado actual

- Auditoría RLS completada (WS7.1).
- CORS restringido por `ALLOWED_ORIGINS` (WS7.4).
- Lecturas sin service role en gateway (WS7.3).
- **Pendiente:** WS7.5 roles server-side contra tabla/claims (eliminar fallback a `user_metadata`).

---

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
| E4-T4 | Validar roles server-side (WS7.5) | ⏳ | Pendiente |

---

## 5) Variables de entorno críticas

- `ALLOWED_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 6) Plan de testing

- Smoke con roles `anon/authenticated`.
- Unit tests de auth en gateway.

---

## 7) Plan de rollback

1. Revertir cambios de roles si rompen autorización.
2. Mantener CORS restrictivo en producción.

---

## 8) Checklist post-implementación

- [x] Auditoría RLS con evidencia.
- [x] CORS validado.
- [ ] WS7.5 completado.

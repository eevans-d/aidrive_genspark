# C2 — Subplan E4 Seguridad Operacional (MPC v2.0)

**Etapa:** E4
**Fecha:** 2026-01-22
**Versión:** 1.0.0

---

## 1) Alcance

- **WS7.1** Auditoría RLS.
- **WS7.3** Gateway sin service role para lecturas normales.
- **WS7.4** CORS restringido por origen.
- **WS7.5** Roles server-side.

---

## 2) Referencias exactas (archivo:líneas)

- Auditoría RLS:
  - `scripts/rls_audit.sql:1-135`
- CORS compartido:
  - `supabase/functions/_shared/cors.ts`
- Gateway principal:
  - `supabase/functions/api-minimarket/index.ts`
- Validación roles:
  - `supabase/functions/_shared/auth.ts` (si aplica)

---

## 3) Subtareas (estimación en horas)

| ID | Tarea | Estimación | Entregable |
|---|---|---:|---|
| E4-T1 | Ejecutar auditoría RLS en staging/prod | 2h | Evidencia en docs/evidencias |
| E4-T2 | Verificar CORS por `ALLOWED_ORIGINS` | 1h | Config validada |
| E4-T3 | Verificar lecturas con anon/JWT | 2h | Evidencia en logs/tests |
| E4-T4 | Validar roles server-side | 2h | Evidencia en handlers |

---

## 4) Variables de entorno críticas

- `ALLOWED_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 5) Plan de testing

- **Smoke:** endpoints críticos con roles `anon/authenticated`.
- **RLS:** ejecutar `scripts/rls_audit.sql` y guardar salida.

---

## 6) Plan de rollback

1. Revertir cambios de CORS/roles en env.
2. Revertir migraciones de políticas si aplica.

---

## 7) Checklist pre-implementación

- [ ] Credenciales staging/prod disponibles.
- [ ] Ventana de ejecución aprobada.

## 8) Checklist post-implementación

- [ ] Evidencia de auditoría RLS guardada.
- [ ] CORS validado por origen.
- [ ] Roles server-side verificados.

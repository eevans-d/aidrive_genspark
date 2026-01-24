# C2 — Subplan E9 Gestion de secretos y accesos (MPC v2.1)

**Etapa:** E9  
**Fecha:** 2026-01-24  
**Version:** 1.1.0  
**Estado:** ⏳ En progreso  

---


## Nota de ejecucion (para ejecutores)
- Seguir plantilla obligatoria definida en `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`.
- No improvisar comandos ni flujos fuera del plan.
- Registrar evidencia y actualizar `docs/CHECKLIST_CIERRE.md` y `docs/DECISION_LOG.md`.

## 1) Estado actual

- Inventario base creado en `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md` (sin claves).
- `docs/OBTENER_SECRETOS.md` actualizado con estado y pasos.
- `ALLOWED_ORIGINS` alineado en Supabase/GitHub (local-only).
- `API_PROVEEDOR_SECRET` regenerado y alineado (Supabase/GitHub/.env.test).
- `SUPABASE_*` claves copiadas a `.env.test` (sin exponer valores).
- Validacion parcial: `migrate.sh status staging` OK; `auth.real` fallo por login (pendiente sincronizar `TEST_PASSWORD`).

---

## 2) Alcance

- Completar inventario de secretos y owners.
- Validar ausencia de secretos en repo.
- Definir y registrar rotacion de credenciales.
- Ejecutar validaciones minimas sin exponer valores.

---

## 3) Evidencias y referencias

- Inventario: `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md`.
- Fuente operativa: `docs/OBTENER_SECRETOS.md`.
- Decision log: `docs/DECISION_LOG.md`.

---

## 4) Subtareas

| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| E9-T1 | Validar inventario completo de secretos | ✅ | `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md` |
| E9-T2 | Comprobar ausencia de secretos en repo | ✅ | `git ls-files | rg -n "\\.env\\.test$"` |
| E9-T3 | Registrar rotacion y owners | ⏳ (parcial) | `docs/DECISION_LOG.md` |
| E9-T4 | Validaciones minimas sin exponer valores | ⏳ (parcial) | `migrate.sh status staging` OK; `auth.real` FAIL (login) |

---

## 5) Variables de entorno criticas

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `ALLOWED_ORIGINS`
- `API_PROVEEDOR_SECRET`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_GATEWAY_URL`

---

## 6) Comandos exactos

- `rg -n "SUPABASE_.*KEY|API_PROVEEDOR_SECRET|DATABASE_URL|VITE_SUPABASE" docs` (sin claves reales; solo valores no sensibles).
- `rg -n "SUPABASE_SERVICE_ROLE_KEY" minimarket-system` (debe devolver 0).
- `git ls-files -z | xargs -0 rg -n "eyJ[A-Za-z0-9_-]{10,}"` (debe devolver 0 o tokens de tests mockeados).
- `git ls-files | rg -n "\.env"` (solo `.env.example`/plantillas si existen).
- `scripts/run-integration-tests.sh --dry-run` (verifica variables requeridas).

---

## 7) Plan de testing

- Ejecutar `scripts/run-integration-tests.sh --dry-run`.
- Ejecutar `./migrate.sh status staging` si hay acceso.
- Re-ejecutar `auth.real` luego de sincronizar `TEST_PASSWORD`.
- No imprimir valores en consola ni logs.

---

## 8) Plan de rollback

1. Revertir cambios de secrets en Supabase/CI si se aplicaron valores errados.
2. Restaurar variables previas desde el secreto manager.
3. Re-ejecutar `scripts/run-integration-tests.sh --dry-run`.

---

## 9) Checklist post-implementacion

- [ ] Inventario de secretos completo y validado.
- [ ] Repo sin valores sensibles.
- [ ] Rotacion documentada en `docs/DECISION_LOG.md`.
- [ ] Evidencia de validaciones registrada.

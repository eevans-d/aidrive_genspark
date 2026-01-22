# C2 — Subplan E3 DB & Migraciones (MPC v2.0)

**Etapa:** E3
**Fecha:** 2026-01-22
**Versión:** 1.0.0

---

## 1) Alcance

- **WS3.1** Validación de migraciones en staging/prod.
- **WS3.2** Rollback documentado.

> Nota: Auditoría RLS se ejecuta en E4 Seguridad (WS7.1).

---

## 2) Referencias exactas (archivo:líneas)

- Config Supabase local:
  - `supabase/config.toml:1-170`
- Migraciones:
  - `supabase/migrations/` (ordenado por timestamp)

---

## 3) Subtareas (estimación en horas)

| ID | Tarea | Estimación | Entregable |
|---|---|---:|---|
| E3-T1 | Validar migraciones recientes | 3h | Checklist por entorno |
| E3-T2 | Documentar rollback | 2h | Pasos reproducibles |

---

## 4) Variables de entorno críticas

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 5) Plan de testing

### Unitario (SQL)
- Validar scripts en entorno local con Supabase local.

### Integración (staging)
- Validar migraciones aplicadas y consistencia de schema.

### E2E (validación operativa)
- Confirmar endpoints críticos con roles `anon/authenticated`.

---

## 6) Plan de rollback

1. Identificar migración a revertir (timestamp en `supabase/migrations/`).
2. Ejecutar rollback manual o `supabase db reset` en entorno controlado.
3. Verificar que el schema vuelva al estado anterior.

---

## 7) Checklist pre-implementación

- [ ] Credenciales staging/prod disponibles.
- [ ] Ventana de ejecución aprobada.
- [ ] Backup existente o snapshot previo.

## 8) Checklist post-implementación

- [ ] Migraciones validadas por entorno.
- [ ] Rollback documentado y verificado.

# Evidencia Revalidación RLS - 2026-02-13

## Alcance
- Plan definitivo pre-producción: Control de Acceso (Roles + RLS Fine Validation).
- Ejecución enfocada en pasos operativos A-D (sin cambios de contrato HTTP).

## Paso A — Revalidación técnica SQL (staging)

### Comandos intentados
```bash
supabase migration list --db-url "$DATABASE_URL"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/rls_audit.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "select set_config('rls_fine.write_tests','1',false);" \
  -f scripts/rls_fine_validation.sql
```

### Resultado
- Estado: **BLOCKED (entorno)**.
- Causa real: el host ejecutor no tiene salida IPv6 a `db.<project-ref>.supabase.co:5432`.
- Error observado: `Network is unreachable`.

### Acción pendiente
- Re-ejecutar los 3 comandos desde runner con conectividad IPv6 (o conexión DB alternativa válida) y guardar:
  - `docs/closure/EVIDENCIA_RLS_AUDIT_YYYY-MM-DD.log`
  - `docs/closure/EVIDENCIA_RLS_FINE_YYYY-MM-DD.log`

## Paso B — Smoke funcional por rol (app + gateway)

### Preparación ejecutada
```bash
node scripts/supabase-admin-sync-role.mjs "$TEST_USER_ADMIN" admin
node scripts/supabase-admin-sync-role.mjs "$TEST_USER_VENTAS" ventas
node scripts/supabase-admin-sync-role.mjs "$TEST_USER_DEPOSITO" deposito
```

### Verificación ejecutada
- Evidencia: `docs/closure/EVIDENCIA_RLS_SMOKE_ROLES_2026-02-13.md`
- Resultado: **3/3 PASS**
  - `admin`: `/clientes` 200, `/pedidos` 200
  - `ventas`: `/clientes` 200, `/pedidos` 200
  - `deposito`: `/clientes` 403, `/pedidos` 200

## Paso C — Higiene de consistencia
- Se documentó explícitamente que referencias históricas a `checkRole(['admin','deposito','jefe'])` en logs/worktrees son **no canónicas**.
- Canon operativo vigente: `admin|deposito|ventas` + alias de compatibilidad `jefe -> admin`.

## Paso D — Cierre documental mínimo
- Actualizado `docs/AUDITORIA_RLS_CHECKLIST.md` con addendum de revalidación 2026-02-13.
- Actualizado `docs/closure/OPEN_ISSUES.md` con:
  - estado de smoke por rol 2026-02-13;
  - bloqueo técnico de revalidación SQL por IPv6;
  - nota de canon/histórico para `jefe`.

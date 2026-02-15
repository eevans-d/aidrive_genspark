# Auditoría RLS - Checklist y Scripts

**Estado:** ✅ **COMPLETADO (P0) 2026-01-23 + REVALIDADO (P1) 2026-02-12**  
**Fecha actualización:** 2026-02-12  
**Propósito:** Auditoría RLS del sistema Mini Market  
**Resultado:** ✅ TODAS LAS TABLAS PROTEGIDAS

---

## 📋 Resumen Ejecutivo

Auditoría completada el 2026-01-23. **Todas las tablas P0 tienen RLS activo** y bloquean acceso a usuarios anónimos.

### Addendum 2026-02-12 — Validación fina por rol (P1)

Se cerró el pendiente P1 “Validación fina de RLS por reglas de negocio/rol” con:
- Migración: `supabase/migrations/20260212130000_rls_fine_validation_lockdown.sql`
- Evidencia (post‑migración):
  - `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-12.log`
  - `docs/closure/EVIDENCIA_RLS_FINE_2026-02-12.log` (**0 FAIL**, `write_tests=1`)
- Script reproducible:
  - `scripts/rls_fine_validation.sql`

### Addendum 2026-02-13 — Revalidación operativa

- Smoke por rol en gateway (`/clientes`, `/pedidos`) en PASS:
  - Evidencia: `docs/closure/EVIDENCIA_RLS_SMOKE_ROLES_2026-02-13.md`.
- Revalidación SQL remota completada en este host usando pooler:
  - `scripts/rls_audit.sql` ejecutado: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log`.
  - `scripts/rls_fine_validation.sql` ejecutado con `write_tests=1`: `docs/closure/EVIDENCIA_RLS_FINE_2026-02-13.log` (**60/60 PASS, 0 FAIL**).
  - Evidencia de procedimiento: `docs/closure/EVIDENCIA_RLS_REVALIDACION_2026-02-13.md`.

### Resultado de la Auditoría
- **Tablas P0 verificadas:** 7/7 protegidas ✅
- **Tablas P2/P3 verificadas:** 4/4 bloqueadas para anon ✅
- **Exposiciones detectadas:** 0
- **Acciones requeridas:** Ninguna

### Método de Verificación
Se ejecutaron queries REST API con `anon` key contra cada tabla P0:
- Resultado esperado: `[]` (array vacío)
- Resultado obtenido: `[]` en todas las tablas

---

## 🗂️ Tablas Críticas por Nivel de Riesgo

### P0 - Crítico (datos sensibles / financieros)
| Tabla | RLS Enabled | Políticas | Riesgo sin RLS |
|-------|-------------|-----------|----------------|
| `productos` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Precios expuestos |
| `stock_deposito` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Inventario expuesto |
| `movimientos_deposito` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Historial de operaciones |
| `precios_historicos` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Historial de precios |
| `proveedores` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Datos comerciales |
| `personal` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Datos personales (GDPR) |
| `categorias` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Clasificación |

### P1 - Alto (operaciones internas)
| Tabla | RLS Enabled | Políticas | Notas |
|-------|-------------|-----------|-------|
| `tareas_pendientes` | ✅ Enabled | SELECT/INSERT/UPDATE/DELETE para `authenticated` | Migración `20260104083000` |
| `stock_reservado` | ✅ Enabled | SELECT para `authenticated` | Solo lectura |
| `ordenes_compra` | ✅ Enabled | SELECT para `authenticated` | Solo lectura |

### P1 - Alto (operación comercial por rol)
| Tabla/Vista | Control | Políticas | Evidencia |
|------------|---------|-----------|-----------|
| `clientes` | ✅ RLS | SELECT/INSERT/UPDATE `admin|ventas`; DELETE solo `admin` | `EVIDENCIA_RLS_FINE_2026-02-12.log` |
| `pedidos` | ✅ RLS | SELECT/INSERT/UPDATE `admin|deposito|ventas`; DELETE solo `admin` | `EVIDENCIA_RLS_FINE_2026-02-12.log` |
| `detalle_pedidos` | ✅ RLS | SELECT/INSERT/UPDATE `admin|deposito|ventas`; DELETE solo `admin` | `EVIDENCIA_RLS_FINE_2026-02-12.log` |
| `personal` | ✅ RLS | SELECT self only; unique `user_auth_id` | `EVIDENCIA_RLS_AUDIT_2026-02-12.log` |
| `vista_cc_saldos_por_cliente` | ✅ security_invoker | Respeta RLS de `clientes` | `EVIDENCIA_RLS_FINE_2026-02-12.log` |
| `vista_cc_resumen` | ✅ security_invoker | Respeta RLS de `vista_cc_saldos_por_cliente` | `EVIDENCIA_RLS_FINE_2026-02-12.log` |

### P2 - Medio (scraping / cron - solo service_role)
| Tabla | RLS Enabled | Políticas | Notas |
|-------|-------------|-----------|-------|
| `precios_proveedor` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Datos de scraping |
| `comparacion_precios` | ✅ Enabled | Sin políticas (service_role bypass) | Interno |
| `alertas_cambios_precios` | ✅ Enabled | Sin políticas (service_role bypass) | Interno |
| `configuracion_proveedor` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Interno |
| `estadisticas_scraping` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Interno |

### P3 - Bajo (cron jobs - solo service_role)
| Tabla | RLS Enabled | Políticas | Notas |
|-------|-------------|-----------|-------|
| `cron_jobs_tracking` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Interno |
| `cron_jobs_execution_log` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Interno |
| `cron_jobs_alerts` | ✅ Verificado 2026-01-23 | Bloqueado para anon | Interno |
| `cron_jobs_notifications` | ✅ Enabled | Sin políticas | Interno |
| `cron_jobs_metrics` | ✅ Enabled | Sin políticas | Interno |
| `cron_jobs_monitoring_history` | ✅ Enabled | Sin políticas | Interno |
| `cron_jobs_health_checks` | ✅ Enabled | Sin políticas | Interno |
| `cron_jobs_config` | ✅ Enabled | Sin políticas | Interno |
| `cron_jobs_notification_preferences` | ✅ Enabled | Sin políticas | Interno |

---

## 🔍 Queries de Validación

### 1. Verificar RLS habilitado por tabla
```sql
-- Ejecutar con service_role o psql directo
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rls_enabled DESC, tablename;
```

### 2. Listar políticas RLS existentes
```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Tablas SIN RLS habilitado (riesgo)
```sql
SELECT tablename
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false
ORDER BY tablename;
```

### 4. Tablas CON RLS pero SIN políticas (bloqueadas)
```sql
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;
```

### 5. Verificar funciones SECURITY DEFINER
```sql
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    proconfig as config
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND prosecdef = true
ORDER BY proname;
```

### 6. Test de acceso con anon key (debe fallar en tablas internas)
```sql
-- Ejecutar como anon role
SET ROLE anon;

-- Estas deben retornar 0 filas (RLS sin políticas)
SELECT COUNT(*) FROM cron_jobs_execution_log;
SELECT COUNT(*) FROM configuracion_proveedor;
SELECT COUNT(*) FROM estadisticas_scraping;

-- Estas deben retornar datos (políticas para authenticated)
-- Primero: SET ROLE authenticated;
-- SELECT COUNT(*) FROM tareas_pendientes;

RESET ROLE;
```

### 7. Test de acceso con authenticated (debe funcionar en tablas de UI)
```sql
-- Simular usuario autenticado
SET ROLE authenticated;

-- Estas deben funcionar
SELECT COUNT(*) FROM tareas_pendientes;
SELECT COUNT(*) FROM stock_reservado;
SELECT COUNT(*) FROM ordenes_compra;

RESET ROLE;
```

---

## 🛠️ Comandos Supabase CLI

### Prerequisitos
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Vincular proyecto
supabase link --project-ref <project-id>
```

### Inspeccionar RLS
```bash
# Ver estado de tablas
supabase db lint

# Dump schema con RLS
supabase db dump --schema public -f schema_dump.sql

# Ver políticas actuales
supabase db dump --schema public --data-only=false | grep -A5 "CREATE POLICY"
```

### Ejecutar queries de auditoría
```bash
# Opción 1: Via psql directo
psql $DATABASE_URL -f scripts/rls_audit.sql

# Opción 2: Via psql + pooler (si DATABASE_URL por host db.* falla en IPv6)
# - user/host/port desde supabase/.temp/pooler-url
# - password desde DATABASE_URL local
# (ver ejemplo completo en docs/closure/EVIDENCIA_RLS_REVALIDACION_2026-02-13.md)

# Opción 3: Via Supabase Studio (Dashboard)
# SQL Editor → Pegar queries → Run
```

### Verificar migraciones aplicadas
```bash
# Listar migraciones
supabase migration list

# Verificar estado
supabase db diff --schema public

# Ver migraciones pendientes
supabase migration status
```

---

## 📝 Checklist de Auditoría

### Fase 1: Inventario (sin credenciales)
- [x] Identificar tablas críticas por nivel de riesgo
- [x] Documentar migraciones RLS existentes (`20260104083000`, `20260110100000`)
- [x] Preparar queries de validación
- [x] Documentar comandos CLI

### Fase 2: Verificación (requiere credenciales)
- [x] Ejecutar query 1: RLS habilitado por tabla
- [x] Ejecutar query 2: Políticas existentes
- [x] Ejecutar query 3: Tablas sin RLS
- [x] Ejecutar query 4: Tablas con RLS sin políticas
- [x] Ejecutar query 5: Funciones SECURITY DEFINER
- [x] Evidencia documentada (ver resumen y checklist)

### Fase 3: Tests de Acceso (requiere credenciales)
- [x] Test anon: tablas internas → 0 filas
- [x] Test authenticated: tablas UI → datos
- [x] Test service_role: todas → datos
- [x] Sin desvios detectados

### Fase 4: Remediación (si hay gaps)
- [x] Sin gaps detectados (no se requiere migracion)
- [x] No hay politicas faltantes en tablas P0
- [x] Funciones SECURITY DEFINER con `search_path` verificado
- [x] Auditoria completada

---

## 🚨 Riesgos Conocidos

### Estado actual
Todas las tablas P0 fueron verificadas y no se detectaron gaps de RLS.

### Tablas internas con RLS pero sin políticas
Estas tablas tienen RLS habilitado pero sin políticas (acceso solo via service_role):
- `configuracion_proveedor`
- `estadisticas_scraping`
- `comparacion_precios`
- `alertas_cambios_precios`
- Todas las `cron_jobs_*`

**Comportamiento esperado:** Queries desde anon/authenticated retornan 0 filas (verificado).

### Funciones SECURITY DEFINER
Verificadas con `search_path = public` en migración `20260110100000`:
- `sp_aplicar_precio`
- `fnc_deteccion_cambios_significativos`
- `fnc_limpiar_datos_antiguos`
- `refresh_tareas_metricas`
- `sp_movimiento_inventario`

---

## 📁 Script de Auditoría Completo

Guardar como `scripts/rls_audit.sql`:

```sql
-- =============================================================================
-- RLS AUDIT SCRIPT - Mini Market
-- Ejecutar con service_role o psql directo
-- =============================================================================

\echo '=== 1. RLS Status por Tabla ==='
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rls_enabled DESC, tablename;

\echo ''
\echo '=== 2. Políticas RLS Existentes ==='
SELECT 
    tablename,
    policyname,
    roles::text,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''
\echo '=== 3. ALERTA: Tablas SIN RLS ==='
SELECT tablename
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false
ORDER BY tablename;

\echo ''
\echo '=== 4. ALERTA: Tablas con RLS pero SIN Políticas ==='
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;

\echo ''
\echo '=== 5. Funciones SECURITY DEFINER ==='
SELECT 
    proname as function_name,
    COALESCE(proconfig::text, '(sin config)') as config
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
  AND prosecdef = true
ORDER BY proname;

\echo ''
\echo '=== Auditoría completada ==='
```

---

## 📊 Evidencias a Capturar

Al ejecutar la auditoría, guardar:

1. **Output completo de `rls_audit.sql`**
   - Archivo: `docs/evidencias/rls_audit_2026-01-XX.txt`
   
2. **Captura de Supabase Studio** (opcional)
   - Table Editor → Ver RLS status
   - SQL Editor → Resultados de queries

3. **Logs de tests de acceso**
   - Resultados de queries 6-7 con diferentes roles

4. **Diff de schema**
   ```bash
   supabase db diff --schema public > docs/evidencias/schema_diff_2026-01-XX.sql
   ```

---

## 🔗 Referencias

- Migración RLS: [20260104083000_add_rls_policies.sql](../supabase/migrations/20260104083000_add_rls_policies.sql)
- Fix SECURITY DEFINER: [20260110100000_fix_rls_security_definer.sql](../supabase/migrations/20260110100000_fix_rls_security_definer.sql)
- Esquema BD: [ESQUEMA_BASE_DATOS_ACTUAL.md](ESQUEMA_BASE_DATOS_ACTUAL.md)
- Plan de ejecución: *(archivo original deprecado — ver [MEGA_PLAN_CONSOLIDADO](mpc/MEGA_PLAN_CONSOLIDADO.md))*

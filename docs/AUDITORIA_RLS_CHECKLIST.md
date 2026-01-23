# Auditoría RLS - Checklist y Scripts

**Estado:** ✅ **DESBLOQUEADO - LISTO PARA EJECUTAR**  
**Fecha actualización:** 2026-01-23  
**Propósito:** Auditoría RLS del sistema Mini Market  
**Plan de ejecución:** ver `docs/PLAN_PENDIENTES_DEFINITIVO.md`

---

## 📋 Resumen

Este documento contiene el checklist y scripts para auditoría de Row Level Security (RLS).
**Credenciales disponibles en `docs/OBTENER_SECRETOS.md`.**

### Credenciales de Producción
```bash
SUPABASE_URL=https://dqaygmjpzoqjjrywdsxi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Comando de Ejecución
```bash
# Opción A: Dashboard SQL Editor
# https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi/sql
# Pegar contenido de scripts/rls_audit.sql

# Opción B: psql (obtener DATABASE_URL del Dashboard)
psql "$DATABASE_URL" -f scripts/rls_audit.sql > rls_audit_output.txt
```

---

## 🗂️ Tablas Críticas por Nivel de Riesgo

### P0 - Crítico (datos sensibles / financieros)
| Tabla | RLS Enabled | Políticas | Riesgo sin RLS |
|-------|-------------|-----------|----------------|
| `productos` | ❓ Verificar | ❓ | Precios expuestos |
| `stock_deposito` | ❓ Verificar | ❓ | Inventario expuesto |
| `movimientos_deposito` | ❓ Verificar | ❓ | Historial de operaciones |
| `precios_historicos` | ❓ Verificar | ❓ | Historial de precios |
| `proveedores` | ❓ Verificar | ❓ | Datos comerciales |
| `personal` | ❓ Verificar | ❓ | Datos personales (GDPR) |

### P1 - Alto (operaciones internas)
| Tabla | RLS Enabled | Políticas | Notas |
|-------|-------------|-----------|-------|
| `tareas_pendientes` | ✅ Enabled | SELECT/INSERT/UPDATE/DELETE para `authenticated` | Migración `20260104083000` |
| `stock_reservado` | ✅ Enabled | SELECT para `authenticated` | Solo lectura |
| `ordenes_compra` | ✅ Enabled | SELECT para `authenticated` | Solo lectura |

### P2 - Medio (scraping / cron - solo service_role)
| Tabla | RLS Enabled | Políticas | Notas |
|-------|-------------|-----------|-------|
| `precios_proveedor` | ❓ Verificar | - | Datos públicos de scraping |
| `comparacion_precios` | ✅ Enabled | Sin políticas (service_role bypass) | Interno |
| `alertas_cambios_precios` | ✅ Enabled | Sin políticas (service_role bypass) | Interno |
| `configuracion_proveedor` | ✅ Enabled | Sin políticas (service_role bypass) | Interno |
| `estadisticas_scraping` | ✅ Enabled | Sin políticas (service_role bypass) | Interno |

### P3 - Bajo (cron jobs - solo service_role)
| Tabla | RLS Enabled | Políticas | Notas |
|-------|-------------|-----------|-------|
| `cron_jobs_tracking` | ✅ Enabled | Sin políticas | Interno |
| `cron_jobs_execution_log` | ✅ Enabled | Sin políticas | Interno |
| `cron_jobs_alerts` | ✅ Enabled | Sin políticas | Interno |
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

# Opción 2: Via Supabase CLI
supabase db execute --file scripts/rls_audit.sql

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
- [ ] Ejecutar query 1: RLS habilitado por tabla
- [ ] Ejecutar query 2: Políticas existentes
- [ ] Ejecutar query 3: Tablas sin RLS
- [ ] Ejecutar query 4: Tablas con RLS sin políticas
- [ ] Ejecutar query 5: Funciones SECURITY DEFINER
- [ ] Capturar output en `docs/evidencias/rls_audit_YYYY-MM-DD.txt`

### Fase 3: Tests de Acceso (requiere credenciales)
- [ ] Test anon: tablas internas → 0 filas
- [ ] Test authenticated: tablas UI → datos
- [ ] Test service_role: todas → datos
- [ ] Documentar fallos/desvíos

### Fase 4: Remediación (si hay gaps)
- [ ] Crear migración para tablas P0 sin RLS
- [ ] Agregar políticas faltantes
- [ ] Verificar funciones SECURITY DEFINER tienen `search_path`
- [ ] Re-ejecutar auditoría

---

## 🚨 Riesgos Conocidos

### Tablas P0 sin verificación de RLS
Las siguientes tablas contienen datos sensibles y **no se confirmó RLS**:
- `productos` - Catálogo y precios sugeridos
- `stock_deposito` - Inventario actual
- `movimientos_deposito` - Historial de operaciones
- `precios_historicos` - Historial de precios
- `proveedores` - Datos comerciales
- `personal` - **Datos personales (GDPR risk)**

**Acción requerida:** Verificar con queries 1-4 al tener credenciales.

### Tablas internas con RLS pero sin políticas
Estas tablas tienen RLS habilitado pero sin políticas (acceso solo via service_role):
- `configuracion_proveedor`
- `estadisticas_scraping`
- `comparacion_precios`
- `alertas_cambios_precios`
- Todas las `cron_jobs_*`

**Comportamiento esperado:** Queries desde anon/authenticated retornan 0 filas.

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
- Plan de ejecución: [PLAN_TRES_PUNTOS.md](PLAN_TRES_PUNTOS.md) - FASE 2

# Stock Aggregations Migration

**Migration:** `20260116000000_create_stock_aggregations.sql`  
**Fecha:** 2026-01-16  
**Prioridad:** P1-03 (Puntaje 4.0)  
**Estado:** ✅ Ready for deployment

## 📋 Resumen

Esta migración crea vistas materializadas y funciones RPC para optimizar consultas de stock, eliminando N+1 queries y mejorando el rendimiento del dashboard.

## 🎯 Objetivos

1. **Reducir latencia del dashboard** de ~2s a <500ms
2. **Optimizar consultas de stock bajo** con vistas pre-calculadas
3. **Alertas de vencimiento** sin impacto en performance
4. **Análisis de rotación** para reposición inteligente
5. **Métricas agregadas** en una sola llamada RPC

## 📦 Componentes Creados

### Vistas Materializadas

| Nombre | Tipo | Refresh | Propósito |
|--------|------|---------|-----------|
| `mv_stock_bajo` | Materializada | 1 hora | Productos con stock < mínimo |
| `mv_productos_proximos_vencer` | Materializada | 6 horas | Alertas de vencimiento (60 días) |
| `vista_stock_por_categoria` | Vista normal | Tiempo real | Resumen por categoría |

### Funciones RPC

| Función | Tipo | Propósito |
|---------|------|-----------|
| `fn_dashboard_metrics(deposito_id)` | STABLE | 7 métricas en 1 llamada |
| `fn_rotacion_productos(dias, limite)` | STABLE | Análisis de rotación |
| `fn_refresh_stock_views()` | SECURITY DEFINER | Refresh de vistas materializadas |

## ⚙️ Deployment

### Pre-requisitos

- PostgreSQL 12+
- Extensiones: `uuid-ossp`
- Tablas existentes: `stock_deposito`, `productos`, `movimientos_deposito`, `categorias`

### Aplicar Migración

```bash
# Desarrollo local
supabase db reset

# Staging/Production
supabase db push --project-ref YOUR_PROJECT_REF

# Verificar deployment
psql -c "SELECT * FROM fn_dashboard_metrics(NULL) LIMIT 5;"
psql -c "SELECT COUNT(*) FROM mv_stock_bajo;"
```

### Post-Deployment

1. **Refresh inicial de vistas:**
```sql
SELECT fn_refresh_stock_views();
```

2. **Configurar cron job** (cada hora):
```sql
-- En cron_jobs_config o equivalente
INSERT INTO cron.job (schedule, command)
VALUES ('0 * * * *', 'SELECT fn_refresh_stock_views();');
```

3. **Verificar índices:**
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename LIKE 'mv_%';
```

## 📊 Performance Esperado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Dashboard load | ~2000ms | <500ms | **75%** |
| Stock bajo query | ~800ms | <50ms | **94%** |
| Vencimientos query | ~600ms | <50ms | **92%** |
| Memoria usada | Variable | +20MB (vistas) | Estable |

## 🔄 Mantenimiento

### Refresh Manual

```sql
-- Refresh concurrente (permite lecturas durante actualización)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stock_bajo;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_productos_proximos_vencer;

-- O usar función wrapper
SELECT fn_refresh_stock_views();
```

### Monitoreo

```sql
-- Ver última actualización de vistas
SELECT 
  schemaname, 
  matviewname, 
  last_refresh 
FROM pg_matviews 
WHERE matviewname LIKE 'mv_%';

-- Ver tamaño de vistas
SELECT 
  pg_size_pretty(pg_total_relation_size('mv_stock_bajo')) AS stock_bajo_size,
  pg_size_pretty(pg_total_relation_size('mv_productos_proximos_vencer')) AS vencimientos_size;

-- Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('mv_stock_bajo', 'mv_productos_proximos_vencer');
```

### Rebuild Completo (si corrupta)

```sql
-- Drop y recrear vista
DROP MATERIALIZED VIEW IF EXISTS mv_stock_bajo CASCADE;
-- Luego ejecutar la migración nuevamente o el CREATE MATERIALIZED VIEW

-- Verificar integridad
SELECT COUNT(*) FROM mv_stock_bajo;
```

## 🚨 Rollback

Si hay problemas, ejecutar:

```sql
-- Rollback completo
DROP FUNCTION IF EXISTS fn_refresh_stock_views() CASCADE;
DROP FUNCTION IF EXISTS fn_rotacion_productos(integer, integer) CASCADE;
DROP FUNCTION IF EXISTS fn_dashboard_metrics(uuid) CASCADE;
DROP VIEW IF EXISTS vista_stock_por_categoria CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_productos_proximos_vencer CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_stock_bajo CASCADE;

-- Verificar limpieza
SELECT 
  routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE 'fn_%stock%';
```

## 📝 Uso en Aplicación

### Frontend (React Query)

```typescript
// Reemplazar múltiples queries con una sola
const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('fn_dashboard_metrics', { p_deposito_id: null })
      
      if (error) throw error
      
      // Transformar a objeto
      return data.reduce((acc, { metric_name, metric_value }) => {
        acc[metric_name] = metric_value
        return acc
      }, {})
    },
    staleTime: 5 * 60 * 1000 // 5 minutos
  })
}

// Stock bajo desde vista materializada
const useStockBajo = () => {
  return useQuery({
    queryKey: ['stock', 'bajo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mv_stock_bajo')
        .select('*')
        .order('nivel_stock')
      
      if (error) throw error
      return data
    }
  })
}
```

### Backend (Edge Functions)

```typescript
// En edge function
const supabase = createClient(supabaseUrl, supabaseKey)

// Métricas del dashboard
const { data: metrics } = await supabase
  .rpc('fn_dashboard_metrics', { p_deposito_id: null })

// Rotación de productos
const { data: rotacion } = await supabase
  .rpc('fn_rotacion_productos', { 
    p_dias: 30, 
    p_limite: 50 
  })
```

## 🔍 Testing

### Tests de Humo

```sql
-- 1. Verificar que las vistas existen
SELECT COUNT(*) FROM mv_stock_bajo;
SELECT COUNT(*) FROM mv_productos_proximos_vencer;
SELECT COUNT(*) FROM vista_stock_por_categoria;

-- 2. Verificar funciones
SELECT * FROM fn_dashboard_metrics(NULL);
SELECT * FROM fn_rotacion_productos(30, 10);
SELECT fn_refresh_stock_views();

-- 3. Verificar índices
SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'mv_stock_bajo';
-- Debe retornar 4 índices

-- 4. Performance test
EXPLAIN ANALYZE 
SELECT * FROM mv_stock_bajo WHERE nivel_stock = 'critico';
-- Debe usar idx_mv_stock_bajo_nivel
```

## 📚 Referencias

- **Backlog:** [BACKLOG_PRIORIZADO.md](../BACKLOG_PRIORIZADO.md) - P1-03
- **Schema:** [ESQUEMA_BASE_DATOS_ACTUAL.md](../ESQUEMA_BASE_DATOS_ACTUAL.md)
- **Deployment:** [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
- **PostgreSQL Materialized Views:** https://www.postgresql.org/docs/current/rules-materializedviews.html

## ✅ Checklist de Deployment

- [ ] Backup de base de datos creado
- [ ] Migración aplicada sin errores
- [ ] Refresh inicial ejecutado: `SELECT fn_refresh_stock_views()`
- [ ] Verificados índices (4 en mv_stock_bajo, 4 en mv_productos_proximos_vencer)
- [ ] Tests de humo pasados
- [ ] Cron job configurado (cada hora)
- [ ] Monitoreo de tamaño de vistas configurado
- [ ] Frontend actualizado para usar nuevas vistas/funciones
- [ ] Documentación actualizada
- [ ] Performance validado (<500ms dashboard load)

---

**Contacto:** DevOps Team  
**Última actualización:** 2026-01-16

# Scripts de Migración de Base de Datos - Sistema E-commerce

## 📋 Descripción

Este conjunto de scripts SQL proporciona una solución completa para la auto-gestión del backend de un sistema de e-commerce. Incluye todas las estructuras, funciones, triggers, vistas y datos necesarios para implementar una base de datos robusta y escalable.

## 📁 Archivos Incluidos

### 1. `01_create_tables.sql` (20.8 KB)
**Script de creación de 46 tablas** para el sistema completo:
- Usuarios y autenticación (usuarios, perfiles, direcciones)
- Productos y categorías (productos, categorías, imágenes, atributos, variaciones)
- Inventario (movimientos, proveedores, compras, ubicaciones)
- Órdenes y pedidos (órdenes, detalles, pagos, envíos)
- Carritos y wishlists
- Métodos de envío y logística
- Descuentos y cupones
- Analytics y reportes
- Configuración del sistema
- Comunicaciones (emails, logs)

### 2. `02_create_functions.sql` (19.3 KB)
**8 funciones PL/pgSQL** para operaciones comunes:
1. `calcular_total_orden()` - Calcula y actualiza totales de órdenes
2. `actualizar_stock_producto()` - Gestiona stock y movimientos
3. `generar_numero_orden()` - Genera números secuenciales únicos
4. `validar_aplicar_cupon()` - Valida y aplica cupones de descuento
5. `calcular_metricas_diarias()` - Calcula métricas de analytics
6. `buscar_productos()` - Búsqueda avanzada con filtros
7. `limpiar_datos_antiguos()` - Mantenimiento de datos
8. `generar_reporte_ventas()` - Reportes de ventas personalizados

### 3. `03_create_triggers.sql` (19.9 KB)
**24 triggers** para automatización y auditoría:
- Triggers de timestamp automático (`updated_at`)
- Triggers de auditoría (registro de cambios)
- Triggers de validación (stock, cupones)
- Triggers de cálculo automático (totales)
- Triggers de analytics (tracking de eventos)
- Triggers de limpieza automática

### 4. `04_create_views.sql` (24.6 KB)
**7 vistas** para consultas frecuentes y reportes:
1. `vista_productos_completos` - Información completa de productos
2. `vista_ordenes_clientes` - Órdenes con detalles del cliente
3. `vista_inventario_actualizado` - Estado actual del inventario
4. `vista_reportes_ventas` - Reportes agregados de ventas
5. `vista_analytics_dashboard` - Métricas para dashboard
6. `vista_clientes_comportamiento` - Análisis de clientes
7. `vista_metricas_resumen` - Resumen diario de métricas

### 5. `05_sample_data.sql` (37.8 KB)
**Datos de prueba completos**:
- **33 categorías** (8 principales + 25 subcategorías)
- **220 productos** distribuidos en todas las categorías
- Usuarios de prueba
- Proveedores
- Métodos de envío
- Cupones de descuento
- Plantillas de email
- Métricas de ejemplo
- Configuración inicial

### 6. `06_initial_setup.sql` (22.3 KB)
**Configuración inicial** del sistema:
- Creación de roles y permisos
- Configuración de seguridad (RLS)
- Índices adicionales para optimización
- Funciones de mantenimiento automático
- Configuración de monitoreo
- Alertas del sistema
- Scripts de limpieza programada

## 🚀 Instrucciones de Uso

### Prerrequisitos
- PostgreSQL 13 o superior
- Extensiones requeridas: `uuid-ossp`, `pg_trgm`
- Permisos de superusuario para la instalación inicial

### Instalación

Ejecutar los scripts en el orden especificado:

```bash
# 1. Crear todas las tablas
psql -U postgres -d ecommerce_db -f 01_create_tables.sql

# 2. Crear funciones PL/pgSQL
psql -U postgres -d ecommerce_db -f 02_create_functions.sql

# 3. Crear triggers
psql -U postgres -d ecommerce_db -f 03_create_triggers.sql

# 4. Crear vistas
psql -U postgres -d ecommerce_db -f 04_create_views.sql

# 5. Insertar datos de prueba
psql -U postgres -d ecommerce_db -f 05_sample_data.sql

# 6. Configuración inicial
psql -U postgres -d ecommerce_db -f 06_initial_setup.sql
```

### Instalación Automática

```bash
# Ejecutar todos los scripts en orden
for script in 01_create_tables.sql 02_create_functions.sql 03_create_triggers.sql 04_create_views.sql 05_sample_data.sql 06_initial_setup.sql; do
    echo "Ejecutando $script..."
    psql -U postgres -d ecommerce_db -f "$script"
    if [ $? -eq 0 ]; then
        echo "✓ $script completado"
    else
        echo "✗ Error en $script"
        exit 1
    fi
done

echo "¡Instalación completada exitosamente!"
```

## 🔧 Configuración de Conexión

### Variables de Entorno
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=ecommerce_db
export DB_USER=backend_app
export DB_PASSWORD=backend_secure_2025
```

### Credenciales de Roles
| Rol | Contraseña | Permisos |
|-----|------------|----------|
| `backend_app` | backend_secure_2025 | Acceso completo de lectura/escritura |
| `frontend_app` | frontend_secure_2025 | Solo lectura |
| `reporting_app` | reporting_secure_2025 | Vistas de reportes |
| `analytics_app` | analytics_secure_2025 | Analytics y métricas |
| `dashboard_app` | dashboard_secure_2025 | Vistas de dashboard |

## 📊 Estructura del Sistema

### Tablas Principales
- **Usuarios**: Sistema de autenticación y perfiles
- **Productos**: Catálogo con variaciones y atributos
- **Categorías**: Sistema jerárquico de categorías
- **Órdenes**: Gestión completa de pedidos
- **Inventario**: Control de stock y movimientos
- **Analytics**: Tracking de eventos y métricas

### Funcionalidades Principales
- ✅ Gestión completa de productos y categorías
- ✅ Sistema de órdenes con múltiples estados
- ✅ Control de inventario en tiempo real
- ✅ Gestión de cupones y descuentos
- ✅ Analytics y reportes automáticos
- ✅ Sistema de carritos y wishlists
- ✅ Múltiples métodos de pago y envío
- ✅ Auditoría completa de cambios
- ✅ Seguridad con RLS (Row Level Security)

## 🔍 Consultas Útiles

### Productos Más Vendidos
```sql
SELECT 
    p.nombre,
    SUM(od.cantidad) as total_vendido,
    SUM(od.subtotal) as revenue
FROM productos p
JOIN ordenes_detalle od ON p.id = od.producto_id
JOIN ordenes o ON od.orden_id = o.id
WHERE o.estado IN ('confirmado', 'enviado', 'entregado')
GROUP BY p.nombre
ORDER BY total_vendido DESC
LIMIT 10;
```

### Métricas del Día
```sql
SELECT * FROM vista_metricas_resumen 
WHERE fecha = CURRENT_DATE;
```

### Productos con Stock Bajo
```sql
SELECT 
    sku,
    nombre,
    stock_actual,
    stock_minimo
FROM productos
WHERE stock_actual <= stock_minimo
AND activo = true;
```

## 📈 Mantenimiento

### Limpieza Automática
```sql
-- Ejecutar limpieza de datos antiguos
SELECT limpiar_datos_antiguos(365, 90, 30);
```

### Actualizar Métricas
```sql
-- Calcular métricas del día actual
SELECT calcular_metricas_diarias(CURRENT_DATE);
```

### Generar Reportes
```sql
-- Reporte de ventas del último mes
SELECT * FROM generar_reporte_ventas(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    'dia',
    NULL
);
```

## 🛡️ Seguridad

### Row Level Security (RLS)
- Habilitado en tablas sensibles (usuarios, órdenes, pagos)
- Políticas basadas en el usuario logueado
- Acceso controlado por roles

### Encriptación
- Funciones de encriptación para datos sensibles
- Hash de contraseñas con bcrypt
- Encriptación de números de tarjeta (parcial)

### Auditoría
- Todos los cambios registrados en `logs_sistema`
- Triggers de auditoría en tablas críticas
- Monitoreo de acceso y modificaciones

## 📋 Monitoreo

### Vistas de Monitoreo
```sql
-- Performance de tablas
SELECT * FROM vista_monitoreo_performance;

-- Conexiones activas
SELECT * FROM vista_conexiones_activas;

-- Resumen ejecutivo
SELECT * FROM vista_resumen_ejecutivo;
```

### Alertas Automáticas
- Stock bajo de productos
- Órdenes pendientes de procesamiento
- Errores del sistema
- Conexiones sospechosas

## 🔄 Backup y Recuperación

### Backup Manual
```sql
SELECT crear_backup_tablas();
```

### Restauración
```bash
# Restaurar desde backup
psql -U postgres -d ecommerce_db < backup_file.sql
```

## 🆘 Solución de Problemas

### Errores Comunes

1. **Error de permisos**
   ```sql
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO backend_app;
   ```

2. **Función no encontrada**
   ```sql
   REFRESH FUNCTION calcular_total_orden(INTEGER);
   ```

3. **Trigger no ejecutándose**
   ```sql
   SELECT trigger_name, event_manipulation 
   FROM information_schema.triggers 
   WHERE event_object_table = 'productos';
   ```

### Logs del Sistema
```sql
SELECT * FROM logs_sistema 
WHERE nivel IN ('ERROR', 'CRITICAL')
ORDER BY timestamp_log DESC
LIMIT 10;
```

## 📞 Soporte

Para problemas o consultas:
1. Revisar los logs del sistema
2. Verificar permisos de base de datos
3. Confirmar que todas las extensiones están instaladas
4. Validar la secuencia de ejecución de scripts

## 📄 Licencia

Este sistema está diseñado para uso interno y comercial. Todos los scripts son originales y pueden ser modificados según las necesidades del proyecto.

---

**Versión**: 1.0.0  
**Fecha**: 2025-10-31  
**Compatibilidad**: PostgreSQL 13+
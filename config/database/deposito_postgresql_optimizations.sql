-- PostgreSQL Optimization Configuration for sistema_deposito_semana1
-- Optimizado para transacciones ACID de depósito con alta concurrencia

-- Configuración de conexiones y memoria
-- (Estas configuraciones van en postgresql.conf)
-- max_connections = 200
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
-- work_mem = 4MB
-- maintenance_work_mem = 64MB

-- Índices específicos para operaciones de depósito
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_productos_deposito_stock
ON productos (deposito_id, stock_actual) WHERE stock_actual > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_movimientos_deposito_fecha
ON movimientos_stock (deposito_id, created_at DESC, tipo_movimiento);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transferencias_estado
ON transferencias_deposito (estado, created_at DESC) WHERE estado IN ('PENDIENTE', 'EN_PROCESO');

-- Índice para auditoría de movimientos críticos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_movimientos_auditoria
ON movimientos_stock (usuario_id, created_at DESC, cantidad) WHERE cantidad > 1000;

-- Índices para consultas frecuentes de inventario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_productos_categoria_deposito
ON productos (categoria, deposito_id) WHERE activo = true;

-- Índice compuesto para reportes de stock bajo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_bajo_critico
ON productos (deposito_id, categoria, stock_actual) 
WHERE stock_actual < stock_minimo AND activo = true;

-- Optimizaciones específicas para transacciones ACID
-- Constraints para integridad referencial crítica
ALTER TABLE movimientos_stock 
ADD CONSTRAINT check_cantidad_positiva 
CHECK (cantidad > 0) NOT VALID;

ALTER TABLE transferencias_deposito 
ADD CONSTRAINT check_cantidad_transferencia_positiva 
CHECK (cantidad > 0) NOT VALID;

-- Validar constraints existentes sin bloquear
ALTER TABLE movimientos_stock VALIDATE CONSTRAINT check_cantidad_positiva;
ALTER TABLE transferencias_deposito VALIDATE CONSTRAINT check_cantidad_transferencia_positiva;

-- Estadísticas para el optimizador
ANALYZE productos;
ANALYZE movimientos_stock;
ANALYZE transferencias_deposito;

-- Configurar autovacuum más agresivo para tablas de alta transaccionalidad
ALTER TABLE movimientos_stock SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_analyze_scale_factor = 0.005
);

ALTER TABLE transferencias_deposito SET (
  autovacuum_vacuum_scale_factor = 0.02,  
  autovacuum_analyze_scale_factor = 0.01
);
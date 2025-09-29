-- SQLite Optimization Pragmas for inventario-retail module
-- Optimizado para operaciones de stock retail con alta concurrencia

-- WAL mode para mejor concurrencia
PRAGMA journal_mode=WAL;

-- Sincronización normal para balance performance/durabilidad
PRAGMA synchronous=NORMAL;

-- Habilitar foreign keys para integridad referencial
PRAGMA foreign_keys=ON;

-- Timeout para operaciones bloqueadas (10 segundos)
PRAGMA busy_timeout=10000;

-- Cache de 64MB para operaciones frecuentes
PRAGMA cache_size=-64000;

-- Almacenar temporales en memoria
PRAGMA temp_store=MEMORY;

-- Optimizar para lecturas secuenciales
PRAGMA mmap_size=268435456;

-- Habilitar estadísticas para el optimizador
PRAGMA optimize;

-- Índices específicos para stock (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_producto_stock ON movimientos_stock(producto_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_active ON productos(id) WHERE stock_actual > 0;
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_stock(tipo_movimiento, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria) WHERE categoria IS NOT NULL;

-- Índice compuesto para consultas frecuentes de stock
CREATE INDEX IF NOT EXISTS idx_stock_producto_fecha ON movimientos_stock(producto_id, tipo_movimiento, created_at DESC);

-- Índices específicos para retail argentino
-- Códigos EAN/UPC para productos
CREATE INDEX IF NOT EXISTS idx_productos_ean ON productos(codigo_barras) WHERE codigo_barras IS NOT NULL;

-- Búsqueda por nombre de producto (case insensitive)
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(lower(nombre)) WHERE activo = 1;

-- Índice para alertas de stock bajo
CREATE INDEX IF NOT EXISTS idx_productos_stock_bajo ON productos(stock_actual, stock_minimo) 
WHERE stock_actual <= stock_minimo AND activo = 1;

-- Índice para productos con precio en pesos argentinos
CREATE INDEX IF NOT EXISTS idx_productos_precio_ars ON productos(precio_ars, categoria) 
WHERE precio_ars > 0 AND activo = 1;

-- Índice para operaciones OCR de facturas
CREATE INDEX IF NOT EXISTS idx_facturas_ocr_estado ON facturas_ocr(estado_procesamiento, created_at DESC);

-- Índice para auditoría de cambios de precios (inflación argentina)
CREATE INDEX IF NOT EXISTS idx_historial_precios ON historial_precios(producto_id, fecha_cambio DESC, precio_anterior, precio_nuevo);

-- Trigger para evitar stock negativo (constraint SQLite)
CREATE TRIGGER IF NOT EXISTS trg_prevent_negative_stock
BEFORE UPDATE OF stock_actual ON productos
FOR EACH ROW
WHEN NEW.stock_actual < 0
BEGIN
  SELECT RAISE(ABORT, 'Stock no puede ser negativo');
END;
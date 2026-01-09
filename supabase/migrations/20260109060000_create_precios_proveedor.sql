CREATE TABLE IF NOT EXISTS precios_proveedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL,
  nombre text,
  marca text,
  categoria text,
  precio_unitario numeric(12, 2),
  precio_promocional numeric(12, 2),
  precio_actual numeric(12, 2),
  precio_anterior numeric(12, 2),
  stock_disponible integer,
  stock_nivel_minimo integer,
  codigo_barras text,
  url_producto text,
  imagen_url text,
  descripcion text,
  hash_contenido text,
  score_confiabilidad numeric(5, 2),
  ultima_actualizacion timestamptz,
  fuente text,
  activo boolean DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_precios_proveedor_sku
  ON precios_proveedor (sku);
CREATE INDEX IF NOT EXISTS idx_precios_proveedor_fuente
  ON precios_proveedor (fuente);
CREATE INDEX IF NOT EXISTS idx_precios_proveedor_categoria
  ON precios_proveedor (categoria);
CREATE INDEX IF NOT EXISTS idx_precios_proveedor_activo
  ON precios_proveedor (activo);

-- Create core tables required by app/UI and RPC functions.
-- Safe defaults: IF NOT EXISTS, minimal constraints.

CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text,
  nombre text NOT NULL,
  descripcion text,
  parent_id uuid,
  nivel integer DEFAULT 1,
  margen_minimo numeric(5, 2) DEFAULT 0,
  margen_maximo numeric(5, 2) DEFAULT 100,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categorias
  ADD CONSTRAINT categorias_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES categorias(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categorias_parent_id
  ON categorias (parent_id);
CREATE INDEX IF NOT EXISTS idx_categorias_codigo
  ON categorias (codigo);
CREATE INDEX IF NOT EXISTS idx_categorias_activo
  ON categorias (activo);

CREATE TABLE IF NOT EXISTS proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  contacto text,
  email text,
  telefono text,
  productos_ofrecidos text[],
  direccion text,
  cuit text,
  sitio_web text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_nombre
  ON proveedores (nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_activo
  ON proveedores (activo);

CREATE TABLE IF NOT EXISTS productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  categoria text,
  categoria_id uuid,
  marca text,
  contenido_neto text,
  dimensiones jsonb,
  codigo_barras text,
  sku text,
  precio_actual numeric(12, 2),
  precio_costo numeric(12, 2),
  precio_sugerido numeric(12, 2),
  margen_ganancia numeric(5, 2),
  proveedor_principal_id uuid,
  observaciones text,
  activo boolean DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE productos
  ADD CONSTRAINT productos_categoria_id_fkey
  FOREIGN KEY (categoria_id)
  REFERENCES categorias(id)
  ON DELETE SET NULL;

ALTER TABLE productos
  ADD CONSTRAINT productos_proveedor_principal_id_fkey
  FOREIGN KEY (proveedor_principal_id)
  REFERENCES proveedores(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_productos_categoria_id
  ON productos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_proveedor_principal_id
  ON productos (proveedor_principal_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo
  ON productos (activo);
CREATE INDEX IF NOT EXISTS idx_productos_nombre
  ON productos (nombre);

CREATE TABLE IF NOT EXISTS stock_deposito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid,
  cantidad_actual integer DEFAULT 0,
  stock_minimo integer DEFAULT 0,
  stock_maximo integer DEFAULT 0,
  ubicacion text DEFAULT 'Principal',
  lote text,
  fecha_vencimiento date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stock_deposito
  ADD CONSTRAINT stock_deposito_producto_id_fkey
  FOREIGN KEY (producto_id)
  REFERENCES productos(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_stock_deposito_producto_id
  ON stock_deposito (producto_id);
CREATE INDEX IF NOT EXISTS idx_stock_deposito_ubicacion
  ON stock_deposito (ubicacion);

CREATE TABLE IF NOT EXISTS movimientos_deposito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid,
  tipo_movimiento text NOT NULL,
  cantidad integer NOT NULL,
  cantidad_anterior integer,
  cantidad_nueva integer,
  motivo text,
  usuario_id uuid,
  proveedor_id uuid,
  observaciones text,
  fecha_movimiento timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE movimientos_deposito
  ADD CONSTRAINT movimientos_deposito_producto_id_fkey
  FOREIGN KEY (producto_id)
  REFERENCES productos(id)
  ON DELETE SET NULL;

ALTER TABLE movimientos_deposito
  ADD CONSTRAINT movimientos_deposito_proveedor_id_fkey
  FOREIGN KEY (proveedor_id)
  REFERENCES proveedores(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_deposito_producto_id
  ON movimientos_deposito (producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_deposito_fecha_movimiento
  ON movimientos_deposito (fecha_movimiento DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_deposito_tipo
  ON movimientos_deposito (tipo_movimiento);

CREATE TABLE IF NOT EXISTS precios_historicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid,
  precio_anterior numeric(12, 2),
  precio_nuevo numeric(12, 2),
  fecha_cambio timestamptz DEFAULT now(),
  motivo_cambio text,
  usuario_id uuid,
  precio numeric(12, 2),
  fuente text,
  fecha timestamptz,
  cambio_porcentaje numeric(7, 2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE precios_historicos
  ADD CONSTRAINT precios_historicos_producto_id_fkey
  FOREIGN KEY (producto_id)
  REFERENCES productos(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_precios_historicos_producto_id
  ON precios_historicos (producto_id);
CREATE INDEX IF NOT EXISTS idx_precios_historicos_fecha_cambio
  ON precios_historicos (fecha_cambio DESC);

CREATE TABLE IF NOT EXISTS productos_faltantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid,
  producto_nombre text,
  fecha_reporte timestamptz DEFAULT now(),
  reportado_por_id uuid,
  reportado_por_nombre text,
  proveedor_asignado_id uuid,
  resuelto boolean DEFAULT false,
  fecha_resolucion timestamptz,
  observaciones text,
  cantidad_faltante integer,
  prioridad text,
  estado text,
  fecha_deteccion timestamptz,
  cantidad_pedida integer,
  precio_estimado numeric(12, 2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE productos_faltantes
  ADD CONSTRAINT productos_faltantes_producto_id_fkey
  FOREIGN KEY (producto_id)
  REFERENCES productos(id)
  ON DELETE SET NULL;

ALTER TABLE productos_faltantes
  ADD CONSTRAINT productos_faltantes_proveedor_id_fkey
  FOREIGN KEY (proveedor_asignado_id)
  REFERENCES proveedores(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_productos_faltantes_producto_id
  ON productos_faltantes (producto_id);
CREATE INDEX IF NOT EXISTS idx_productos_faltantes_resuelto
  ON productos_faltantes (resuelto);

CREATE TABLE IF NOT EXISTS notificaciones_tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id uuid,
  tipo text,
  mensaje text,
  usuario_destino_id uuid,
  usuario_destino_nombre text,
  fecha_envio timestamptz DEFAULT now(),
  leido boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notificaciones_tareas
  ADD CONSTRAINT notificaciones_tareas_tarea_id_fkey
  FOREIGN KEY (tarea_id)
  REFERENCES tareas_pendientes(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notificaciones_tareas_tarea_id
  ON notificaciones_tareas (tarea_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tareas_fecha_envio
  ON notificaciones_tareas (fecha_envio DESC);

CREATE TABLE IF NOT EXISTS personal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_auth_id uuid,
  nombre text NOT NULL,
  email text,
  telefono text,
  rol text,
  departamento text,
  activo boolean DEFAULT true,
  fecha_ingreso date DEFAULT CURRENT_DATE,
  direccion text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_user_auth_id
  ON personal (user_auth_id);
CREATE INDEX IF NOT EXISTS idx_personal_activo
  ON personal (activo);

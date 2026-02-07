-- ============================================================================
-- Migración: Tabla de Pedidos
-- Descripción: Tabla principal para gestión de pedidos de clientes
-- Fecha: 2026-02-06
-- ============================================================================

-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Número secuencial legible
  numero_pedido SERIAL,
  
  -- Cliente (opcional - puede ser cliente registrado o datos inline)
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT,
  
  -- Tipo de entrega
  tipo_entrega TEXT NOT NULL DEFAULT 'retiro' 
    CHECK (tipo_entrega IN ('retiro', 'domicilio')),
  
  -- Datos de entrega (si tipo_entrega = 'domicilio')
  direccion_entrega TEXT,
  edificio TEXT,
  piso TEXT,
  departamento TEXT,
  horario_entrega_preferido TEXT,
  
  -- Estado del pedido
  estado TEXT NOT NULL DEFAULT 'pendiente' 
    CHECK (estado IN ('pendiente', 'preparando', 'listo', 'entregado', 'cancelado')),
  
  -- Estado de pago
  estado_pago TEXT NOT NULL DEFAULT 'pendiente' 
    CHECK (estado_pago IN ('pendiente', 'pagado', 'parcial')),
  
  -- Montos
  monto_total DECIMAL(12,2) DEFAULT 0 CHECK (monto_total >= 0),
  monto_pagado DECIMAL(12,2) DEFAULT 0 CHECK (monto_pagado >= 0),
  
  -- Observaciones
  observaciones TEXT,
  observaciones_internas TEXT,
  
  -- Transcripción de audio (si se usó)
  audio_url TEXT,
  transcripcion_texto TEXT,
  
  -- Personal responsable
  creado_por_id UUID REFERENCES auth.users(id),
  preparado_por_id UUID REFERENCES auth.users(id),
  entregado_por_id UUID REFERENCES auth.users(id),
  
  -- Fechas
  fecha_pedido TIMESTAMPTZ DEFAULT now(),
  fecha_entrega_estimada TIMESTAMPTZ,
  fecha_preparado TIMESTAMPTZ,
  fecha_entregado TIMESTAMPTZ,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentarios
COMMENT ON TABLE public.pedidos IS 'Pedidos de clientes del Mini Market';
COMMENT ON COLUMN public.pedidos.numero_pedido IS 'Número secuencial legible del pedido';
COMMENT ON COLUMN public.pedidos.tipo_entrega IS 'retiro = cliente retira en local, domicilio = envío';
COMMENT ON COLUMN public.pedidos.observaciones IS 'Observaciones visibles para el cliente';
COMMENT ON COLUMN public.pedidos.observaciones_internas IS 'Notas solo para personal';
COMMENT ON COLUMN public.pedidos.transcripcion_texto IS 'Texto transcripto del audio original';

-- Índices
CREATE INDEX IF NOT EXISTS idx_pedidos_numero 
  ON public.pedidos(numero_pedido DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_estado 
  ON public.pedidos(estado);

CREATE INDEX IF NOT EXISTS idx_pedidos_estado_pago 
  ON public.pedidos(estado_pago);

CREATE INDEX IF NOT EXISTS idx_pedidos_fecha 
  ON public.pedidos(fecha_pedido DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id 
  ON public.pedidos(cliente_id) 
  WHERE cliente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_creado_por 
  ON public.pedidos(creado_por_id);

-- Índice compuesto para filtros comunes
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_fecha 
  ON public.pedidos(estado, fecha_pedido DESC);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_pedidos_updated_at ON public.pedidos;
CREATE TRIGGER set_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Usuarios autenticados pueden ver pedidos
CREATE POLICY "pedidos_select_authenticated" ON public.pedidos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.personal p
      WHERE p.user_auth_id = auth.uid()
      AND p.activo = TRUE
    )
  );

-- Usuarios autenticados con rol apropiado pueden insertar
CREATE POLICY "pedidos_insert_staff" ON public.pedidos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.personal p
      WHERE p.user_auth_id = auth.uid()
      AND p.rol IN ('admin', 'deposito', 'jefe', 'ventas')
      AND p.activo = TRUE
    )
  );

-- Staff puede actualizar pedidos
CREATE POLICY "pedidos_update_staff" ON public.pedidos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.personal p
      WHERE p.user_auth_id = auth.uid()
      AND p.rol IN ('admin', 'deposito', 'jefe', 'ventas')
      AND p.activo = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.personal p
      WHERE p.user_auth_id = auth.uid()
      AND p.rol IN ('admin', 'deposito', 'jefe', 'ventas')
      AND p.activo = TRUE
    )
  );

-- Solo admin puede eliminar
CREATE POLICY "pedidos_delete_admin" ON public.pedidos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.personal p
      WHERE p.user_auth_id = auth.uid()
      AND p.rol = 'admin'
      AND p.activo = TRUE
    )
  );

-- Permisos
REVOKE ALL ON public.pedidos FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.pedidos_numero_pedido_seq TO authenticated;

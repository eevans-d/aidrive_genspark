-- ============================================================================
-- Migración: Tabla de Detalle de Pedidos
-- Descripción: Líneas de productos por cada pedido (checklist)
-- Fecha: 2026-02-06
-- ============================================================================

-- Crear tabla de detalle de pedidos
CREATE TABLE IF NOT EXISTS public.detalle_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación con pedido
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  
  -- Producto (referencia opcional - datos se copian al momento)
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  
  -- Datos del producto al momento del pedido (snapshot)
  producto_nombre TEXT NOT NULL,
  producto_sku TEXT,
  
  -- Cantidades y precios
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(12,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  
  -- Estado de preparación (checklist)
  preparado BOOLEAN DEFAULT FALSE,
  fecha_preparado TIMESTAMPTZ,
  preparado_por_id UUID REFERENCES auth.users(id),
  
  -- Observaciones específicas de este ítem
  observaciones TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comentarios
COMMENT ON TABLE public.detalle_pedidos IS 'Líneas de productos de cada pedido';
COMMENT ON COLUMN public.detalle_pedidos.producto_nombre IS 'Nombre del producto al momento del pedido';
COMMENT ON COLUMN public.detalle_pedidos.preparado IS 'TRUE cuando el ítem fue preparado/armado';
COMMENT ON COLUMN public.detalle_pedidos.subtotal IS 'Calculado automáticamente: cantidad * precio_unitario';

-- Índices
CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_pedido 
  ON public.detalle_pedidos(pedido_id);

CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_producto 
  ON public.detalle_pedidos(producto_id) 
  WHERE producto_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_preparado 
  ON public.detalle_pedidos(preparado);

-- RLS
ALTER TABLE public.detalle_pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (heredan del pedido padre)
-- Usuarios autenticados pueden ver detalles
CREATE POLICY "detalle_pedidos_select_authenticated" ON public.detalle_pedidos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.personal p
      WHERE p.user_auth_id = auth.uid()
      AND p.activo = TRUE
    )
  );

-- Staff puede insertar detalles
CREATE POLICY "detalle_pedidos_insert_staff" ON public.detalle_pedidos
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

-- Staff puede actualizar (marcar como preparado)
CREATE POLICY "detalle_pedidos_update_staff" ON public.detalle_pedidos
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
CREATE POLICY "detalle_pedidos_delete_admin" ON public.detalle_pedidos
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
REVOKE ALL ON public.detalle_pedidos FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detalle_pedidos TO authenticated;

-- ============================================================================
-- Función para actualizar monto_total del pedido
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_actualizar_monto_pedido()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular monto_total del pedido
  UPDATE public.pedidos 
  SET monto_total = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM public.detalle_pedidos
    WHERE pedido_id = COALESCE(NEW.pedido_id, OLD.pedido_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.pedido_id, OLD.pedido_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar monto cuando cambian los detalles
DROP TRIGGER IF EXISTS trigger_actualizar_monto_pedido ON public.detalle_pedidos;
CREATE TRIGGER trigger_actualizar_monto_pedido
  AFTER INSERT OR UPDATE OR DELETE ON public.detalle_pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_actualizar_monto_pedido();

-- ============================================================================
-- Stored Procedure: Crear pedido completo con detalles (transacción atómica)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sp_crear_pedido(
  p_cliente_nombre TEXT,
  p_tipo_entrega TEXT DEFAULT 'retiro',
  p_direccion_entrega TEXT DEFAULT NULL,
  p_edificio TEXT DEFAULT NULL,
  p_piso TEXT DEFAULT NULL,
  p_departamento TEXT DEFAULT NULL,
  p_horario_preferido TEXT DEFAULT NULL,
  p_observaciones TEXT DEFAULT NULL,
  p_cliente_telefono TEXT DEFAULT NULL,
  p_cliente_id UUID DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_pedido_id UUID;
  v_numero_pedido INTEGER;
  v_item JSONB;
  v_monto_total DECIMAL(12,2) := 0;
BEGIN
  -- Crear el pedido
  INSERT INTO public.pedidos (
    cliente_id,
    cliente_nombre,
    cliente_telefono,
    tipo_entrega,
    direccion_entrega,
    edificio,
    piso,
    departamento,
    horario_entrega_preferido,
    observaciones,
    creado_por_id
  ) VALUES (
    p_cliente_id,
    p_cliente_nombre,
    p_cliente_telefono,
    p_tipo_entrega,
    p_direccion_entrega,
    p_edificio,
    p_piso,
    p_departamento,
    p_horario_preferido,
    p_observaciones,
    auth.uid()
  )
  RETURNING id, numero_pedido INTO v_pedido_id, v_numero_pedido;
  
  -- Insertar los items del pedido
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.detalle_pedidos (
      pedido_id,
      producto_id,
      producto_nombre,
      producto_sku,
      cantidad,
      precio_unitario,
      observaciones
    ) VALUES (
      v_pedido_id,
      (v_item->>'producto_id')::UUID,
      v_item->>'producto_nombre',
      v_item->>'producto_sku',
      (v_item->>'cantidad')::INTEGER,
      (v_item->>'precio_unitario')::DECIMAL(12,2),
      v_item->>'observaciones'
    );
    
    v_monto_total := v_monto_total + 
      ((v_item->>'cantidad')::INTEGER * (v_item->>'precio_unitario')::DECIMAL(12,2));
  END LOOP;
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'numero_pedido', v_numero_pedido,
    'monto_total', v_monto_total,
    'items_count', jsonb_array_length(p_items)
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.sp_crear_pedido IS 'Crea un pedido completo con todos sus items en una transacción atómica';

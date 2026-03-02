-- =============================================================================
-- Migration: Add idempotency support to movimientos_deposito
-- Ticket: ID-01/02/03 (OPEN_ISSUES)
-- =============================================================================

-- 1. Add idempotency_key column (nullable — backwards compatible)
ALTER TABLE public.movimientos_deposito
  ADD COLUMN IF NOT EXISTS idempotency_key text;

-- 2. Unique partial index (only enforced when key is present)
CREATE UNIQUE INDEX IF NOT EXISTS idx_movimientos_deposito_idempotency_key
  ON public.movimientos_deposito (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 3. Update sp_movimiento_inventario to accept p_idempotency_key
CREATE OR REPLACE FUNCTION sp_movimiento_inventario(
  p_producto_id uuid,
  p_tipo text,
  p_cantidad integer,
  p_origen text DEFAULT NULL,
  p_destino text DEFAULT NULL,
  p_usuario uuid DEFAULT NULL,
  p_orden_compra_id uuid DEFAULT NULL,
  p_proveedor_id uuid DEFAULT NULL,
  p_observaciones text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock_actual integer;
  v_stock_nuevo integer;
  v_ubicacion text;
  v_existing jsonb;
BEGIN
  -- Idempotency check: if key provided and already used, return existing result
  IF p_idempotency_key IS NOT NULL THEN
    SELECT jsonb_build_object(
      'producto_id', md.producto_id,
      'tipo', md.tipo_movimiento,
      'cantidad', md.cantidad,
      'stock_anterior', md.cantidad_anterior,
      'stock_nuevo', md.cantidad_nueva,
      'ubicacion', 'Principal',
      'idempotent', true
    ) INTO v_existing
    FROM public.movimientos_deposito md
    WHERE md.idempotency_key = p_idempotency_key;

    IF v_existing IS NOT NULL THEN
      RETURN v_existing;
    END IF;
  END IF;

  -- Validate tipo
  IF p_tipo NOT IN ('entrada', 'salida', 'ajuste') THEN
    RAISE EXCEPTION 'Tipo de movimiento invalido: %', p_tipo;
  END IF;

  -- Validate cantidad
  IF p_cantidad <= 0 THEN
    RAISE EXCEPTION 'Cantidad debe ser mayor a cero';
  END IF;

  -- Determine ubicacion
  v_ubicacion := COALESCE(p_destino, 'Principal');

  -- Lock row and get current stock
  SELECT sd.cantidad_actual INTO v_stock_actual
  FROM public.stock_deposito sd
  WHERE sd.producto_id = p_producto_id
    AND sd.ubicacion = v_ubicacion
  FOR UPDATE;

  IF v_stock_actual IS NULL THEN
    -- Auto-create stock record if it doesn't exist
    INSERT INTO public.stock_deposito (producto_id, ubicacion, cantidad_actual, stock_minimo, stock_maximo)
    VALUES (p_producto_id, v_ubicacion, 0, 0, 0)
    ON CONFLICT (producto_id, ubicacion) DO NOTHING;

    SELECT sd.cantidad_actual INTO v_stock_actual
    FROM public.stock_deposito sd
    WHERE sd.producto_id = p_producto_id
      AND sd.ubicacion = v_ubicacion
    FOR UPDATE;

    v_stock_actual := COALESCE(v_stock_actual, 0);
  END IF;

  -- Calculate new stock
  IF p_tipo = 'entrada' THEN
    v_stock_nuevo := v_stock_actual + p_cantidad;
  ELSIF p_tipo = 'salida' THEN
    v_stock_nuevo := v_stock_actual - p_cantidad;
    IF v_stock_nuevo < 0 THEN
      RAISE EXCEPTION 'Stock insuficiente. Actual: %, Solicitado: %', v_stock_actual, p_cantidad;
    END IF;
  ELSIF p_tipo = 'ajuste' THEN
    v_stock_nuevo := p_cantidad;
  END IF;

  -- Update stock
  UPDATE public.stock_deposito
  SET cantidad_actual = v_stock_nuevo,
      updated_at = now()
  WHERE producto_id = p_producto_id
    AND ubicacion = v_ubicacion;

  -- Insert movement record (with optional idempotency_key)
  INSERT INTO public.movimientos_deposito (
    producto_id, tipo_movimiento, cantidad,
    cantidad_anterior, cantidad_nueva, motivo,
    usuario_id, proveedor_id, observaciones,
    fecha_movimiento, created_at, idempotency_key
  ) VALUES (
    p_producto_id, p_tipo, p_cantidad,
    v_stock_actual, v_stock_nuevo, p_origen,
    p_usuario, p_proveedor_id, p_observaciones,
    now(), now(), p_idempotency_key
  );

  -- Handle orden_compra update
  IF p_orden_compra_id IS NOT NULL THEN
    UPDATE public.ordenes_compra
    SET cantidad_recibida = COALESCE(cantidad_recibida, 0) + p_cantidad,
        estado = CASE
          WHEN COALESCE(cantidad_recibida, 0) + p_cantidad >= cantidad THEN 'completada'
          ELSE 'parcial'
        END,
        updated_at = now()
    WHERE id = p_orden_compra_id
      AND COALESCE(cantidad_recibida, 0) + p_cantidad <= cantidad;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cantidad supera pendiente de recepcion para OC %', p_orden_compra_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'producto_id', p_producto_id,
    'tipo', p_tipo,
    'cantidad', p_cantidad,
    'stock_anterior', v_stock_actual,
    'stock_nuevo', v_stock_nuevo,
    'ubicacion', v_ubicacion,
    'idempotent', false
  );
END;
$$;

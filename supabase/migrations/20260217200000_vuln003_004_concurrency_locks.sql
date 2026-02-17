-- VULN-003: Add FOR UPDATE locking to sp_movimiento_inventario
-- VULN-004: Create sp_actualizar_pago_pedido with atomic read-compute-write
-- D-129: Fase B Safety/Infra

-- ============================================================================
-- VULN-003: Fix sp_movimiento_inventario — add row locking
-- ============================================================================
-- Problem: concurrent calls can read stale stock/OC data (TOCTOU race)
-- Fix: FOR UPDATE on stock_deposito and ordenes_compra reads

DROP FUNCTION IF EXISTS sp_movimiento_inventario(uuid, text, integer, text, text, uuid, uuid, uuid, text);

CREATE OR REPLACE FUNCTION sp_movimiento_inventario(
  p_producto_id uuid,
  p_tipo text,
  p_cantidad integer,
  p_origen text DEFAULT NULL,
  p_destino text DEFAULT NULL,
  p_usuario uuid DEFAULT NULL,
  p_orden_compra_id uuid DEFAULT NULL,
  p_proveedor_id uuid DEFAULT NULL,
  p_observaciones text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ubicacion text := COALESCE(p_destino, p_origen, 'Principal');
  v_stock_actual integer := 0;
  v_stock_nuevo integer := 0;
  v_oc_cantidad integer;
  v_oc_recibida integer;
  v_oc_pendiente integer;
BEGIN
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'Cantidad invalida';
  END IF;

  -- Lock stock row to serialize concurrent inventory operations
  SELECT COALESCE(sd.cantidad_actual, 0)
    INTO v_stock_actual
  FROM public.stock_deposito sd
  WHERE sd.producto_id = p_producto_id AND sd.ubicacion = v_ubicacion
  FOR UPDATE;

  IF p_tipo = 'salida' THEN
    IF v_stock_actual < p_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente';
    END IF;
    v_stock_nuevo := v_stock_actual - p_cantidad;
  ELSE
    v_stock_nuevo := v_stock_actual + p_cantidad;
  END IF;

  IF NOT FOUND THEN
    INSERT INTO public.stock_deposito (producto_id, cantidad_actual, stock_minimo, stock_maximo, ubicacion, created_at)
    VALUES (p_producto_id, v_stock_nuevo, 0, 0, v_ubicacion, now());
  ELSE
    UPDATE public.stock_deposito
      SET cantidad_actual = v_stock_nuevo
    WHERE producto_id = p_producto_id AND ubicacion = v_ubicacion;
  END IF;

  INSERT INTO public.movimientos_deposito (
    producto_id, tipo_movimiento, cantidad,
    cantidad_anterior, cantidad_nueva, motivo,
    usuario_id, proveedor_id, observaciones,
    fecha_movimiento, created_at
  ) VALUES (
    p_producto_id, p_tipo, p_cantidad,
    v_stock_actual, v_stock_nuevo, p_origen,
    p_usuario, p_proveedor_id, p_observaciones,
    now(), now()
  );

  -- If linked to an order, lock the order row first to prevent concurrent reception overwrites
  IF p_orden_compra_id IS NOT NULL THEN
    SELECT oc.cantidad, COALESCE(oc.cantidad_recibida, 0)
      INTO v_oc_cantidad, v_oc_recibida
    FROM public.ordenes_compra oc
    WHERE oc.id = p_orden_compra_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Orden de compra no encontrada: %', p_orden_compra_id;
    END IF;

    v_oc_pendiente := GREATEST(v_oc_cantidad - v_oc_recibida, 0);
    IF p_cantidad > v_oc_pendiente THEN
      RAISE EXCEPTION 'Cantidad (%) supera pendiente de recepcion (%)', p_cantidad, v_oc_pendiente;
    END IF;

    UPDATE public.ordenes_compra
      SET cantidad_recibida = v_oc_recibida + p_cantidad,
          estado = CASE
            WHEN v_oc_recibida + p_cantidad >= v_oc_cantidad THEN 'completada'
            ELSE 'en_transito'
          END,
          updated_at = now()
    WHERE id = p_orden_compra_id;
  END IF;

  RETURN jsonb_build_object(
    'producto_id', p_producto_id,
    'tipo', p_tipo,
    'cantidad', p_cantidad,
    'stock_anterior', v_stock_actual,
    'stock_nuevo', v_stock_nuevo,
    'ubicacion', v_ubicacion
  );
END;
$$;

-- ============================================================================
-- VULN-004: Create sp_actualizar_pago_pedido — atomic payment update
-- ============================================================================
-- Problem: read-compute-write in application layer creates race condition
-- Fix: single SP with FOR UPDATE lock on pedido row

CREATE OR REPLACE FUNCTION sp_actualizar_pago_pedido(
  p_pedido_id uuid,
  p_monto_pagado numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_monto_total numeric;
  v_estado_pago text;
  v_pedido_estado text;
BEGIN
  IF p_monto_pagado IS NULL OR p_monto_pagado < 0 THEN
    RAISE EXCEPTION 'monto_pagado debe ser >= 0';
  END IF;

  -- Lock pedido row to serialize concurrent payment updates
  SELECT p.monto_total, p.estado
    INTO v_monto_total, v_pedido_estado
  FROM public.pedidos p
  WHERE p.id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PEDIDO_NO_ENCONTRADO: %', p_pedido_id;
  END IF;

  -- Compute payment state atomically
  IF p_monto_pagado >= COALESCE(v_monto_total, 0) THEN
    v_estado_pago := 'pagado';
  ELSIF p_monto_pagado > 0 THEN
    v_estado_pago := 'parcial';
  ELSE
    v_estado_pago := 'pendiente';
  END IF;

  UPDATE public.pedidos
    SET monto_pagado = p_monto_pagado,
        estado_pago = v_estado_pago,
        updated_at = now()
  WHERE id = p_pedido_id;

  RETURN jsonb_build_object(
    'pedido_id', p_pedido_id,
    'monto_pagado', p_monto_pagado,
    'monto_total', v_monto_total,
    'estado_pago', v_estado_pago
  );
END;
$$;

-- Update sp_movimiento_inventario to validate stock and persist extra context.
DROP FUNCTION IF EXISTS sp_movimiento_inventario(
  uuid,
  text,
  integer,
  text,
  text,
  uuid,
  uuid
);
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
) RETURNS jsonb AS $$
DECLARE
  v_ubicacion text := COALESCE(p_destino, p_origen, 'Principal');
  v_stock_actual integer := 0;
  v_stock_nuevo integer := 0;
BEGIN
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'Cantidad invalida';
  END IF;

  SELECT COALESCE(cantidad_actual, 0)
    INTO v_stock_actual
  FROM stock_deposito
  WHERE producto_id = p_producto_id AND ubicacion = v_ubicacion
  LIMIT 1;

  IF p_tipo = 'salida' THEN
    IF v_stock_actual < p_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente';
    END IF;
    v_stock_nuevo := v_stock_actual - p_cantidad;
  ELSE
    v_stock_nuevo := v_stock_actual + p_cantidad;
  END IF;

  IF v_stock_actual = 0 THEN
    INSERT INTO stock_deposito (producto_id, cantidad_actual, stock_minimo, stock_maximo, ubicacion, created_at)
    VALUES (p_producto_id, v_stock_nuevo, 0, 0, v_ubicacion, now());
  ELSE
    UPDATE stock_deposito
      SET cantidad_actual = v_stock_nuevo
    WHERE producto_id = p_producto_id AND ubicacion = v_ubicacion;
  END IF;

  INSERT INTO movimientos_deposito (
    producto_id,
    tipo_movimiento,
    cantidad,
    cantidad_anterior,
    cantidad_nueva,
    motivo,
    usuario_id,
    proveedor_id,
    observaciones,
    fecha_movimiento,
    created_at
  ) VALUES (
    p_producto_id,
    p_tipo,
    p_cantidad,
    v_stock_actual,
    v_stock_nuevo,
    p_origen,
    p_usuario,
    p_proveedor_id,
    p_observaciones,
    now(),
    now()
  );

  IF p_orden_compra_id IS NOT NULL THEN
    UPDATE ordenes_compra
      SET cantidad_recibida = COALESCE(cantidad_recibida, 0) + p_cantidad,
          estado = CASE
            WHEN COALESCE(cantidad_recibida, 0) + p_cantidad >= cantidad THEN 'completada'
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
$$ LANGUAGE plpgsql;

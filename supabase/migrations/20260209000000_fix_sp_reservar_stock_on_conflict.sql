-- Fix sp_reservar_stock: ON CONFLICT must reference partial index predicate.
--
-- Problem: The partial unique index idx_stock_reservado_idempotency_key has
-- WHERE idempotency_key IS NOT NULL, but the SP's ON CONFLICT clause didn't
-- include the predicate, causing PostgreSQL to fail with:
--   "there is no unique or exclusion constraint matching the ON CONFLICT specification"
--
-- Fix: Add WHERE clause to ON CONFLICT to match the partial index.

CREATE OR REPLACE FUNCTION public.sp_reservar_stock(
  p_producto_id uuid,
  p_cantidad integer,
  p_usuario uuid DEFAULT NULL,
  p_referencia text DEFAULT NULL,
  p_deposito text DEFAULT 'Principal',
  p_idempotency_key text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_deposito text := COALESCE(NULLIF(trim(p_deposito), ''), 'Principal');
  v_stock_actual integer := 0;
  v_reservado integer := 0;
  v_disponible integer := 0;
  v_reserva stock_reservado%ROWTYPE;
  v_existing stock_reservado%ROWTYPE;
BEGIN
  IF p_producto_id IS NULL THEN
    RAISE EXCEPTION 'producto_id requerido';
  END IF;

  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'cantidad invalida: debe ser mayor a 0';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM productos WHERE id = p_producto_id) THEN
    RAISE EXCEPTION 'Producto no encontrado: %', p_producto_id;
  END IF;

  SELECT COALESCE(cantidad_actual, 0)
    INTO v_stock_actual
  FROM stock_deposito
  WHERE producto_id = p_producto_id AND ubicacion = v_deposito
  FOR UPDATE;

  IF NOT FOUND THEN
    v_stock_actual := 0;
  END IF;

  SELECT COALESCE(SUM(sr.cantidad), 0)
    INTO v_reservado
  FROM stock_reservado sr
  WHERE sr.producto_id = p_producto_id AND sr.estado = 'activa';

  v_disponible := v_stock_actual - v_reservado;

  IF v_disponible < p_cantidad THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INSUFFICIENT_STOCK',
      DETAIL = format('disponible=%s solicitado=%s', v_disponible, p_cantidad);
  END IF;

  INSERT INTO stock_reservado (
    producto_id,
    cantidad,
    estado,
    referencia,
    usuario,
    fecha_reserva,
    idempotency_key
  ) VALUES (
    p_producto_id,
    p_cantidad,
    'activa',
    p_referencia,
    p_usuario,
    now(),
    p_idempotency_key
  )
  ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
  RETURNING * INTO v_reserva;

  IF v_reserva.id IS NULL THEN
    IF p_idempotency_key IS NULL THEN
      RAISE EXCEPTION 'No se pudo crear reserva';
    END IF;

    SELECT *
      INTO v_existing
    FROM stock_reservado
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing.id IS NULL THEN
      RAISE EXCEPTION 'Reserva ya existente pero no encontrada';
    END IF;

    RETURN jsonb_build_object(
      'reserva', row_to_json(v_existing),
      'idempotent', true,
      'stock_disponible', v_disponible
    );
  END IF;

  RETURN jsonb_build_object(
    'reserva', row_to_json(v_reserva),
    'idempotent', false,
    'stock_disponible', v_disponible - p_cantidad
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

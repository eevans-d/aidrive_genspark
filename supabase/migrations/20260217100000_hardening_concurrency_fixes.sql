-- ============================================================================
-- HARDENING: Concurrency & Data Integrity Fixes
-- Fecha: 2026-02-17
-- Pre-mortem findings: stock negativo, idempotency TOCTOU, credit limit bypass,
--                      price drift between loops
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) CHECK constraint: stock nunca negativo (Priority #1)
-- ----------------------------------------------------------------------------
-- Sin este CHECK, race conditions o bugs futuros pueden dejar stock_deposito
-- en valores negativos, causando inventarios fantasma irrecuperables.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stock_no_negativo'
      AND conrelid = 'public.stock_deposito'::regclass
  ) THEN
    ALTER TABLE public.stock_deposito
      ADD CONSTRAINT stock_no_negativo CHECK (cantidad_actual >= 0);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2) sp_procesar_venta_pos: fix idempotency TOCTOU, credit limit bypass,
--    and price drift between loops
-- ----------------------------------------------------------------------------
-- Changes:
-- a) Idempotency check: use FOR UPDATE to serialize concurrent identical keys.
--    Additionally, wrap the INSERT in an EXCEPTION block to handle the rare case
--    where two transactions pass the SELECT simultaneously (unique_violation → return existing).
-- b) Credit limit: add FOR UPDATE on clientes row to serialize concurrent fiado sales.
-- c) Price drift: use FOR SHARE on productos rows in the pre-validation loop, so the
--    second loop reads exactly the same prices.

CREATE OR REPLACE FUNCTION public.sp_procesar_venta_pos(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role_ok boolean := public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor']);
  v_idempotency_key text := btrim(COALESCE(payload->>'idempotency_key', ''));
  v_metodo_pago text := lower(btrim(COALESCE(payload->>'metodo_pago', '')));
  v_cliente_id uuid := NULL;
  v_confirmar_riesgo boolean := COALESCE((payload->>'confirmar_riesgo')::boolean, false);
  v_venta_id uuid;
  v_total numeric(12,2) := 0;
  v_item jsonb;
  v_producto_id uuid;
  v_cantidad integer;
  v_precio_unitario numeric(12,2);
  v_subtotal numeric(12,2);
  v_stock_actual integer;
  v_reservado integer;
  v_riesgo boolean;
  v_limite numeric(12,2);
  v_saldo numeric(12,2);
  v_stock_nuevo integer;
  v_nombre text;
  v_sku text;
BEGIN
  IF NOT v_role_ok THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF v_idempotency_key = '' THEN
    RAISE EXCEPTION 'IDEMPOTENCY_KEY_REQUIRED';
  END IF;

  -- Idempotency: si ya existe, retornar la venta existente (y sus items)
  -- FIX: FOR UPDATE serializa concurrent checks con la misma key
  SELECT id INTO v_venta_id
  FROM public.ventas
  WHERE idempotency_key = v_idempotency_key
  FOR UPDATE;

  IF FOUND THEN
    RETURN (
      SELECT jsonb_build_object(
        'id', v.id,
        'idempotency_key', v.idempotency_key,
        'metodo_pago', v.metodo_pago,
        'cliente_id', v.cliente_id,
        'monto_total', v.monto_total,
        'created_at', v.created_at,
        'status', 'existing',
        'items', COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', vi.id,
              'producto_id', vi.producto_id,
              'producto_nombre', vi.producto_nombre_snapshot,
              'producto_sku', vi.producto_sku_snapshot,
              'cantidad', vi.cantidad,
              'precio_unitario', vi.precio_unitario,
              'subtotal', vi.subtotal
            )
          ) FILTER (WHERE vi.id IS NOT NULL),
          '[]'::jsonb
        )
      )
      FROM public.ventas v
      LEFT JOIN public.venta_items vi ON vi.venta_id = v.id
      WHERE v.id = v_venta_id
      GROUP BY v.id
    );
  END IF;

  IF v_metodo_pago NOT IN ('efectivo', 'tarjeta', 'cuenta_corriente') THEN
    RAISE EXCEPTION 'METODO_PAGO_INVALIDO';
  END IF;

  IF v_metodo_pago = 'cuenta_corriente' THEN
    IF btrim(COALESCE(payload->>'cliente_id','')) = '' THEN
      RAISE EXCEPTION 'CLIENTE_REQUIRED_FOR_CC';
    END IF;
    v_cliente_id := (payload->>'cliente_id')::uuid;
  ELSE
    IF btrim(COALESCE(payload->>'cliente_id','')) <> '' THEN
      v_cliente_id := (payload->>'cliente_id')::uuid;
    END IF;
  END IF;

  IF jsonb_typeof(payload->'items') <> 'array' OR jsonb_array_length(payload->'items') = 0 THEN
    RAISE EXCEPTION 'ITEMS_REQUIRED';
  END IF;

  -- 1) Pre-validar: stock + riesgo + total (orden estable por producto_id)
  --    FIX: Use FOR SHARE on productos to prevent price changes during this transaction
  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(payload->'items') AS t(value)
    ORDER BY (value->>'producto_id')
  LOOP
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::integer;
    IF v_cantidad IS NULL OR v_cantidad <= 0 THEN
      RAISE EXCEPTION 'CANTIDAD_INVALIDA';
    END IF;

    SELECT p.precio_actual, p.nombre, p.sku
      INTO v_precio_unitario, v_nombre, v_sku
    FROM public.productos p
    WHERE p.id = v_producto_id AND p.activo = true
    FOR SHARE;

    IF NOT FOUND OR v_precio_unitario IS NULL THEN
      RAISE EXCEPTION 'PRODUCTO_NO_ENCONTRADO';
    END IF;

    -- Riesgo de pérdida: si existe vista arbitraje y marca riesgo, requiere confirmación
    SELECT va.riesgo_perdida INTO v_riesgo
    FROM public.vista_arbitraje_producto va
    WHERE va.producto_id = v_producto_id;

    IF COALESCE(v_riesgo, false) AND NOT v_confirmar_riesgo THEN
      RAISE EXCEPTION 'LOSS_RISK_CONFIRM_REQUIRED';
    END IF;

    -- Lock de stock en Principal
    SELECT COALESCE(sd.cantidad_actual, 0)
      INTO v_stock_actual
    FROM public.stock_deposito sd
    WHERE sd.producto_id = v_producto_id AND sd.ubicacion = 'Principal'
    FOR UPDATE;

    IF NOT FOUND THEN
      v_stock_actual := 0;
    END IF;

    SELECT COALESCE(SUM(sr.cantidad), 0)
      INTO v_reservado
    FROM public.stock_reservado sr
    WHERE sr.producto_id = v_producto_id AND sr.estado = 'activa';

    IF (v_stock_actual - v_reservado) < v_cantidad THEN
      RAISE EXCEPTION 'STOCK_INSUFICIENTE';
    END IF;

    v_subtotal := fnc_redondear_precio(v_precio_unitario * v_cantidad);
    v_total := fnc_redondear_precio(v_total + v_subtotal);
  END LOOP;

  -- 2) Validar crédito (si aplica)
  --    FIX: FOR UPDATE on clientes row to serialize concurrent fiado sales to same client
  IF v_metodo_pago = 'cuenta_corriente' THEN
    SELECT c.limite_credito INTO v_limite
    FROM public.clientes c
    WHERE c.id = v_cliente_id AND c.activo = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'CLIENTE_NO_ENCONTRADO';
    END IF;

    SELECT COALESCE(SUM(m.monto), 0)::numeric(12,2) INTO v_saldo
    FROM public.cuentas_corrientes_movimientos m
    WHERE m.cliente_id = v_cliente_id;

    IF v_limite IS NOT NULL AND (v_saldo + v_total) > v_limite THEN
      RAISE EXCEPTION 'CREDIT_LIMIT_EXCEEDED';
    END IF;
  END IF;

  -- 3) Insert venta
  --    FIX: Handle unique_violation for idempotency TOCTOU edge case
  BEGIN
    INSERT INTO public.ventas (idempotency_key, usuario_id, cliente_id, metodo_pago, monto_total)
    VALUES (v_idempotency_key, v_user_id, v_cliente_id, v_metodo_pago, v_total)
    RETURNING id INTO v_venta_id;
  EXCEPTION WHEN unique_violation THEN
    -- Another concurrent transaction already inserted this idempotency_key.
    -- Return the existing sale (idempotent response).
    SELECT id INTO v_venta_id
    FROM public.ventas
    WHERE idempotency_key = v_idempotency_key;

    RETURN (
      SELECT jsonb_build_object(
        'id', v.id,
        'idempotency_key', v.idempotency_key,
        'metodo_pago', v.metodo_pago,
        'cliente_id', v.cliente_id,
        'monto_total', v.monto_total,
        'created_at', v.created_at,
        'status', 'existing',
        'items', COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', vi.id,
              'producto_id', vi.producto_id,
              'producto_nombre', vi.producto_nombre_snapshot,
              'producto_sku', vi.producto_sku_snapshot,
              'cantidad', vi.cantidad,
              'precio_unitario', vi.precio_unitario,
              'subtotal', vi.subtotal
            )
          ) FILTER (WHERE vi.id IS NOT NULL),
          '[]'::jsonb
        )
      )
      FROM public.ventas v
      LEFT JOIN public.venta_items vi ON vi.venta_id = v.id
      WHERE v.id = v_venta_id
      GROUP BY v.id
    );
  END;

  -- 4) Insert items + descontar stock + movimiento kardex
  --    Prices are already locked by FOR SHARE from loop 1, so no drift possible
  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(payload->'items') AS t(value)
    ORDER BY (value->>'producto_id')
  LOOP
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::integer;

    SELECT p.precio_actual, p.nombre, p.sku
      INTO v_precio_unitario, v_nombre, v_sku
    FROM public.productos p
    WHERE p.id = v_producto_id AND p.activo = true;

    v_subtotal := fnc_redondear_precio(v_precio_unitario * v_cantidad);

    INSERT INTO public.venta_items (
      venta_id,
      producto_id,
      producto_nombre_snapshot,
      producto_sku_snapshot,
      cantidad,
      precio_unitario,
      subtotal
    ) VALUES (
      v_venta_id,
      v_producto_id,
      v_nombre,
      v_sku,
      v_cantidad,
      v_precio_unitario,
      v_subtotal
    );

    -- Descontar stock (Principal)
    UPDATE public.stock_deposito
      SET cantidad_actual = cantidad_actual - v_cantidad,
          updated_at = now()
    WHERE producto_id = v_producto_id AND ubicacion = 'Principal'
    RETURNING cantidad_actual INTO v_stock_nuevo;

    IF NOT FOUND THEN
      -- Esto no debería ocurrir si la pre-validación bloqueó correctamente.
      RAISE EXCEPTION 'STOCK_ROW_MISSING';
    END IF;

    -- Registrar movimiento tipo 'venta' (para rotación)
    INSERT INTO public.movimientos_deposito (
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
      v_producto_id,
      'venta',
      v_cantidad,
      v_stock_nuevo + v_cantidad,
      v_stock_nuevo,
      'Venta POS',
      v_user_id,
      NULL,
      'venta_id=' || v_venta_id::text,
      now(),
      now()
    );
  END LOOP;

  -- 5) Ledger cuenta corriente (si aplica)
  IF v_metodo_pago = 'cuenta_corriente' THEN
    INSERT INTO public.cuentas_corrientes_movimientos (
      cliente_id,
      venta_id,
      usuario_id,
      tipo,
      monto,
      descripcion
    ) VALUES (
      v_cliente_id,
      v_venta_id,
      v_user_id,
      'cargo',
      v_total,
      'Venta POS (fiado)'
    );
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'id', v.id,
      'idempotency_key', v.idempotency_key,
      'metodo_pago', v.metodo_pago,
      'cliente_id', v.cliente_id,
      'monto_total', v.monto_total,
      'created_at', v.created_at,
      'status', 'created',
      'items', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', vi.id,
            'producto_id', vi.producto_id,
            'producto_nombre', vi.producto_nombre_snapshot,
            'producto_sku', vi.producto_sku_snapshot,
            'cantidad', vi.cantidad,
            'precio_unitario', vi.precio_unitario,
            'subtotal', vi.subtotal
          )
        ) FILTER (WHERE vi.id IS NOT NULL),
        '[]'::jsonb
      )
    )
    FROM public.ventas v
    LEFT JOIN public.venta_items vi ON vi.venta_id = v.id
    WHERE v.id = v_venta_id
    GROUP BY v.id
  );
END;
$$;

COMMENT ON FUNCTION public.sp_procesar_venta_pos(jsonb) IS
  'Procesa una venta POS de forma atómica (stock + items + movimiento + ledger). Requiere idempotency_key. Hardened: FOR UPDATE idempotency, FOR SHARE precios, FOR UPDATE crédito.';

COMMIT;

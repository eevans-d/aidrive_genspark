-- ============================================================================
-- FASE 4: Anti-mermas (Zona de Oferta)
-- Fecha: 2026-02-07
-- ============================================================================
-- Objetivos:
-- - Tabla ofertas_stock (oferta por stock_id; modelo actual no soporta FEFO real)
-- - Vista vista_ofertas_sugeridas (<= 7 días -> sugiere 30% OFF)
-- - RPCs: aplicar/desactivar oferta (idempotente por stock_id activa)
-- - POS: sp_procesar_venta_pos usa precio_oferta si hay oferta activa (Principal)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Tabla: ofertas_stock
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ofertas_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid NOT NULL REFERENCES public.stock_deposito(id) ON DELETE CASCADE,
  descuento_pct numeric(5,2) NOT NULL CHECK (descuento_pct > 0 AND descuento_pct < 100),
  precio_oferta numeric(12,2) NOT NULL CHECK (precio_oferta >= 0),
  activa boolean NOT NULL DEFAULT true,
  created_by uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deactivated_by uuid NULL,
  deactivated_at timestamptz NULL
);

COMMENT ON TABLE public.ofertas_stock IS
  'Ofertas temporales por stock_id. activa=true indica que el POS debe usar precio_oferta.';

CREATE INDEX IF NOT EXISTS idx_ofertas_stock_stock_id ON public.ofertas_stock (stock_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_stock_created_at ON public.ofertas_stock (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ofertas_stock_unique_active
  ON public.ofertas_stock (stock_id)
  WHERE activa;

-- Trigger updated_at (ya existe trigger_set_updated_at en repo)
DROP TRIGGER IF EXISTS set_ofertas_stock_updated_at ON public.ofertas_stock;
CREATE TRIGGER set_ofertas_stock_updated_at
  BEFORE UPDATE ON public.ofertas_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- RLS: solo lectura directa; escrituras via RPC SECURITY DEFINER.
ALTER TABLE public.ofertas_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ofertas_stock_select_base ON public.ofertas_stock;
CREATE POLICY ofertas_stock_select_base
  ON public.ofertas_stock
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor','deposito','depósito']));

REVOKE ALL ON public.ofertas_stock FROM anon;
REVOKE ALL ON public.ofertas_stock FROM authenticated;
GRANT SELECT ON public.ofertas_stock TO authenticated;

-- ----------------------------------------------------------------------------
-- 2) Vista: vista_ofertas_sugeridas (<= 7 días, sin oferta activa)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.vista_ofertas_sugeridas AS
SELECT
  mv.stock_id,
  mv.producto_id,
  mv.producto_nombre,
  mv.sku,
  mv.codigo_barras,
  mv.ubicacion,
  mv.fecha_vencimiento,
  mv.dias_hasta_vencimiento,
  mv.cantidad_actual,
  30::numeric(5,2) AS descuento_sugerido_pct,
  p.precio_actual AS precio_base,
  fnc_redondear_precio(p.precio_actual * (1 - (30::numeric / 100))) AS precio_oferta_sugerido,
  now() AS as_of
FROM public.mv_productos_proximos_vencer mv
JOIN public.productos p ON p.id = mv.producto_id
LEFT JOIN public.ofertas_stock os ON os.stock_id = mv.stock_id AND os.activa = true
WHERE
  mv.cantidad_actual > 0
  AND mv.dias_hasta_vencimiento <= 7
  AND p.activo = true
  AND p.precio_actual IS NOT NULL
  AND os.id IS NULL;

COMMENT ON VIEW public.vista_ofertas_sugeridas IS
  'Sugerencias de oferta (<= 7 días) para reducir merma. Excluye stock_id con oferta activa.';

-- ----------------------------------------------------------------------------
-- 3) RPC: aplicar/desactivar oferta (idempotente)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sp_aplicar_oferta_stock(
  p_stock_id uuid,
  p_descuento_pct numeric DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role_ok boolean := public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor','deposito','depósito']);
  v_precio_base numeric;
  v_precio_oferta numeric;
  v_existing public.ofertas_stock%ROWTYPE;
  v_new_id uuid;
BEGIN
  IF NOT v_role_ok THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF p_stock_id IS NULL THEN
    RAISE EXCEPTION 'STOCK_ID_REQUIRED';
  END IF;

  IF p_descuento_pct IS NULL OR p_descuento_pct <= 0 OR p_descuento_pct >= 100 THEN
    RAISE EXCEPTION 'DESCUENTO_INVALIDO';
  END IF;

  -- Idempotente: si ya existe activa, devolverla
  SELECT * INTO v_existing
  FROM public.ofertas_stock
  WHERE stock_id = p_stock_id AND activa = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object('status', 'existing', 'oferta', to_jsonb(v_existing));
  END IF;

  SELECT p.precio_actual INTO v_precio_base
  FROM public.stock_deposito sd
  JOIN public.productos p ON p.id = sd.producto_id
  WHERE sd.id = p_stock_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STOCK_NO_ENCONTRADO';
  END IF;

  IF v_precio_base IS NULL OR v_precio_base <= 0 THEN
    RAISE EXCEPTION 'PRECIO_BASE_INVALIDO';
  END IF;

  v_precio_oferta := fnc_redondear_precio(v_precio_base * (1 - (p_descuento_pct / 100)));

  BEGIN
    INSERT INTO public.ofertas_stock (
      stock_id,
      descuento_pct,
      precio_oferta,
      activa,
      created_by
    ) VALUES (
      p_stock_id,
      p_descuento_pct,
      v_precio_oferta,
      true,
      v_user_id
    )
    RETURNING id INTO v_new_id;
  EXCEPTION WHEN unique_violation THEN
    -- Otra petición la creó; devolver la activa
    SELECT * INTO v_existing
    FROM public.ofertas_stock
    WHERE stock_id = p_stock_id AND activa = true
    ORDER BY created_at DESC
    LIMIT 1;
    RETURN jsonb_build_object('status', 'existing', 'oferta', to_jsonb(v_existing));
  END;

  RETURN jsonb_build_object(
    'status', 'created',
    'oferta', (SELECT to_jsonb(o) FROM public.ofertas_stock o WHERE o.id = v_new_id)
  );
END;
$$;

COMMENT ON FUNCTION public.sp_aplicar_oferta_stock(uuid, numeric) IS
  'Aplica oferta por stock_id (idempotente si ya existe activa). Calcula precio_oferta con redondeo.';

CREATE OR REPLACE FUNCTION public.sp_desactivar_oferta_stock(
  p_oferta_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role_ok boolean := public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor','deposito','depósito']);
  v_row public.ofertas_stock%ROWTYPE;
BEGIN
  IF NOT v_role_ok THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF p_oferta_id IS NULL THEN
    RAISE EXCEPTION 'OFERTA_ID_REQUIRED';
  END IF;

  SELECT * INTO v_row
  FROM public.ofertas_stock
  WHERE id = p_oferta_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  IF v_row.activa IS TRUE THEN
    UPDATE public.ofertas_stock
      SET activa = false,
          deactivated_at = now(),
          deactivated_by = v_user_id,
          updated_at = now()
    WHERE id = p_oferta_id
    RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object('status', 'ok', 'oferta', to_jsonb(v_row));
END;
$$;

COMMENT ON FUNCTION public.sp_desactivar_oferta_stock(uuid) IS
  'Desactiva oferta por id (si ya está inactiva, devuelve igual).';

-- ----------------------------------------------------------------------------
-- 4) POS: usar precio_oferta activa (Principal) en sp_procesar_venta_pos
-- ----------------------------------------------------------------------------

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
  SELECT id INTO v_venta_id
  FROM public.ventas
  WHERE idempotency_key = v_idempotency_key;

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

    -- Precio unitario efectivo: oferta activa (Principal) o precio base
    SELECT
      COALESCE(os.precio_oferta, p.precio_actual),
      p.nombre,
      p.sku
      INTO v_precio_unitario, v_nombre, v_sku
    FROM public.productos p
    LEFT JOIN public.stock_deposito sd ON sd.producto_id = p.id AND sd.ubicacion = 'Principal'
    LEFT JOIN public.ofertas_stock os ON os.stock_id = sd.id AND os.activa = true
    WHERE p.id = v_producto_id AND p.activo = true;

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
  IF v_metodo_pago = 'cuenta_corriente' THEN
    SELECT c.limite_credito INTO v_limite
    FROM public.clientes c
    WHERE c.id = v_cliente_id AND c.activo = true;

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
  INSERT INTO public.ventas (idempotency_key, usuario_id, cliente_id, metodo_pago, monto_total)
  VALUES (v_idempotency_key, v_user_id, v_cliente_id, v_metodo_pago, v_total)
  RETURNING id INTO v_venta_id;

  -- 4) Insert items + descontar stock + movimiento kardex
  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(payload->'items') AS t(value)
    ORDER BY (value->>'producto_id')
  LOOP
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::integer;

    SELECT
      COALESCE(os.precio_oferta, p.precio_actual),
      p.nombre,
      p.sku
      INTO v_precio_unitario, v_nombre, v_sku
    FROM public.productos p
    LEFT JOIN public.stock_deposito sd ON sd.producto_id = p.id AND sd.ubicacion = 'Principal'
    LEFT JOIN public.ofertas_stock os ON os.stock_id = sd.id AND os.activa = true
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

COMMIT;


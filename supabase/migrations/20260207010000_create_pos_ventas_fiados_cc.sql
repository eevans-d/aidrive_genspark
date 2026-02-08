-- ============================================================================
-- FASE 2: POS MVP + FIADOS / CUENTA CORRIENTE
-- Fecha: 2026-02-07
-- ============================================================================
-- Objetivos:
-- - Extender clientes (limite_credito, whatsapp, link_pago)
-- - Crear ventas + items (idempotencia)
-- - Crear ledger de cuenta corriente por cliente
-- - RPCs atómicas para POS (stock + venta + ledger)
-- - Vistas de saldos y resumen ("dinero en la calle")
--
-- Notas:
-- - Toda SP nueva: SECURITY DEFINER + SET search_path = public
-- - Autorización interna: public.has_personal_role(...)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Extender public.clientes
-- ----------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.clientes
  ADD COLUMN IF NOT EXISTS limite_credito numeric(12,2) NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_e164 text NULL,
  ADD COLUMN IF NOT EXISTS link_pago text NULL;

COMMENT ON COLUMN public.clientes.limite_credito IS
  'Límite de crédito (cuenta corriente). NULL = sin límite (pero UI debe advertir).';
COMMENT ON COLUMN public.clientes.whatsapp_e164 IS
  'Número WhatsApp en formato E.164 (ej: +54911...).';
COMMENT ON COLUMN public.clientes.link_pago IS
  'Link opcional de pago (MercadoPago u otro).';

-- Enforce: ventas puede crear/editar clientes, pero limite_credito solo admin.
-- La RLS no puede restringir por columna (sin comparar OLD/NEW),
-- por lo que se usa un trigger para impedir cambios de limite_credito
-- por usuarios no-admin.
CREATE OR REPLACE FUNCTION public.trg_clientes_limite_credito_only_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.limite_credito IS NOT NULL THEN
      IF NOT public.has_personal_role(ARRAY['admin','administrador']) THEN
        RAISE EXCEPTION 'LIMITE_CREDITO_SOLO_ADMIN';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.limite_credito IS DISTINCT FROM OLD.limite_credito THEN
      IF NOT public.has_personal_role(ARRAY['admin','administrador']) THEN
        RAISE EXCEPTION 'LIMITE_CREDITO_SOLO_ADMIN';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clientes_limite_credito_only_admin ON public.clientes;
CREATE TRIGGER clientes_limite_credito_only_admin
  BEFORE INSERT OR UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_clientes_limite_credito_only_admin();

-- Ajuste de políticas RLS: permitir ventas en INSERT/UPDATE (mantener DELETE solo admin).
-- Se reemplazan policies anteriores si existen.
DROP POLICY IF EXISTS clientes_insert_admin_deposito ON public.clientes;
DROP POLICY IF EXISTS clientes_update_admin_deposito ON public.clientes;

CREATE POLICY clientes_insert_base_roles ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor','deposito','depósito']));

CREATE POLICY clientes_update_base_roles ON public.clientes
  FOR UPDATE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor','deposito','depósito']))
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor','deposito','depósito']));

-- ----------------------------------------------------------------------------
-- 2) Tablas POS: ventas + venta_items
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL,
  usuario_id uuid NOT NULL,
  cliente_id uuid NULL REFERENCES public.clientes(id) ON DELETE SET NULL,
  metodo_pago text NOT NULL,
  monto_total numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_idempotency_key
  ON public.ventas (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ventas_created_at
  ON public.ventas (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id
  ON public.ventas (cliente_id);

COMMENT ON TABLE public.ventas IS 'Ventas POS (MVP). Idempotencia por header Idempotency-Key.';

-- Trigger updated_at reutiliza trigger_set_updated_at (ya existe en repo).
DROP TRIGGER IF EXISTS set_ventas_updated_at ON public.ventas;
CREATE TRIGGER set_ventas_updated_at
  BEFORE UPDATE ON public.ventas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS public.venta_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  producto_nombre_snapshot text NOT NULL,
  producto_sku_snapshot text NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id
  ON public.venta_items (venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_producto_id
  ON public.venta_items (producto_id);

COMMENT ON TABLE public.venta_items IS 'Items de venta POS (snapshot de nombre/sku + precio unitario).';

-- ----------------------------------------------------------------------------
-- 3) Ledger: cuentas_corrientes_movimientos
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cuentas_corrientes_movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  venta_id uuid NULL REFERENCES public.ventas(id) ON DELETE SET NULL,
  usuario_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('cargo','pago','ajuste')),
  monto numeric(12,2) NOT NULL,
  descripcion text NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_mov_cliente_id
  ON public.cuentas_corrientes_movimientos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_cc_mov_created_at
  ON public.cuentas_corrientes_movimientos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cc_mov_venta_id
  ON public.cuentas_corrientes_movimientos (venta_id);

COMMENT ON TABLE public.cuentas_corrientes_movimientos IS
  'Ledger cuenta corriente por cliente. Convención: cargo=monto positivo; pago=monto negativo.';

-- ----------------------------------------------------------------------------
-- 4) RLS: ventas / venta_items / cuentas_corrientes_movimientos
-- ----------------------------------------------------------------------------

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_corrientes_movimientos ENABLE ROW LEVEL SECURITY;

-- SELECT permitido para roles base (admin/ventas) - el resto, sin acceso.
DROP POLICY IF EXISTS ventas_select_base ON public.ventas;
CREATE POLICY ventas_select_base
  ON public.ventas
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor']));

DROP POLICY IF EXISTS venta_items_select_base ON public.venta_items;
CREATE POLICY venta_items_select_base
  ON public.venta_items
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor']));

DROP POLICY IF EXISTS cc_mov_select_base ON public.cuentas_corrientes_movimientos;
CREATE POLICY cc_mov_select_base
  ON public.cuentas_corrientes_movimientos
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor']));

-- No policies de INSERT/UPDATE/DELETE para estas tablas: deben escribirse vía RPC SECURITY DEFINER.

REVOKE ALL ON public.ventas FROM anon;
REVOKE ALL ON public.venta_items FROM anon;
REVOKE ALL ON public.cuentas_corrientes_movimientos FROM anon;
GRANT SELECT ON public.ventas TO authenticated;
GRANT SELECT ON public.venta_items TO authenticated;
GRANT SELECT ON public.cuentas_corrientes_movimientos TO authenticated;

-- ----------------------------------------------------------------------------
-- 5) Vistas: saldos por cliente + resumen
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.vista_cc_saldos_por_cliente AS
SELECT
  c.id AS cliente_id,
  c.nombre,
  c.telefono,
  c.email,
  c.whatsapp_e164,
  c.link_pago,
  c.limite_credito,
  COALESCE(SUM(m.monto), 0)::numeric(12,2) AS saldo,
  MAX(m.created_at) AS ultimo_movimiento
FROM public.clientes c
LEFT JOIN public.cuentas_corrientes_movimientos m ON m.cliente_id = c.id
WHERE c.activo = true
GROUP BY
  c.id, c.nombre, c.telefono, c.email, c.whatsapp_e164, c.link_pago, c.limite_credito;

COMMENT ON VIEW public.vista_cc_saldos_por_cliente IS
  'Saldo por cliente (cuenta corriente). saldo>0 = deuda.';

CREATE OR REPLACE VIEW public.vista_cc_resumen AS
SELECT
  COALESCE(SUM(GREATEST(s.saldo, 0)), 0)::numeric(12,2) AS dinero_en_la_calle,
  COUNT(*) FILTER (WHERE s.saldo > 0) AS clientes_con_deuda,
  now() AS as_of
FROM public.vista_cc_saldos_por_cliente s;

COMMENT ON VIEW public.vista_cc_resumen IS
  'Resumen cuenta corriente: dinero en la calle y cantidad de clientes con deuda.';

-- ----------------------------------------------------------------------------
-- 6) RPC: sp_procesar_venta_pos (atómica) + sp_registrar_pago_cc
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

    SELECT p.precio_actual, p.nombre, p.sku
      INTO v_precio_unitario, v_nombre, v_sku
    FROM public.productos p
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
  'Procesa una venta POS de forma atómica (stock + items + movimiento + ledger). Requiere idempotency_key.';

CREATE OR REPLACE FUNCTION public.sp_registrar_pago_cc(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role_ok boolean := public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor']);
  v_cliente_id uuid := (payload->>'cliente_id')::uuid;
  v_monto numeric(12,2) := (payload->>'monto')::numeric;
  v_desc text := NULL;
  v_saldo numeric(12,2);
BEGIN
  IF NOT v_role_ok THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION 'CLIENTE_ID_REQUIRED';
  END IF;

  IF v_monto IS NULL OR v_monto <= 0 THEN
    RAISE EXCEPTION 'MONTO_INVALIDO';
  END IF;

  IF btrim(COALESCE(payload->>'descripcion','')) <> '' THEN
    v_desc := btrim(payload->>'descripcion');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = v_cliente_id AND c.activo = true) THEN
    RAISE EXCEPTION 'CLIENTE_NO_ENCONTRADO';
  END IF;

  -- Pago: monto negativo
  INSERT INTO public.cuentas_corrientes_movimientos (
    cliente_id,
    venta_id,
    usuario_id,
    tipo,
    monto,
    descripcion
  ) VALUES (
    v_cliente_id,
    NULL,
    v_user_id,
    'pago',
    -v_monto,
    COALESCE(v_desc, 'Pago cuenta corriente')
  );

  SELECT COALESCE(SUM(m.monto), 0)::numeric(12,2) INTO v_saldo
  FROM public.cuentas_corrientes_movimientos m
  WHERE m.cliente_id = v_cliente_id;

  RETURN jsonb_build_object(
    'cliente_id', v_cliente_id,
    'saldo', v_saldo
  );
END;
$$;

COMMENT ON FUNCTION public.sp_registrar_pago_cc(jsonb) IS
  'Registra pago en cuenta corriente (ledger) y retorna saldo actualizado.';

COMMIT;

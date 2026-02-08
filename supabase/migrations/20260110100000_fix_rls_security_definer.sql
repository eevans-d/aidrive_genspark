-- Fixes for security-definer functions and critical stock movement logic.
-- Safe changes: add search_path, validate inputs, and protect concurrency.

-- 1) Harden SECURITY DEFINER functions with explicit search_path
DO $$
BEGIN
  IF to_regprocedure('public.sp_aplicar_precio(uuid,numeric,numeric)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.sp_aplicar_precio(uuid, numeric, numeric) SET search_path = public';
  END IF;

  IF to_regprocedure('public.fnc_deteccion_cambios_significativos(numeric)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.fnc_deteccion_cambios_significativos(numeric) SET search_path = public';
  END IF;

  IF to_regprocedure('public.fnc_limpiar_datos_antiguos()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.fnc_limpiar_datos_antiguos() SET search_path = public';
  END IF;

  IF to_regprocedure('public.refresh_tareas_metricas()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.refresh_tareas_metricas() SET search_path = public';
  END IF;
END $$;

-- 2) Ensure unique stock row per (producto_id, ubicacion)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stock_deposito'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM stock_deposito
      GROUP BY producto_id, ubicacion
      HAVING COUNT(*) > 1
    ) THEN
      RAISE EXCEPTION 'Duplicados en stock_deposito (producto_id, ubicacion). Resolver antes de crear indice unico.';
    END IF;

    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_deposito_producto_ubicacion ON public.stock_deposito (producto_id, ubicacion)';
  END IF;
END $$;

-- 3) sp_movimiento_inventario: validaciones + concurrencia segura
DROP FUNCTION IF EXISTS sp_movimiento_inventario(
  uuid,
  text,
  integer,
  text,
  text,
  uuid,
  uuid
);

DROP FUNCTION IF EXISTS sp_movimiento_inventario(
  uuid,
  text,
  integer,
  text,
  text,
  uuid,
  uuid,
  uuid,
  text
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
  v_tipo text := lower(p_tipo);
  v_stock_actual integer := 0;
  v_stock_nuevo integer := 0;
  v_stock_id uuid;
BEGIN
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'Cantidad invalida: debe ser mayor a 0';
  END IF;

  IF v_tipo IS NULL OR v_tipo NOT IN ('entrada', 'salida', 'ajuste', 'transferencia') THEN
    RAISE EXCEPTION 'Tipo de movimiento invalido: %. Valores permitidos: entrada, salida, ajuste, transferencia', COALESCE(p_tipo, 'NULL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM productos WHERE id = p_producto_id) THEN
    RAISE EXCEPTION 'Producto no encontrado: %', p_producto_id;
  END IF;

  SELECT id, COALESCE(cantidad_actual, 0)
    INTO v_stock_id, v_stock_actual
  FROM stock_deposito
  WHERE producto_id = p_producto_id AND ubicacion = v_ubicacion
  FOR UPDATE;

  IF NOT FOUND THEN
    v_stock_actual := 0;
  END IF;

  IF v_tipo = 'salida' THEN
    IF v_stock_actual < p_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente: disponible=%, solicitado=%', v_stock_actual, p_cantidad;
    END IF;
    v_stock_nuevo := v_stock_actual - p_cantidad;
  ELSE
    v_stock_nuevo := v_stock_actual + p_cantidad;
  END IF;

  IF v_stock_id IS NULL THEN
    INSERT INTO stock_deposito (producto_id, cantidad_actual, stock_minimo, stock_maximo, ubicacion, created_at)
    VALUES (p_producto_id, v_stock_nuevo, 0, 0, v_ubicacion, now())
    ON CONFLICT (producto_id, ubicacion) DO UPDATE
      SET cantidad_actual = stock_deposito.cantidad_actual + EXCLUDED.cantidad_actual
    RETURNING cantidad_actual INTO v_stock_nuevo;

    v_stock_actual := v_stock_nuevo - p_cantidad;
  ELSE
    UPDATE stock_deposito
      SET cantidad_actual = v_stock_nuevo
    WHERE id = v_stock_id;
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
    v_tipo,
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
    'tipo', v_tipo,
    'cantidad', p_cantidad,
    'stock_anterior', v_stock_actual,
    'stock_nuevo', v_stock_nuevo,
    'ubicacion', v_ubicacion
  );
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 4) sp_aplicar_precio: validar margen y reforzar search_path
CREATE OR REPLACE FUNCTION public.sp_aplicar_precio(
  p_producto_id uuid,
  p_precio_compra numeric,
  p_margen_ganancia numeric DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_producto RECORD;
  v_margen_minimo numeric;
  v_margen_base numeric;
  v_margen_proyectado numeric;
  v_precio_venta numeric;
BEGIN
  IF p_precio_compra IS NULL OR p_precio_compra <= 0 THEN
    RAISE EXCEPTION 'precio_compra debe ser mayor que 0';
  END IF;

  IF p_margen_ganancia IS NOT NULL AND (p_margen_ganancia < 0 OR p_margen_ganancia > 500) THEN
    RAISE EXCEPTION 'margen_ganancia debe estar entre 0 y 500, recibido: %', p_margen_ganancia;
  END IF;

  SELECT id, categoria_id, precio_actual, margen_ganancia
    INTO v_producto
  FROM productos
  WHERE id = p_producto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado';
  END IF;

  SELECT margen_minimo
    INTO v_margen_minimo
  FROM categorias
  WHERE id = v_producto.categoria_id;

  v_margen_base := COALESCE(p_margen_ganancia, v_producto.margen_ganancia);

  IF v_margen_base IS NOT NULL THEN
    v_precio_venta := fnc_redondear_precio(p_precio_compra * (1 + (v_margen_base / 100)));
    v_margen_proyectado := v_margen_base;
  ELSIF v_producto.precio_actual IS NOT NULL AND v_producto.precio_actual > 0 THEN
    v_margen_proyectado := ((v_producto.precio_actual - p_precio_compra) / v_producto.precio_actual) * 100;
  END IF;

  IF v_margen_minimo IS NOT NULL AND v_margen_proyectado IS NOT NULL AND v_margen_proyectado < v_margen_minimo THEN
    RAISE EXCEPTION 'Margen proyectado % por debajo del minimo de categoria %', v_margen_proyectado, v_margen_minimo;
  END IF;

  UPDATE productos
    SET precio_costo = p_precio_compra,
        margen_ganancia = COALESCE(p_margen_ganancia, margen_ganancia),
        precio_actual = COALESCE(v_precio_venta, precio_actual),
        updated_at = NOW()
  WHERE id = p_producto_id;

  INSERT INTO precios_historicos (producto_id, precio_anterior, precio_nuevo, fecha_cambio, motivo_cambio)
  VALUES (
    p_producto_id,
    v_producto.precio_actual,
    COALESCE(v_precio_venta, v_producto.precio_actual),
    NOW(),
    'sp_aplicar_precio'
  );

  RETURN jsonb_build_object(
    'producto_id', p_producto_id,
    'precio_compra', p_precio_compra,
    'precio_venta', COALESCE(v_precio_venta, v_producto.precio_actual),
    'margen_ganancia', COALESCE(p_margen_ganancia, v_producto.margen_ganancia),
    'margen_proyectado', v_margen_proyectado,
    'margen_minimo', v_margen_minimo
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
    RAISE EXCEPTION 'Margen proyectado % por debajo del mínimo de categoría %', v_margen_proyectado, v_margen_minimo;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

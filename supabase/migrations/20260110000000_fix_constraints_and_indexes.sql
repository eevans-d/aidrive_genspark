-- Adds safe FK constraints and missing indexes for core tables.
-- Constraints are created NOT VALID to avoid breaking existing data; validate later.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stock_reservado'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'productos'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_stock_reservado_producto'
    ) THEN
      ALTER TABLE public.stock_reservado
        ADD CONSTRAINT fk_stock_reservado_producto
        FOREIGN KEY (producto_id) REFERENCES public.productos(id)
        ON DELETE RESTRICT NOT VALID;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ordenes_compra'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'productos'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_ordenes_compra_producto'
    ) THEN
      ALTER TABLE public.ordenes_compra
        ADD CONSTRAINT fk_ordenes_compra_producto
        FOREIGN KEY (producto_id) REFERENCES public.productos(id)
        ON DELETE RESTRICT NOT VALID;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ordenes_compra'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'proveedores'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_ordenes_compra_proveedor'
    ) THEN
      ALTER TABLE public.ordenes_compra
        ADD CONSTRAINT fk_ordenes_compra_proveedor
        FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id)
        ON DELETE SET NULL NOT VALID;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'comparacion_precios'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'productos'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_comparacion_precios_producto'
    ) THEN
      ALTER TABLE public.comparacion_precios
        ADD CONSTRAINT fk_comparacion_precios_producto
        FOREIGN KEY (producto_id) REFERENCES public.productos(id)
        ON DELETE SET NULL NOT VALID;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ordenes_compra'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor_id ON public.ordenes_compra (proveedor_id)';
  END IF;
END $$;

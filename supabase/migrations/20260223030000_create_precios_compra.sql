-- Mega Plan O1 — Tarea 0.3: Modelo de costo interno (complementa D-007)
-- Historial de precios de compra internos, vinculable a factura.
-- Depende de: 20260223010000_create_facturas_ingesta.sql (FK a facturas_ingesta_items).

BEGIN;

-- ============================================================
-- 1. Tabla precios_compra
-- ============================================================
CREATE TABLE IF NOT EXISTS public.precios_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  proveedor_id uuid,
  precio_unitario numeric(12, 2) NOT NULL,
  factura_ingesta_item_id uuid,
  origen text NOT NULL DEFAULT 'manual'
    CHECK (origen IN ('manual','factura','recepcion')),
  created_at timestamptz DEFAULT now(),
  created_by uuid,

  CONSTRAINT pc_producto_fkey
    FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE,

  CONSTRAINT pc_proveedor_fkey
    FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE SET NULL,

  CONSTRAINT pc_factura_item_fkey
    FOREIGN KEY (factura_ingesta_item_id) REFERENCES public.facturas_ingesta_items(id) ON DELETE SET NULL
);

-- Último costo por producto (ORDER BY created_at DESC LIMIT 1)
CREATE INDEX IF NOT EXISTS idx_pc_producto_fecha
  ON public.precios_compra (producto_id, created_at DESC);

-- Costo por proveedor+producto
CREATE INDEX IF NOT EXISTS idx_pc_proveedor_producto
  ON public.precios_compra (proveedor_id, producto_id);

-- Vinculación con factura
CREATE INDEX IF NOT EXISTS idx_pc_factura_item
  ON public.precios_compra (factura_ingesta_item_id)
  WHERE factura_ingesta_item_id IS NOT NULL;

-- ============================================================
-- 2. RLS
-- ============================================================
ALTER TABLE public.precios_compra ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.precios_compra FROM anon;

CREATE POLICY pc_select_staff
  ON public.precios_compra FOR SELECT TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

CREATE POLICY pc_insert_staff
  ON public.precios_compra FOR INSERT TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

CREATE POLICY pc_update_admin
  ON public.precios_compra FOR UPDATE TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador']));

CREATE POLICY pc_delete_admin
  ON public.precios_compra FOR DELETE TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador']));

-- ============================================================
-- 3. Trigger: actualizar productos.precio_costo con último valor
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_update_precio_costo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.productos
  SET precio_costo = NEW.precio_unitario,
      updated_at = now()
  WHERE id = NEW.producto_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_precio_costo ON public.precios_compra;
CREATE TRIGGER trg_update_precio_costo
  AFTER INSERT ON public.precios_compra
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_precio_costo();

COMMIT;

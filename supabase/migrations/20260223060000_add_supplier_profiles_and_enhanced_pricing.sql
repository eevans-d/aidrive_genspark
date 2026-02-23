-- =============================================================================
-- Migration: Supplier Profiles + Enhanced Pricing Columns
-- Description:
--   1. Creates supplier_profiles table for per-vendor OCR/pricing configuration
--   2. Adds enhanced pricing columns to facturas_ingesta_items:
--      - unidades_por_bulto: pack size extracted from product name (NxM parsing)
--      - precio_unitario_costo: calculated unit cost including IVA
--      - validacion_subtotal: cross-validation result (qty*price vs subtotal)
--      - notas_calculo: human-readable calculation notes
-- =============================================================================

-- 1. Supplier Profiles table
CREATE TABLE IF NOT EXISTS public.supplier_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id uuid NOT NULL,
  precio_es_bulto boolean NOT NULL DEFAULT true,
  iva_incluido boolean NOT NULL DEFAULT false,
  iva_tasa numeric(5,2) NOT NULL DEFAULT 21.00,
  pack_size_regex text DEFAULT '(\d+)\s*[xX]\s*\d+',
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT sp_proveedor_fkey
    FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE CASCADE,

  CONSTRAINT sp_proveedor_unique
    UNIQUE (proveedor_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_profiles_proveedor
  ON public.supplier_profiles(proveedor_id);

-- RLS
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplier_profiles_select" ON public.supplier_profiles
  FOR SELECT USING (true);

CREATE POLICY "supplier_profiles_insert" ON public.supplier_profiles
  FOR INSERT WITH CHECK (
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'deposito')
  );

CREATE POLICY "supplier_profiles_update" ON public.supplier_profiles
  FOR UPDATE USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'deposito')
  );

-- 2. Enhanced pricing columns on facturas_ingesta_items
ALTER TABLE public.facturas_ingesta_items
  ADD COLUMN IF NOT EXISTS unidades_por_bulto integer,
  ADD COLUMN IF NOT EXISTS precio_unitario_costo numeric(12, 4),
  ADD COLUMN IF NOT EXISTS validacion_subtotal text
    CHECK (validacion_subtotal IS NULL OR validacion_subtotal IN ('ok', 'warning', 'error')),
  ADD COLUMN IF NOT EXISTS notas_calculo text;

-- Index for items needing review (warning/error validations)
CREATE INDEX IF NOT EXISTS idx_fi_items_validacion
  ON public.facturas_ingesta_items(validacion_subtotal)
  WHERE validacion_subtotal IS NOT NULL AND validacion_subtotal != 'ok';

COMMENT ON TABLE public.supplier_profiles IS 'Per-vendor OCR and pricing configuration for invoice processing';
COMMENT ON COLUMN public.supplier_profiles.precio_es_bulto IS 'true = invoice prices are per bulk/case, not per unit';
COMMENT ON COLUMN public.supplier_profiles.iva_incluido IS 'true = invoice prices already include IVA';
COMMENT ON COLUMN public.supplier_profiles.iva_tasa IS 'IVA tax rate as percentage (e.g., 21.00 for 21%)';
COMMENT ON COLUMN public.supplier_profiles.pack_size_regex IS 'Regex pattern to extract pack size from product descriptions';

COMMENT ON COLUMN public.facturas_ingesta_items.unidades_por_bulto IS 'Units per bulk package extracted from product description (NxM parsing)';
COMMENT ON COLUMN public.facturas_ingesta_items.precio_unitario_costo IS 'Calculated unit cost: (precio_unitario / unidades_por_bulto) * (1 + IVA)';
COMMENT ON COLUMN public.facturas_ingesta_items.validacion_subtotal IS 'Cross-validation result: ok (<0.5% deviation), warning (0.5-2%), error (>2%)';
COMMENT ON COLUMN public.facturas_ingesta_items.notas_calculo IS 'Human-readable calculation notes for transparency';

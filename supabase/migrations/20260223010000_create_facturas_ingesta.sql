-- Mega Plan O1 — Tarea 0.1: Modelo SQL de facturas de ingreso
-- Crea facturas_ingesta (cabecera), facturas_ingesta_items (líneas),
-- facturas_ingesta_eventos (auditoría).
-- Prerequisito: tablas productos, proveedores (20260109070000).

BEGIN;

-- ============================================================
-- 1. facturas_ingesta (cabecera)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.facturas_ingesta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id uuid NOT NULL,
  tipo_comprobante text NOT NULL DEFAULT 'factura',
  numero text,
  fecha_factura date,
  total numeric(12, 2),
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','extraida','validada','aplicada','error','rechazada')),
  imagen_url text,
  datos_extraidos jsonb,
  score_confianza numeric(5, 2),
  request_id text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT facturas_ingesta_proveedor_fkey
    FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE RESTRICT,

  -- Idempotencia: misma factura no se ingresa dos veces.
  -- NULLS NOT DISTINCT evita duplicados cuando numero/fecha son NULL.
  CONSTRAINT facturas_ingesta_unique_factura
    UNIQUE NULLS NOT DISTINCT (proveedor_id, tipo_comprobante, numero, fecha_factura)
);

CREATE INDEX IF NOT EXISTS idx_facturas_ingesta_proveedor
  ON public.facturas_ingesta (proveedor_id);
CREATE INDEX IF NOT EXISTS idx_facturas_ingesta_estado
  ON public.facturas_ingesta (estado);
CREATE INDEX IF NOT EXISTS idx_facturas_ingesta_fecha
  ON public.facturas_ingesta (fecha_factura DESC);
CREATE INDEX IF NOT EXISTS idx_facturas_ingesta_created
  ON public.facturas_ingesta (created_at DESC);

-- ============================================================
-- 2. facturas_ingesta_items (líneas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.facturas_ingesta_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid NOT NULL,
  descripcion_original text NOT NULL,
  producto_id uuid,
  alias_usado text,
  cantidad numeric(12, 3) NOT NULL DEFAULT 1,
  unidad text DEFAULT 'u',
  precio_unitario numeric(12, 2),
  subtotal numeric(12, 2),
  estado_match text NOT NULL DEFAULT 'fuzzy_pendiente'
    CHECK (estado_match IN ('auto_match','alias_match','fuzzy_pendiente','confirmada','rechazada')),
  confianza_match numeric(5, 2),
  created_at timestamptz DEFAULT now(),

  CONSTRAINT fi_items_factura_fkey
    FOREIGN KEY (factura_id) REFERENCES public.facturas_ingesta(id) ON DELETE CASCADE,

  CONSTRAINT fi_items_producto_fkey
    FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fi_items_factura
  ON public.facturas_ingesta_items (factura_id);
CREATE INDEX IF NOT EXISTS idx_fi_items_producto
  ON public.facturas_ingesta_items (producto_id);
CREATE INDEX IF NOT EXISTS idx_fi_items_estado
  ON public.facturas_ingesta_items (estado_match);

-- ============================================================
-- 3. facturas_ingesta_eventos (auditoría)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.facturas_ingesta_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid NOT NULL,
  evento text NOT NULL,
  datos jsonb,
  usuario_id uuid,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT fi_eventos_factura_fkey
    FOREIGN KEY (factura_id) REFERENCES public.facturas_ingesta(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fi_eventos_factura
  ON public.facturas_ingesta_eventos (factura_id);
CREATE INDEX IF NOT EXISTS idx_fi_eventos_created
  ON public.facturas_ingesta_eventos (created_at DESC);

-- ============================================================
-- 4. RLS — patrón idéntico al proyecto (has_personal_role)
-- ============================================================
ALTER TABLE public.facturas_ingesta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas_ingesta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas_ingesta_eventos ENABLE ROW LEVEL SECURITY;

-- Revocar anon (política del proyecto)
REVOKE ALL ON TABLE public.facturas_ingesta FROM anon;
REVOKE ALL ON TABLE public.facturas_ingesta_items FROM anon;
REVOKE ALL ON TABLE public.facturas_ingesta_eventos FROM anon;

-- facturas_ingesta policies
CREATE POLICY fi_select_staff
  ON public.facturas_ingesta FOR SELECT TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

CREATE POLICY fi_insert_staff
  ON public.facturas_ingesta FOR INSERT TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

CREATE POLICY fi_update_staff
  ON public.facturas_ingesta FOR UPDATE TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

CREATE POLICY fi_delete_admin
  ON public.facturas_ingesta FOR DELETE TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador']));

-- facturas_ingesta_items policies
CREATE POLICY fi_items_select_staff
  ON public.facturas_ingesta_items FOR SELECT TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

CREATE POLICY fi_items_insert_staff
  ON public.facturas_ingesta_items FOR INSERT TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

CREATE POLICY fi_items_update_staff
  ON public.facturas_ingesta_items FOR UPDATE TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

CREATE POLICY fi_items_delete_admin
  ON public.facturas_ingesta_items FOR DELETE TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador']));

-- facturas_ingesta_eventos policies
CREATE POLICY fi_eventos_select_staff
  ON public.facturas_ingesta_eventos FOR SELECT TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

CREATE POLICY fi_eventos_insert_staff
  ON public.facturas_ingesta_eventos FOR INSERT TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

COMMIT;

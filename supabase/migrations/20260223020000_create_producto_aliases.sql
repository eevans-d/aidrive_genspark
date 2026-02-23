-- Mega Plan O1 — Tarea 0.2: Modelo alias de producto
-- Permite matching multinivel de nombres de factura -> producto canónico.
-- Prerequisito: tablas productos, proveedores (20260109070000).

BEGIN;

-- ============================================================
-- 1. Tabla producto_aliases
-- ============================================================
CREATE TABLE IF NOT EXISTS public.producto_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_texto text NOT NULL,
  alias_normalizado text NOT NULL GENERATED ALWAYS AS (
    lower(
      translate(
        trim(alias_texto),
        'áéíóúàèìòùäëïöüâêîôûÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛñÑ',
        'aeiouaeiouaeiouaeiouAEIOUAEIOUAEIOUAEIOUnN'
      )
    )
  ) STORED,
  producto_id uuid NOT NULL,
  proveedor_id uuid,
  confianza text NOT NULL DEFAULT 'media'
    CHECK (confianza IN ('alta','media','baja')),
  origen text
    CHECK (origen IS NULL OR origen IN ('manual','ocr','cuaderno')),
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid,

  CONSTRAINT pa_producto_fkey
    FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE,

  CONSTRAINT pa_proveedor_fkey
    FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE SET NULL
);

-- Evitar duplicados por proveedor (NULLS NOT DISTINCT para aliases globales)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pa_alias_proveedor_unique
  ON public.producto_aliases (alias_normalizado, proveedor_id)
  NULLS NOT DISTINCT;

-- Búsqueda inversa: producto -> aliases
CREATE INDEX IF NOT EXISTS idx_pa_producto
  ON public.producto_aliases (producto_id);

-- Búsqueda por texto normalizado
CREATE INDEX IF NOT EXISTS idx_pa_alias_normalizado
  ON public.producto_aliases (alias_normalizado);

-- Solo aliases activos
CREATE INDEX IF NOT EXISTS idx_pa_activo
  ON public.producto_aliases (activo) WHERE activo = true;

-- ============================================================
-- 2. RLS
-- ============================================================
ALTER TABLE public.producto_aliases ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.producto_aliases FROM anon;

-- Lectura: todos los autenticados (necesario para matching en frontend)
CREATE POLICY pa_select_all
  ON public.producto_aliases FOR SELECT TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor','usuario']));

-- Escritura: admin + deposito
CREATE POLICY pa_insert_staff
  ON public.producto_aliases FOR INSERT TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

CREATE POLICY pa_update_staff
  ON public.producto_aliases FOR UPDATE TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

-- Borrado: solo admin
CREATE POLICY pa_delete_admin
  ON public.producto_aliases FOR DELETE TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador']));

COMMIT;

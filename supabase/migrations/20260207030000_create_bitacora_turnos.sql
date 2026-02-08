-- ============================================================================
-- FASE 5: Bitácora Digital (Notas de Turno)
-- Fecha: 2026-02-07
-- ============================================================================
-- Objetivos:
-- - Tabla bitacora_turnos con RLS:
--   - INSERT: roles base (staff) con usuario_id=auth.uid()
--   - SELECT: solo admin
-- - Escrituras vía gateway (api-minimarket)
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.bitacora_turnos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL DEFAULT auth.uid(),
  usuario_nombre text NULL,
  usuario_email text NULL,
  usuario_rol text NULL,
  nota text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.bitacora_turnos IS
  'Bitácora digital de turno. Notas asíncronas para el dueño (admin).';

CREATE INDEX IF NOT EXISTS idx_bitacora_turnos_created_at
  ON public.bitacora_turnos (created_at DESC);

ALTER TABLE public.bitacora_turnos ENABLE ROW LEVEL SECURITY;

-- INSERT: roles base (staff) + usuario_id debe coincidir con auth.uid()
DROP POLICY IF EXISTS bitacora_turnos_insert_base ON public.bitacora_turnos;
CREATE POLICY bitacora_turnos_insert_base
  ON public.bitacora_turnos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor','deposito','depósito'])
    AND usuario_id = auth.uid()
  );

-- SELECT: solo admin (dueño)
DROP POLICY IF EXISTS bitacora_turnos_select_admin ON public.bitacora_turnos;
CREATE POLICY bitacora_turnos_select_admin
  ON public.bitacora_turnos
  FOR SELECT
  TO authenticated
  USING (
    public.has_personal_role(ARRAY['admin','administrador'])
  );

REVOKE ALL ON public.bitacora_turnos FROM anon;
REVOKE ALL ON public.bitacora_turnos FROM authenticated;
GRANT SELECT, INSERT ON public.bitacora_turnos TO authenticated;

COMMIT;


-- Mega Plan O1 — Tarea 0.4: Supabase Storage bucket para facturas
-- Crea bucket 'facturas' con restricciones de tipo y tamaño.
-- Nota: Las policies de storage se gestionan vía storage API (no SQL directo).
-- Este archivo crea el bucket si no existe.

BEGIN;

-- Crear bucket de storage para imágenes de facturas (10MB max, restringido)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'facturas',
  'facturas',
  false,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS policies
-- Solo usuarios autenticados con rol admin/deposito pueden operar
-- ============================================================

-- Upload (INSERT)
DROP POLICY IF EXISTS facturas_upload_staff ON storage.objects;
CREATE POLICY facturas_upload_staff
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'facturas'
    AND public.has_personal_role(ARRAY['admin','administrador','deposito','depósito'])
  );

-- Download (SELECT)
DROP POLICY IF EXISTS facturas_download_staff ON storage.objects;
CREATE POLICY facturas_download_staff
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'facturas'
    AND public.has_personal_role(ARRAY['admin','administrador','deposito','depósito'])
  );

-- Update (para reemplazar imagen)
DROP POLICY IF EXISTS facturas_update_staff ON storage.objects;
CREATE POLICY facturas_update_staff
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'facturas'
    AND public.has_personal_role(ARRAY['admin','administrador','deposito','depósito'])
  );

-- Delete (solo admin)
DROP POLICY IF EXISTS facturas_delete_admin ON storage.objects;
CREATE POLICY facturas_delete_admin
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'facturas'
    AND public.has_personal_role(ARRAY['admin','administrador'])
  );

COMMIT;

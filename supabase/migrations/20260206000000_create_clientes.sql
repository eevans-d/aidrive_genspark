-- ============================================================================
-- Migración: Tabla de Clientes
-- Descripción: Almacena datos de clientes recurrentes del Mini Market
-- Fecha: 2026-02-06
-- ============================================================================

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Datos básicos
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  
  -- Dirección por defecto
  direccion_default TEXT,
  edificio TEXT,
  piso TEXT,
  departamento TEXT,
  
  -- Notas
  observaciones TEXT,
  
  -- Estado
  activo BOOLEAN DEFAULT TRUE,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentarios
COMMENT ON TABLE public.clientes IS 'Clientes recurrentes del Mini Market';
COMMENT ON COLUMN public.clientes.direccion_default IS 'Dirección por defecto para entregas';
COMMENT ON COLUMN public.clientes.observaciones IS 'Notas internas sobre el cliente';

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_nombre 
  ON public.clientes(nombre);

CREATE INDEX IF NOT EXISTS idx_clientes_telefono 
  ON public.clientes(telefono) 
  WHERE telefono IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_activo 
  ON public.clientes(activo) 
  WHERE activo = TRUE;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_clientes_updated_at ON public.clientes;
CREATE TRIGGER set_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (basadas en el patrón del proyecto)
-- Solo usuarios autenticados pueden ver clientes
CREATE POLICY "clientes_select_authenticated" ON public.clientes
  FOR SELECT
  TO authenticated
  USING (true);

-- Solo admin y deposito pueden insertar
CREATE POLICY "clientes_insert_admin_deposito" ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.personal p
      WHERE p.user_auth_id = auth.uid()
      AND p.rol IN ('admin', 'deposito', 'jefe')
      AND p.activo = TRUE
    )
  );

-- Solo admin y deposito pueden actualizar
CREATE POLICY "clientes_update_admin_deposito" ON public.clientes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.personal p
      WHERE p.user_auth_id = auth.uid()
      AND p.rol IN ('admin', 'deposito', 'jefe')
      AND p.activo = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.personal p
      WHERE p.user_auth_id = auth.uid()
      AND p.rol IN ('admin', 'deposito', 'jefe')
      AND p.activo = TRUE
    )
  );

-- Solo admin puede eliminar (soft delete preferido)
CREATE POLICY "clientes_delete_admin" ON public.clientes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.personal p
      WHERE p.user_auth_id = auth.uid()
      AND p.rol = 'admin'
      AND p.activo = TRUE
    )
  );

-- Revocar acceso anon
REVOKE ALL ON public.clientes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;

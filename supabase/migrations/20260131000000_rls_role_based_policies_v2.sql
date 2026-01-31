-- RLS role-based policies v2 (P0 tables + tareas + ordenes + notificaciones)
-- Generated 2026-01-31 after audit (MCP Supabase).
-- Goals: revoke anon, enforce minimal grants, and apply role-based policies.

BEGIN;

CREATE OR REPLACE FUNCTION public.has_personal_role(roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.personal p
    WHERE p.user_auth_id = auth.uid()
      AND p.activo IS TRUE
      AND lower(p.rol) = ANY (roles)
  );
$$;

-- Revoke anon and authenticated (reset to minimal later)
REVOKE ALL ON TABLE public.categorias FROM anon;
REVOKE ALL ON TABLE public.productos FROM anon;
REVOKE ALL ON TABLE public.proveedores FROM anon;
REVOKE ALL ON TABLE public.productos_faltantes FROM anon;
REVOKE ALL ON TABLE public.movimientos_deposito FROM anon;
REVOKE ALL ON TABLE public.stock_deposito FROM anon;
REVOKE ALL ON TABLE public.precios_historicos FROM anon;
REVOKE ALL ON TABLE public.tareas_pendientes FROM anon;
REVOKE ALL ON TABLE public.ordenes_compra FROM anon;
REVOKE ALL ON TABLE public.notificaciones_tareas FROM anon;

REVOKE ALL ON TABLE public.categorias FROM authenticated;
REVOKE ALL ON TABLE public.productos FROM authenticated;
REVOKE ALL ON TABLE public.proveedores FROM authenticated;
REVOKE ALL ON TABLE public.productos_faltantes FROM authenticated;
REVOKE ALL ON TABLE public.movimientos_deposito FROM authenticated;
REVOKE ALL ON TABLE public.stock_deposito FROM authenticated;
REVOKE ALL ON TABLE public.precios_historicos FROM authenticated;
REVOKE ALL ON TABLE public.tareas_pendientes FROM authenticated;
REVOKE ALL ON TABLE public.ordenes_compra FROM authenticated;
REVOKE ALL ON TABLE public.notificaciones_tareas FROM authenticated;

-- Ensure RLS enabled
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_faltantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_deposito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_deposito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios_historicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas_pendientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_tareas ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies (if any)
DROP POLICY IF EXISTS movimientos_deposito_select_authenticated ON public.movimientos_deposito;
DROP POLICY IF EXISTS movimientos_deposito_insert_authenticated ON public.movimientos_deposito;
DROP POLICY IF EXISTS ordenes_compra_select_authenticated ON public.ordenes_compra;
DROP POLICY IF EXISTS precios_historicos_select_authenticated ON public.precios_historicos;
DROP POLICY IF EXISTS stock_deposito_select_authenticated ON public.stock_deposito;
DROP POLICY IF EXISTS tareas_pendientes_select_authenticated ON public.tareas_pendientes;
DROP POLICY IF EXISTS tareas_pendientes_insert_authenticated ON public.tareas_pendientes;
DROP POLICY IF EXISTS tareas_pendientes_update_authenticated ON public.tareas_pendientes;
DROP POLICY IF EXISTS tareas_pendientes_delete_authenticated ON public.tareas_pendientes;

-- CATEGORIAS
DROP POLICY IF EXISTS categorias_select_base ON public.categorias;
CREATE POLICY categorias_select_base
  ON public.categorias
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor','usuario']));

DROP POLICY IF EXISTS categorias_insert_admin_deposito ON public.categorias;
CREATE POLICY categorias_insert_admin_deposito
  ON public.categorias
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

DROP POLICY IF EXISTS categorias_update_admin_deposito ON public.categorias;
CREATE POLICY categorias_update_admin_deposito
  ON public.categorias
  FOR UPDATE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']))
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

DROP POLICY IF EXISTS categorias_delete_admin_deposito ON public.categorias;
CREATE POLICY categorias_delete_admin_deposito
  ON public.categorias
  FOR DELETE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

-- PRODUCTOS
DROP POLICY IF EXISTS productos_select_base ON public.productos;
CREATE POLICY productos_select_base
  ON public.productos
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor','usuario']));

DROP POLICY IF EXISTS productos_insert_staff ON public.productos;
CREATE POLICY productos_insert_staff
  ON public.productos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor']));

DROP POLICY IF EXISTS productos_update_staff ON public.productos;
CREATE POLICY productos_update_staff
  ON public.productos
  FOR UPDATE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor']))
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor']));

DROP POLICY IF EXISTS productos_delete_staff ON public.productos;
CREATE POLICY productos_delete_staff
  ON public.productos
  FOR DELETE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor']));

-- PROVEEDORES
DROP POLICY IF EXISTS proveedores_select_base ON public.proveedores;
CREATE POLICY proveedores_select_base
  ON public.proveedores
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor','usuario']));

DROP POLICY IF EXISTS proveedores_insert_admin_deposito ON public.proveedores;
CREATE POLICY proveedores_insert_admin_deposito
  ON public.proveedores
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

DROP POLICY IF EXISTS proveedores_update_admin_deposito ON public.proveedores;
CREATE POLICY proveedores_update_admin_deposito
  ON public.proveedores
  FOR UPDATE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']))
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

DROP POLICY IF EXISTS proveedores_delete_admin_deposito ON public.proveedores;
CREATE POLICY proveedores_delete_admin_deposito
  ON public.proveedores
  FOR DELETE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

-- PRODUCTOS_FALTANTES
DROP POLICY IF EXISTS productos_faltantes_select_base ON public.productos_faltantes;
CREATE POLICY productos_faltantes_select_base
  ON public.productos_faltantes
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor','usuario']));

DROP POLICY IF EXISTS productos_faltantes_insert_base ON public.productos_faltantes;
CREATE POLICY productos_faltantes_insert_base
  ON public.productos_faltantes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor','usuario']));

DROP POLICY IF EXISTS productos_faltantes_update_staff ON public.productos_faltantes;
CREATE POLICY productos_faltantes_update_staff
  ON public.productos_faltantes
  FOR UPDATE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor']))
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor']));

DROP POLICY IF EXISTS productos_faltantes_delete_staff ON public.productos_faltantes;
CREATE POLICY productos_faltantes_delete_staff
  ON public.productos_faltantes
  FOR DELETE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor']));

-- MOVIMIENTOS_DEPOSITO
DROP POLICY IF EXISTS movimientos_deposito_select_base ON public.movimientos_deposito;
CREATE POLICY movimientos_deposito_select_base
  ON public.movimientos_deposito
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor','usuario']));

DROP POLICY IF EXISTS movimientos_deposito_insert_stock ON public.movimientos_deposito;
CREATE POLICY movimientos_deposito_insert_stock
  ON public.movimientos_deposito
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito']));

-- STOCK_DEPOSITO
DROP POLICY IF EXISTS stock_deposito_select_base ON public.stock_deposito;
CREATE POLICY stock_deposito_select_base
  ON public.stock_deposito
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor','usuario']));

-- PRECIOS_HISTORICOS
DROP POLICY IF EXISTS precios_historicos_select_base ON public.precios_historicos;
CREATE POLICY precios_historicos_select_base
  ON public.precios_historicos
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor','usuario']));

-- TAREAS_PENDIENTES
DROP POLICY IF EXISTS tareas_pendientes_select_base ON public.tareas_pendientes;
CREATE POLICY tareas_pendientes_select_base
  ON public.tareas_pendientes
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor','usuario']));

DROP POLICY IF EXISTS tareas_pendientes_insert_staff ON public.tareas_pendientes;
CREATE POLICY tareas_pendientes_insert_staff
  ON public.tareas_pendientes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor']));

DROP POLICY IF EXISTS tareas_pendientes_update_staff ON public.tareas_pendientes;
CREATE POLICY tareas_pendientes_update_staff
  ON public.tareas_pendientes
  FOR UPDATE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor']))
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor']));

DROP POLICY IF EXISTS tareas_pendientes_delete_staff ON public.tareas_pendientes;
CREATE POLICY tareas_pendientes_delete_staff
  ON public.tareas_pendientes
  FOR DELETE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor']));

-- ORDENES_COMPRA
DROP POLICY IF EXISTS ordenes_compra_select_base ON public.ordenes_compra;
CREATE POLICY ordenes_compra_select_base
  ON public.ordenes_compra
  FOR SELECT
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','deposito','depósito','ventas','vendedor','usuario']));

DROP POLICY IF EXISTS ordenes_compra_insert_ventas ON public.ordenes_compra;
CREATE POLICY ordenes_compra_insert_ventas
  ON public.ordenes_compra
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor']));

DROP POLICY IF EXISTS ordenes_compra_update_ventas ON public.ordenes_compra;
CREATE POLICY ordenes_compra_update_ventas
  ON public.ordenes_compra
  FOR UPDATE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor']))
  WITH CHECK (public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor']));

DROP POLICY IF EXISTS ordenes_compra_delete_ventas ON public.ordenes_compra;
CREATE POLICY ordenes_compra_delete_ventas
  ON public.ordenes_compra
  FOR DELETE
  TO authenticated
  USING (public.has_personal_role(ARRAY['admin','administrador','ventas','vendedor']));

-- NOTIFICACIONES_TAREAS
DROP POLICY IF EXISTS notificaciones_tareas_select_own ON public.notificaciones_tareas;
CREATE POLICY notificaciones_tareas_select_own
  ON public.notificaciones_tareas
  FOR SELECT
  TO authenticated
  USING (usuario_destino_id = auth.uid());

DROP POLICY IF EXISTS notificaciones_tareas_update_own ON public.notificaciones_tareas;
CREATE POLICY notificaciones_tareas_update_own
  ON public.notificaciones_tareas
  FOR UPDATE
  TO authenticated
  USING (usuario_destino_id = auth.uid())
  WITH CHECK (usuario_destino_id = auth.uid());

-- Grants for authenticated (minimal required)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categorias TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.productos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.proveedores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.productos_faltantes TO authenticated;
GRANT SELECT, INSERT ON TABLE public.movimientos_deposito TO authenticated;
GRANT SELECT ON TABLE public.stock_deposito TO authenticated;
GRANT SELECT ON TABLE public.precios_historicos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tareas_pendientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ordenes_compra TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.notificaciones_tareas TO authenticated;

COMMIT;

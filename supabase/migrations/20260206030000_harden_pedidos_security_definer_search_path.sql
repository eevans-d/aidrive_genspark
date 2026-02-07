-- ============================================================================
-- Migración: Harden SECURITY DEFINER functions (Pedidos)
-- Descripción: Evita warning de Security Advisor por search_path mutable
-- Fecha: 2026-02-06
-- ============================================================================

BEGIN;

-- Trigger function usada por detalle_pedidos -> pedidos (monto_total)
ALTER FUNCTION public.fn_actualizar_monto_pedido()
  SET search_path = public;

-- Stored procedure principal de creación de pedidos
ALTER FUNCTION public.sp_crear_pedido(
  text,  -- p_cliente_nombre
  text,  -- p_tipo_entrega
  text,  -- p_direccion_entrega
  text,  -- p_edificio
  text,  -- p_piso
  text,  -- p_departamento
  text,  -- p_horario_preferido
  text,  -- p_observaciones
  text,  -- p_cliente_telefono
  uuid,  -- p_cliente_id
  jsonb  -- p_items
)
  SET search_path = public;

COMMIT;


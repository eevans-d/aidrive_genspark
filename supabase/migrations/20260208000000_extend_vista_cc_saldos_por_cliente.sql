-- ============================================================================
-- Hotfix: Extender vista_cc_saldos_por_cliente con direccion_default
-- Fecha: 2026-02-08
-- ============================================================================
-- Contexto:
-- - El gateway `/clientes` consulta `vista_cc_saldos_por_cliente` incluyendo
--   `direccion_default`.
-- - La vista creada en Fase 2 no incluía ese campo, causando:
--   `UNDEFINED_COLUMN vista_cc_saldos_por_cliente.direccion_default`.
--
-- Objetivo:
-- - Mantener compatibilidad con el handler y el modelo de clientes, agregando
--   `direccion_default` a la vista.
-- ============================================================================

BEGIN;

CREATE OR REPLACE VIEW public.vista_cc_saldos_por_cliente AS
SELECT
  c.id AS cliente_id,
  c.nombre,
  c.telefono,
  c.email,
  c.whatsapp_e164,
  c.link_pago,
  c.limite_credito,
  COALESCE(SUM(m.monto), 0)::numeric(12,2) AS saldo,
  MAX(m.created_at) AS ultimo_movimiento,
  -- Se agrega al final para evitar renombrar/shift de columnas existentes en CREATE OR REPLACE VIEW
  c.direccion_default
FROM public.clientes c
LEFT JOIN public.cuentas_corrientes_movimientos m ON m.cliente_id = c.id
WHERE c.activo = true
GROUP BY
  c.id,
  c.nombre,
  c.telefono,
  c.email,
  c.whatsapp_e164,
  c.link_pago,
  c.limite_credito,
  c.direccion_default;

COMMENT ON VIEW public.vista_cc_saldos_por_cliente IS
  'Saldo por cliente (cuenta corriente). saldo>0 = deuda. Incluye direccion_default para UI/CRM.';

COMMIT;

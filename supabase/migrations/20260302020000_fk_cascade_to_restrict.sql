-- =============================================================================
-- Migration: Change high-risk FK constraints from CASCADE to RESTRICT
-- Ticket: FK-01/02 (OPEN_ISSUES)
-- Rationale: Prevent accidental deletion of critical financial/inventory data
-- =============================================================================

-- 1. stock_deposito.producto_id → productos(id)
--    Risk: Deleting a product would silently destroy all stock records
ALTER TABLE public.stock_deposito
  DROP CONSTRAINT stock_deposito_producto_id_fkey;

ALTER TABLE public.stock_deposito
  ADD CONSTRAINT stock_deposito_producto_id_fkey
  FOREIGN KEY (producto_id)
  REFERENCES public.productos(id)
  ON DELETE RESTRICT;

-- 2. cuentas_corrientes_movimientos.cliente_id → clientes(id)
--    Risk: Deleting a client would silently destroy financial ledger entries
ALTER TABLE public.cuentas_corrientes_movimientos
  DROP CONSTRAINT cuentas_corrientes_movimientos_cliente_id_fkey;

ALTER TABLE public.cuentas_corrientes_movimientos
  ADD CONSTRAINT cuentas_corrientes_movimientos_cliente_id_fkey
  FOREIGN KEY (cliente_id)
  REFERENCES public.clientes(id)
  ON DELETE RESTRICT;

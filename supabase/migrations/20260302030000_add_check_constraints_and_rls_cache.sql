-- =============================================================================
-- Migration: Add missing CHECK constraints + Enable RLS on cache_proveedor
-- Ticket: TIER-2 hardening
-- =============================================================================

-- 1. productos.precio_costo >= 0
-- Prevents negative cost prices from being stored
ALTER TABLE public.productos
  ADD CONSTRAINT chk_productos_precio_costo_non_negative
  CHECK (precio_costo IS NULL OR precio_costo >= 0);

-- 2. stock_deposito.stock_maximo >= stock_minimo
-- Ensures max stock threshold is always >= min threshold
ALTER TABLE public.stock_deposito
  ADD CONSTRAINT chk_stock_deposito_max_gte_min
  CHECK (stock_maximo >= stock_minimo);

-- 3. pedidos.monto_pagado <= monto_total
-- Prevents overpayment records
ALTER TABLE public.pedidos
  ADD CONSTRAINT chk_pedidos_monto_pagado_lte_total
  CHECK (monto_pagado <= monto_total);

-- 4. Enable RLS on cache_proveedor (defense in depth)
-- Table is only accessed by service_role (which bypasses RLS),
-- but enabling RLS prevents any authenticated user from reading cache.
ALTER TABLE public.cache_proveedor ENABLE ROW LEVEL SECURITY;

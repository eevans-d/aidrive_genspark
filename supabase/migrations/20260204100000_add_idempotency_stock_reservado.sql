-- Add idempotency key support for stock reservations
-- Purpose: prevent duplicate reservations on retries

ALTER TABLE public.stock_reservado
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_reservado_idempotency_key
  ON public.stock_reservado (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

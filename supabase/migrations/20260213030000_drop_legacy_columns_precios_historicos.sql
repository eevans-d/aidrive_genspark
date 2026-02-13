-- ============================================================
-- Migration: Cleanup legacy columns in precios_historicos
-- Date: 2026-02-13
-- Description:
--   Remove deprecated columns that duplicate canonical fields.
--   Canonical fields are:
--     - precio_nuevo (instead of legacy precio)
--     - motivo_cambio (instead of legacy fuente)
-- ============================================================

BEGIN;

ALTER TABLE public.precios_historicos
  DROP COLUMN IF EXISTS precio,
  DROP COLUMN IF EXISTS fuente;

COMMIT;

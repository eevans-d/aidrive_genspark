-- Migration: add factura_ingesta_item_id FK to movimientos_deposito
-- Purpose: Trazabilidad Fase 2 — link inventory movements to factura items
-- Allows Kardex to trace origin of each movement back to invoice line item

ALTER TABLE movimientos_deposito
  ADD COLUMN IF NOT EXISTS factura_ingesta_item_id uuid NULL
    REFERENCES facturas_ingesta_items(id) ON DELETE SET NULL;

-- Index for reverse lookup: given an item, find all movements
CREATE INDEX IF NOT EXISTS idx_movimientos_factura_item
  ON movimientos_deposito(factura_ingesta_item_id)
  WHERE factura_ingesta_item_id IS NOT NULL;

-- Unique partial index to prevent double-application of the same factura item
CREATE UNIQUE INDEX IF NOT EXISTS uq_movimientos_factura_item_idempotent
  ON movimientos_deposito(factura_ingesta_item_id)
  WHERE factura_ingesta_item_id IS NOT NULL;

COMMENT ON COLUMN movimientos_deposito.factura_ingesta_item_id IS
  'FK to facturas_ingesta_items — traces movement origin to invoice line item for traceability';

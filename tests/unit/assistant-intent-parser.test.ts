/**
 * Unit Tests for api-assistant intent parser
 *
 * Tests the rule-based intent parser with multiple variations per intent.
 * Verifies: correct intent detection, confidence scores, no false positives,
 * edge cases (short messages, empty strings, mixed intents).
 */

import { describe, it, expect } from 'vitest';
import { parseIntent, INTENT_RULES, SUGGESTIONS } from '../../supabase/functions/api-assistant/parser';

describe('Assistant Intent Parser', () => {
  // -----------------------------------------------------------------------
  // Intent: consultar_stock_bajo
  // -----------------------------------------------------------------------
  describe('consultar_stock_bajo', () => {
    const cases = [
      'stock bajo',
      'Stock mínimo',
      'productos con stock bajo',
      'qué me falta reponer?',
      'que falta reponer',
      'falta reponer',
      'falta stock',
      'necesito reponer',
      'reposición',
      'stock critico',
      'producto bajo minimo',
    ];

    it.each(cases)('detects intent for: "%s"', (msg) => {
      const result = parseIntent(msg);
      expect(result.intent).toBe('consultar_stock_bajo');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  // -----------------------------------------------------------------------
  // Intent: consultar_pedidos_pendientes
  // -----------------------------------------------------------------------
  describe('consultar_pedidos_pendientes', () => {
    const cases = [
      'pedidos pendientes',
      'pedido pendiente',
      'hay pedidos?',
      'cuantos pedidos hay',
      'cuántos pedidos',
      'pedidos del dia',
      'pedidos del día',
      'estado de los pedidos',
      'pedidos abiertos',
      'pedido sin entregar',
      'pedidos que faltan',
    ];

    it.each(cases)('detects intent for: "%s"', (msg) => {
      const result = parseIntent(msg);
      expect(result.intent).toBe('consultar_pedidos_pendientes');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  // -----------------------------------------------------------------------
  // Intent: consultar_resumen_cc
  // -----------------------------------------------------------------------
  describe('consultar_resumen_cc', () => {
    const cases = [
      'cuentas corrientes',
      'cuenta corriente',
      'dinero en la calle',
      'fiado',
      'deudas',
      'saldos',
      'cuanto me deben',
      'cuánto me deben',
      'clientes con deuda',
      'resumen de cc',
      'resumen de cuentas',
      'cliente deuda',
    ];

    it.each(cases)('detects intent for: "%s"', (msg) => {
      const result = parseIntent(msg);
      expect(result.intent).toBe('consultar_resumen_cc');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  // -----------------------------------------------------------------------
  // Intent: consultar_ventas_dia
  // -----------------------------------------------------------------------
  describe('consultar_ventas_dia', () => {
    const cases = [
      'ventas del dia',
      'ventas del día',
      'ventas hoy',
      'venta del dia',
      'cuanto se vendio',
      'cuánto se vendió',
      'resumen de ventas',
      'como fueron las ventas',
      'cómo van las ventas',
      'como estan las ventas',
      'facturación del día',
    ];

    it.each(cases)('detects intent for: "%s"', (msg) => {
      const result = parseIntent(msg);
      expect(result.intent).toBe('consultar_ventas_dia');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  // -----------------------------------------------------------------------
  // Intent: consultar_estado_ocr_facturas
  // -----------------------------------------------------------------------
  describe('consultar_estado_ocr_facturas', () => {
    const cases = [
      'factura ocr',
      'facturas pendientes',
      'estado de las facturas',
      'estado factura',
      'facturas sin procesar',
      'facturas sin validar',
      'factura sin aplicar',
      'ocr de facturas',
      'ingesta de facturas',
      'facturas cargadas',
    ];

    it.each(cases)('detects intent for: "%s"', (msg) => {
      const result = parseIntent(msg);
      expect(result.intent).toBe('consultar_estado_ocr_facturas');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  // -----------------------------------------------------------------------
  // No intent (clarify)
  // -----------------------------------------------------------------------
  describe('unrecognized messages (mode: clarify)', () => {
    const cases = [
      'hola',
      'ayuda',
      'que puedo hacer',
      'abcdef',
      'los precios estan cargados?',
      'quiero cerrar caja',
      'dame el reporte mensual',
    ];

    it.each(cases)('returns null intent for: "%s"', (msg) => {
      const result = parseIntent(msg);
      expect(result.intent).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('returns null for empty string', () => {
      const result = parseIntent('');
      expect(result.intent).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('returns null for single character', () => {
      const result = parseIntent('a');
      expect(result.intent).toBeNull();
    });

    it('returns null for two characters', () => {
      const result = parseIntent('ab');
      expect(result.intent).toBeNull();
    });

    it('handles extra whitespace', () => {
      const result = parseIntent('  stock   bajo  ');
      expect(result.intent).toBe('consultar_stock_bajo');
    });

    it('is case insensitive', () => {
      const result = parseIntent('STOCK BAJO');
      expect(result.intent).toBe('consultar_stock_bajo');
    });

    it('handles accented characters', () => {
      const result = parseIntent('cuánto me deben?');
      expect(result.intent).toBe('consultar_resumen_cc');
    });

    it('truncation at 500 chars still works', () => {
      const longMsg = 'stock bajo ' + 'x'.repeat(600);
      const result = parseIntent(longMsg);
      expect(result.intent).toBe('consultar_stock_bajo');
    });

    it('returns params as empty object by default', () => {
      const result = parseIntent('stock bajo');
      expect(result.params).toEqual({});
    });
  });

  // -----------------------------------------------------------------------
  // Structure validation
  // -----------------------------------------------------------------------
  describe('parser structure', () => {
    it('has exactly 5 intent rules', () => {
      expect(INTENT_RULES).toHaveLength(5);
    });

    it('has 5 suggestions', () => {
      expect(SUGGESTIONS).toHaveLength(5);
    });

    it('all intents have at least 4 patterns', () => {
      for (const rule of INTENT_RULES) {
        expect(rule.patterns.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('each intent name starts with consultar_', () => {
      for (const rule of INTENT_RULES) {
        expect(rule.intent).toMatch(/^consultar_/);
      }
    });
  });
});

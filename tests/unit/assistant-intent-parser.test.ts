/**
 * Unit Tests for api-assistant intent parser
 *
 * Tests the rule-based intent parser with multiple variations per intent.
 * Verifies: correct intent detection, confidence scores, no false positives,
 * edge cases (short messages, empty strings, mixed intents).
 */

import { describe, it, expect } from 'vitest';
import { parseIntent, INTENT_RULES, SUGGESTIONS, findRelevantSuggestions, WRITE_INTENTS } from '../../supabase/functions/api-assistant/parser';

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
  // Intent: saludo
  // -----------------------------------------------------------------------
  describe('saludo', () => {
    const cases = [
      'hola',
      'buenas',
      'buen dia',
      'buen día',
      'buenas tardes',
      'buenas noches',
      'hey',
      'qué tal',
    ];

    it.each(cases)('detects intent for: "%s"', (msg) => {
      const result = parseIntent(msg);
      expect(result.intent).toBe('saludo');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('prioritizes data intent over greeting for "hola, stock bajo"', () => {
      const result = parseIntent('hola, stock bajo');
      expect(result.intent).toBe('consultar_stock_bajo');
    });
  });

  // -----------------------------------------------------------------------
  // Intent: ayuda
  // -----------------------------------------------------------------------
  describe('ayuda', () => {
    const cases = [
      'ayuda',
      'help',
      'que puedo hacer',
      'qué puedo consultar',
      'como te uso',
      'cómo funciona',
      'que hacés?',
    ];

    it.each(cases)('detects intent for: "%s"', (msg) => {
      const result = parseIntent(msg);
      expect(result.intent).toBe('ayuda');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  // -----------------------------------------------------------------------
  // No intent (clarify)
  // -----------------------------------------------------------------------
  describe('unrecognized messages (mode: clarify)', () => {
    const cases = [
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
    it('has exactly 11 intent rules (7 read + 4 write)', () => {
      expect(INTENT_RULES).toHaveLength(11);
    });

    it('has 10 suggestions', () => {
      expect(SUGGESTIONS).toHaveLength(10);
    });

    it('data intents have at least 4 patterns', () => {
      const dataRules = INTENT_RULES.filter(r => r.intent.startsWith('consultar_'));
      for (const rule of dataRules) {
        expect(rule.patterns.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('read-only data intents start with consultar_', () => {
      const dataRules = INTENT_RULES.filter(r =>
        !['saludo', 'ayuda', 'crear_tarea', 'registrar_pago_cc', 'actualizar_estado_pedido', 'aplicar_factura'].includes(r.intent),
      );
      for (const rule of dataRules) {
        expect(rule.intent).toMatch(/^consultar_/);
      }
    });

    it('saludo and ayuda intents are at the end', () => {
      const lastTwo = INTENT_RULES.slice(-2).map(r => r.intent);
      expect(lastTwo).toEqual(['saludo', 'ayuda']);
    });
  });

  // -----------------------------------------------------------------------
  // findRelevantSuggestions
  // -----------------------------------------------------------------------
  describe('findRelevantSuggestions', () => {
    it('returns factura suggestion for factura keywords', () => {
      const result = findRelevantSuggestions('las facturas del proveedor');
      expect(result).toContain('estado de las facturas');
    });

    it('returns stock suggestion for stock keywords', () => {
      const result = findRelevantSuggestions('algo de los productos?');
      expect(result).toContain('stock bajo');
    });

    it('returns pedidos suggestion for pedido keywords', () => {
      const result = findRelevantSuggestions('como van las ordenes');
      expect(result).toContain('pedidos pendientes');
    });

    it('returns ventas suggestion for venta keywords', () => {
      const result = findRelevantSuggestions('cuanto se vendió ayer');
      expect(result).toContain('ventas del dia');
    });

    it('returns cuentas corrientes suggestion for deuda keywords', () => {
      const result = findRelevantSuggestions('clientes que deben');
      expect(result).toContain('cuentas corrientes');
    });

    it('returns multiple suggestions when multiple keywords match', () => {
      const result = findRelevantSuggestions('productos y facturas');
      expect(result).toContain('estado de las facturas');
      expect(result).toContain('stock bajo');
    });

    it('returns full list (minus ayuda) when no keywords match', () => {
      const result = findRelevantSuggestions('xyz random text');
      expect(result.length).toBe(9);
      expect(result).not.toContain('ayuda');
    });

    it('returns crear tarea suggestion for tarea keywords', () => {
      const result = findRelevantSuggestions('tengo algo pendiente para anotar');
      expect(result).toContain('crear tarea');
    });

    it('returns registrar pago suggestion for pago keywords', () => {
      const result = findRelevantSuggestions('me hicieron un cobro');
      expect(result).toContain('registrar pago');
    });
  });

  // -----------------------------------------------------------------------
  // Sprint 2: Write intents
  // -----------------------------------------------------------------------
  describe('WRITE_INTENTS', () => {
    it('contains crear_tarea and registrar_pago_cc', () => {
      expect(WRITE_INTENTS.has('crear_tarea')).toBe(true);
      expect(WRITE_INTENTS.has('registrar_pago_cc')).toBe(true);
    });

    it('does not contain read-only intents', () => {
      expect(WRITE_INTENTS.has('consultar_stock_bajo')).toBe(false);
      expect(WRITE_INTENTS.has('saludo')).toBe(false);
    });
  });

  describe('crear_tarea intent', () => {
    const cases = [
      'crear tarea comprar harina',
      'crea una tarea para revisar precios',
      'nueva tarea limpiar deposito',
      'agrega tarea llamar proveedor',
      'anota tarea pedir mercaderia',
      'tarea: llamar al electricista',
    ];

    cases.forEach((input) => {
      it(`matches "${input}"`, () => {
        const result = parseIntent(input);
        expect(result.intent).toBe('crear_tarea');
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('extracts titulo from "crear tarea comprar harina"', () => {
      const result = parseIntent('crear tarea comprar harina');
      expect(result.params.titulo).toBe('comprar harina');
    });

    it('extracts titulo from "tarea: llamar al electricista"', () => {
      const result = parseIntent('tarea: llamar al electricista');
      expect(result.params.titulo).toBe('llamar al electricista');
    });

    it('extracts prioridad when mentioned', () => {
      const result = parseIntent('crear tarea urgente revisar stock prioridad urgente');
      expect(result.intent).toBe('crear_tarea');
      expect(result.params.prioridad).toBe('urgente');
    });
  });

  describe('registrar_pago_cc intent', () => {
    const cases = [
      'registrar pago de 5000 de Juan Perez',
      'registra un pago de $3000',
      'cobra un pago del cliente',
      'pago 5000 de Maria',
      'recibi un pago de 10000',
    ];

    cases.forEach((input) => {
      it(`matches "${input}"`, () => {
        const result = parseIntent(input);
        expect(result.intent).toBe('registrar_pago_cc');
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('extracts monto from "registrar pago de 5000 de Juan Perez"', () => {
      const result = parseIntent('registrar pago de 5000 de Juan Perez');
      expect(result.params.monto).toBe('5000');
    });

    it('extracts monto from "registra pago $3000"', () => {
      const result = parseIntent('registra pago $3000');
      expect(result.params.monto).toBe('3000');
    });

    it('extracts cliente_nombre when present', () => {
      const result = parseIntent('registrar pago de 5000 de Juan Perez por');
      expect(result.params.cliente_nombre?.toLowerCase()).toBe('juan perez');
    });
  });
});

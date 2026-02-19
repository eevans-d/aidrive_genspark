/**
 * Unit tests for api-proveedor constants.
 */

import { describe, it, expect } from 'vitest';

import {
  CIRCUIT_BREAKER_OPTIONS,
  PRODUCT_ORDER_FIELDS,
  COMPARACION_ORDER_FIELDS,
  SINCRONIZACION_PRIORIDADES,
  ALERTA_SEVERIDADES,
  ALERTA_TIPOS,
  ESTADISTICAS_GRANULARIDADES,
} from '../../supabase/functions/api-proveedor/utils/constants.ts';

describe('api-proveedor/utils/constants', () => {
  describe('CIRCUIT_BREAKER_OPTIONS', () => {
    it('has expected failure threshold', () => {
      expect(CIRCUIT_BREAKER_OPTIONS.failureThreshold).toBe(3);
    });

    it('has expected success threshold', () => {
      expect(CIRCUIT_BREAKER_OPTIONS.successThreshold).toBe(1);
    });

    it('has expected open timeout', () => {
      expect(CIRCUIT_BREAKER_OPTIONS.openTimeoutMs).toBe(30000);
    });
  });

  describe('PRODUCT_ORDER_FIELDS', () => {
    it('contains expected sort options', () => {
      expect(PRODUCT_ORDER_FIELDS).toContain('nombre_asc');
      expect(PRODUCT_ORDER_FIELDS).toContain('precio_asc');
      expect(PRODUCT_ORDER_FIELDS).toContain('precio_desc');
      expect(PRODUCT_ORDER_FIELDS).toContain('stock_desc');
      expect(PRODUCT_ORDER_FIELDS).toContain('categoria_asc');
    });

    it('has exactly 5 options', () => {
      expect(PRODUCT_ORDER_FIELDS).toHaveLength(5);
    });
  });

  describe('COMPARACION_ORDER_FIELDS', () => {
    it('contains expected sort options', () => {
      expect(COMPARACION_ORDER_FIELDS).toContain('diferencia_absoluta_desc');
      expect(COMPARACION_ORDER_FIELDS).toContain('diferencia_relativa_desc');
      expect(COMPARACION_ORDER_FIELDS).toContain('actualizado_desc');
    });

    it('has exactly 5 options', () => {
      expect(COMPARACION_ORDER_FIELDS).toHaveLength(5);
    });
  });

  describe('SINCRONIZACION_PRIORIDADES', () => {
    it('contains normal, alta, baja', () => {
      expect(SINCRONIZACION_PRIORIDADES).toContain('normal');
      expect(SINCRONIZACION_PRIORIDADES).toContain('alta');
      expect(SINCRONIZACION_PRIORIDADES).toContain('baja');
    });

    it('has exactly 3 values', () => {
      expect(SINCRONIZACION_PRIORIDADES).toHaveLength(3);
    });
  });

  describe('ALERTA_SEVERIDADES', () => {
    it('includes "todos" as wildcard', () => {
      expect(ALERTA_SEVERIDADES).toContain('todos');
    });

    it('includes all severity levels', () => {
      expect(ALERTA_SEVERIDADES).toContain('critica');
      expect(ALERTA_SEVERIDADES).toContain('alta');
      expect(ALERTA_SEVERIDADES).toContain('media');
      expect(ALERTA_SEVERIDADES).toContain('baja');
    });

    it('has exactly 5 values', () => {
      expect(ALERTA_SEVERIDADES).toHaveLength(5);
    });
  });

  describe('ALERTA_TIPOS', () => {
    it('includes "todos" as wildcard', () => {
      expect(ALERTA_TIPOS).toContain('todos');
    });

    it('includes all alert types', () => {
      expect(ALERTA_TIPOS).toContain('precio');
      expect(ALERTA_TIPOS).toContain('stock');
      expect(ALERTA_TIPOS).toContain('sistema');
      expect(ALERTA_TIPOS).toContain('otros');
    });

    it('has exactly 5 values', () => {
      expect(ALERTA_TIPOS).toHaveLength(5);
    });
  });

  describe('ESTADISTICAS_GRANULARIDADES', () => {
    it('includes all granularities', () => {
      expect(ESTADISTICAS_GRANULARIDADES).toContain('hora');
      expect(ESTADISTICAS_GRANULARIDADES).toContain('dia');
      expect(ESTADISTICAS_GRANULARIDADES).toContain('semana');
      expect(ESTADISTICAS_GRANULARIDADES).toContain('mes');
    });

    it('has exactly 4 values', () => {
      expect(ESTADISTICAS_GRANULARIDADES).toHaveLength(4);
    });
  });
});

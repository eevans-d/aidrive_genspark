/**
 * Unit tests for api-proveedor alertas utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Deno env
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => 'https://test.supabase.co' } };
}

import {
  buildAlertasQuery,
  detectAlertPatterns,
  predictAlertTrends,
  calculateAlertRiskScore,
  calculateAlertImpact,
  generateAlertRecommendations,
  assignAlertCluster,
  calculateAlertPriority,
  determineActionRequired,
  generateAlertInsights,
} from '../../supabase/functions/api-proveedor/utils/alertas.ts';

describe('api-proveedor/utils/alertas', () => {
  describe('buildAlertasQuery()', () => {
    it('builds base query without filters when "todos"', () => {
      const query = buildAlertasQuery('todos', 'todos', 20);
      expect(query).toContain('/rest/v1/vista_alertas_activas');
      expect(query).toContain('limit=20');
      expect(query).not.toContain('severidad=eq.');
      expect(query).not.toContain('tipo_cambio=eq.');
    });

    it('adds severidad filter', () => {
      const query = buildAlertasQuery('critica', 'todos', 10);
      expect(query).toContain('severidad=eq.critica');
    });

    it('adds tipo filter', () => {
      const query = buildAlertasQuery('todos', 'precio', 10);
      expect(query).toContain('tipo_cambio=eq.precio');
    });

    it('adds both filters', () => {
      const query = buildAlertasQuery('alta', 'stock', 5);
      expect(query).toContain('severidad=eq.alta');
      expect(query).toContain('tipo_cambio=eq.stock');
      expect(query).toContain('limit=5');
    });

    it('orders by fecha_alerta desc', () => {
      const query = buildAlertasQuery('todos', 'todos', 10);
      expect(query).toContain('order=fecha_alerta.desc');
    });
  });

  describe('detectAlertPatterns()', () => {
    it('returns empty patterns for few recent alerts', async () => {
      const alertas = [
        { fecha_alerta: new Date().toISOString() },
        { fecha_alerta: new Date().toISOString() },
      ];
      const patterns = await detectAlertPatterns(alertas);
      expect(patterns).toHaveLength(0);
    });

    it('detects high_frequency when >10 alerts in 24h', async () => {
      const now = new Date();
      const alertas = Array.from({ length: 12 }, () => ({
        fecha_alerta: now.toISOString(),
      }));
      const patterns = await detectAlertPatterns(alertas);
      expect(patterns.some((p: any) => p.type === 'high_frequency')).toBe(true);
    });
  });

  describe('predictAlertTrends()', () => {
    it('returns stable for moderate alert count', async () => {
      const alertas = [
        { fecha_alerta: new Date(Date.now() - 1800000).toISOString() },
        { fecha_alerta: new Date(Date.now() - 1800000).toISOString() },
        { fecha_alerta: new Date(Date.now() - 1800000).toISOString() },
      ];
      const trend = await predictAlertTrends(alertas);
      expect(trend.direction).toBe('stable');
    });

    it('returns increasing for >5 recent alerts', async () => {
      const now = new Date();
      const alertas = Array.from({ length: 7 }, () => ({
        fecha_alerta: now.toISOString(),
      }));
      const trend = await predictAlertTrends(alertas);
      expect(trend.direction).toBe('increasing');
    });

    it('returns decreasing for <2 recent alerts', async () => {
      const alertas = [
        { fecha_alerta: new Date(Date.now() - 7200000).toISOString() },
      ];
      const trend = await predictAlertTrends(alertas);
      expect(trend.direction).toBe('decreasing');
    });
  });

  describe('calculateAlertRiskScore()', () => {
    it('assigns higher score to critical severity', async () => {
      const alertas = [
        { severidad: 'critica', tipo_cambio: 'aumento', fecha_alerta: new Date().toISOString() },
      ];
      const result = await calculateAlertRiskScore(alertas);
      expect(result.average_score).toBeGreaterThan(50);
    });

    it('returns risk distribution', async () => {
      const alertas = [
        { severidad: 'baja', tipo_cambio: 'otro', fecha_alerta: new Date(Date.now() - 86400000).toISOString() },
        { severidad: 'critica', tipo_cambio: 'aumento', fecha_alerta: new Date().toISOString() },
      ];
      const result = await calculateAlertRiskScore(alertas);
      expect(result.risk_distribution).toBeDefined();
      expect(result.risk_distribution.low).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateAlertImpact()', () => {
    it('returns higher impact for critical severity', () => {
      const critical = calculateAlertImpact({ severidad: 'critica', stock_disponible: 100 });
      const low = calculateAlertImpact({ severidad: 'baja', stock_disponible: 100 });
      expect(critical).toBeGreaterThan(low);
    });

    it('adds impact for low stock', () => {
      const lowStock = calculateAlertImpact({ severidad: 'media', stock_disponible: 3 });
      const highStock = calculateAlertImpact({ severidad: 'media', stock_disponible: 100 });
      expect(lowStock).toBeGreaterThan(highStock);
    });

    it('caps at 100', () => {
      const impact = calculateAlertImpact({
        severidad: 'critica',
        diferencia_absoluta: 999999,
        stock_disponible: 0,
      });
      expect(impact).toBeLessThanOrEqual(100);
    });
  });

  describe('generateAlertRecommendations()', () => {
    it('recommends immediate review for critical alerts', () => {
      const recs = generateAlertRecommendations({ severidad: 'critica' });
      expect(recs).toContain('Revisión inmediata requerida');
    });

    it('recommends price update for high difference', () => {
      const recs = generateAlertRecommendations({ severidad: 'media', diferencia_absoluta: 200 });
      expect(recs.some((r: string) => r.includes('precios'))).toBe(true);
    });

    it('recommends restock for low stock', () => {
      const recs = generateAlertRecommendations({ severidad: 'media', stock_disponible: 3 });
      expect(recs.some((r: string) => r.includes('inventario'))).toBe(true);
    });

    it('returns empty array for low-impact alerts', () => {
      const recs = generateAlertRecommendations({
        severidad: 'baja',
        diferencia_absoluta: 5,
        stock_disponible: 100,
      });
      expect(recs).toHaveLength(0);
    });
  });

  describe('assignAlertCluster()', () => {
    it('creates cluster string from category, type, and severity', async () => {
      const cluster = await assignAlertCluster({
        categoria: 'bebidas',
        tipo_cambio: 'aumento',
        severidad: 'alta',
      });
      expect(cluster).toBe('bebidas_aumento_alta');
    });
  });

  describe('calculateAlertPriority()', () => {
    it('gives highest priority to critical recent alerts with high difference', () => {
      const priority = calculateAlertPriority({
        severidad: 'critica',
        fecha_alerta: new Date().toISOString(),
        diferencia_absoluta: 100,
      });
      expect(priority).toBeGreaterThan(100);
    });

    it('caps priority at 150', () => {
      const priority = calculateAlertPriority({
        severidad: 'critica',
        fecha_alerta: new Date().toISOString(),
        diferencia_absoluta: 999,
      });
      expect(priority).toBeLessThanOrEqual(150);
    });
  });

  describe('determineActionRequired()', () => {
    it('returns true for critical alerts', () => {
      expect(
        determineActionRequired({
          severidad: 'critica',
          diferencia_absoluta: 10,
          fecha_alerta: new Date(Date.now() - 86400000).toISOString(),
        }),
      ).toBe(true);
    });

    it('returns true for high-impact recent alerts', () => {
      expect(
        determineActionRequired({
          severidad: 'media',
          diferencia_absoluta: 200,
          fecha_alerta: new Date().toISOString(),
        }),
      ).toBe(true);
    });

    it('returns false for low-impact old alerts', () => {
      expect(
        determineActionRequired({
          severidad: 'baja',
          diferencia_absoluta: 5,
          fecha_alerta: new Date(Date.now() - 86400000).toISOString(),
        }),
      ).toBe(false);
    });
  });

  describe('generateAlertInsights()', () => {
    it('reports critical alerts', () => {
      const alertas = [
        { severidad: 'critica', fecha_alerta: new Date(Date.now() - 86400000).toISOString() },
      ];
      const insights = generateAlertInsights(alertas);
      expect(insights.some((i: any) => i.type === 'critical_alerts')).toBe(true);
    });

    it('reports high activity', () => {
      const now = new Date();
      const alertas = Array.from({ length: 7 }, () => ({
        severidad: 'baja',
        fecha_alerta: now.toISOString(),
      }));
      const insights = generateAlertInsights(alertas);
      expect(insights.some((i: any) => i.type === 'high_activity')).toBe(true);
    });

    it('returns empty for quiet period', () => {
      const insights = generateAlertInsights([]);
      expect(insights).toHaveLength(0);
    });
  });
});

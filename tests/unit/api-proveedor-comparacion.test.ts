/**
 * Unit tests for api-proveedor comparacion utilities.
 */

import { describe, it, expect } from 'vitest';

// Mock Deno env
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => 'https://test.supabase.co' } };
}

import {
  buildComparacionQuery,
  calcularEstadisticasComparacionOptimizado,
  calculateOpportunityScore,
  assessMarketRisk,
  determinePurchaseUrgency,
  generateBusinessInsights,
  analyzeOpportunityTrends,
  identifyOpportunityClusters,
  calculateSavingsDistribution,
} from '../../supabase/functions/api-proveedor/utils/comparacion.ts';

describe('api-proveedor/utils/comparacion', () => {
  describe('buildComparacionQuery()', () => {
    it('builds base query without opportunity filter', () => {
      const query = buildComparacionQuery(false, 0, 'default', 20);
      expect(query).toContain('/rest/v1/vista_oportunidades_ahorro');
      expect(query).toContain('limit=20');
      expect(query).not.toContain('diferencia_porcentual=gte.');
    });

    it('adds opportunity filter when soloOportunidades=true', () => {
      const query = buildComparacionQuery(true, 5, 'default', 10);
      expect(query).toContain('diferencia_porcentual=gte.5');
    });

    it('orders by diferencia_absoluta desc by default', () => {
      const query = buildComparacionQuery(false, 0, 'unknown_order', 10);
      expect(query).toContain('order=diferencia_absoluta.desc');
    });

    it('supports diferencia_absoluta_asc order', () => {
      const query = buildComparacionQuery(false, 0, 'diferencia_absoluta_asc', 10);
      expect(query).toContain('order=diferencia_absoluta.asc');
    });

    it('supports diferencia_porcentual_desc order', () => {
      const query = buildComparacionQuery(false, 0, 'diferencia_porcentual_desc', 10);
      expect(query).toContain('order=diferencia_porcentual.desc');
    });

    it('supports nombre_asc order', () => {
      const query = buildComparacionQuery(false, 0, 'nombre_asc', 10);
      expect(query).toContain('order=nombre_producto.asc');
    });
  });

  describe('calcularEstadisticasComparacionOptimizado()', () => {
    it('returns zeros for empty array', () => {
      const result = calcularEstadisticasComparacionOptimizado([]);
      expect(result.total_oportunidades).toBe(0);
      expect(result.ahorro_total_estimado).toBe(0);
      expect(result.mejor_oportunidad).toBeNull();
    });

    it('calculates correct statistics for opportunities', () => {
      const oportunidades = [
        { diferencia_absoluta: 100, categoria: 'bebidas' },
        { diferencia_absoluta: 200, categoria: 'lacteos' },
        { diferencia_absoluta: 300, categoria: 'bebidas' },
      ];
      const result = calcularEstadisticasComparacionOptimizado(oportunidades);
      expect(result.total_oportunidades).toBe(3);
      expect(result.ahorro_total_estimado).toBe(600);
      expect(result.oportunidad_promedio).toBe(200);
      expect(result.mejor_oportunidad.diferencia_absoluta).toBe(300);
    });

    it('includes clusters and distribution', () => {
      const oportunidades = [
        { diferencia_absoluta: 50, categoria: 'A' },
        { diferencia_absoluta: 150, categoria: 'A' },
      ];
      const result = calcularEstadisticasComparacionOptimizado(oportunidades);
      expect(result.clusters_identificados).toBeGreaterThanOrEqual(0);
      expect(result.distribucion_ahorros).toBeDefined();
    });
  });

  describe('calculateOpportunityScore()', () => {
    it('gives higher score for larger price difference', () => {
      const highDiff = calculateOpportunityScore({
        diferencia_porcentual: 50,
        stock_disponible: 10,
        ultima_actualizacion: new Date().toISOString(),
      });
      const lowDiff = calculateOpportunityScore({
        diferencia_porcentual: 5,
        stock_disponible: 10,
        ultima_actualizacion: new Date().toISOString(),
      });
      expect(highDiff).toBeGreaterThan(lowDiff);
    });

    it('adds stock score when stock > 0', () => {
      const withStock = calculateOpportunityScore({
        diferencia_porcentual: 10,
        stock_disponible: 5,
        ultima_actualizacion: null,
      });
      const noStock = calculateOpportunityScore({
        diferencia_porcentual: 10,
        stock_disponible: 0,
        ultima_actualizacion: null,
      });
      expect(withStock).toBeGreaterThan(noStock);
    });

    it('caps at 100', () => {
      const score = calculateOpportunityScore({
        diferencia_porcentual: 500,
        stock_disponible: 100,
        ultima_actualizacion: new Date().toISOString(),
      });
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('assessMarketRisk()', () => {
    it('returns alto for high price volatility', () => {
      expect(assessMarketRisk({ diferencia_porcentual: 25, stock_disponible: 50 })).toBe('alto');
    });

    it('returns alto for very low stock', () => {
      expect(assessMarketRisk({ diferencia_porcentual: 1, stock_disponible: 2 })).toBe('alto');
    });

    it('returns medio for moderate conditions', () => {
      expect(assessMarketRisk({ diferencia_porcentual: 15, stock_disponible: 50 })).toBe('medio');
    });

    it('returns bajo for stable conditions', () => {
      expect(assessMarketRisk({ diferencia_porcentual: 3, stock_disponible: 100 })).toBe('bajo');
    });
  });

  describe('determinePurchaseUrgency()', () => {
    it('returns inmediata for very recent update', () => {
      expect(determinePurchaseUrgency({
        ultima_actualizacion: new Date().toISOString(),
      })).toBe('inmediata');
    });

    it('returns alta for update within 7 days', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      expect(determinePurchaseUrgency({ ultima_actualizacion: threeDaysAgo })).toBe('alta');
    });

    it('returns media for update within 30 days', () => {
      const fifteenDaysAgo = new Date(Date.now() - 15 * 86400000).toISOString();
      expect(determinePurchaseUrgency({ ultima_actualizacion: fifteenDaysAgo })).toBe('media');
    });

    it('returns baja for old or missing update', () => {
      expect(determinePurchaseUrgency({ ultima_actualizacion: null })).toBe('baja');
    });
  });

  describe('generateBusinessInsights()', () => {
    it('reports volume insight for >10 opportunities', () => {
      const oportunidades = Array.from({ length: 15 }, (_, i) => ({
        diferencia_absoluta: 10,
      }));
      const insights = generateBusinessInsights(oportunidades);
      expect(insights.some((i: any) => i.tipo === 'volumen')).toBe(true);
    });

    it('reports value insight for total savings >1000', () => {
      const oportunidades = [
        { diferencia_absoluta: 600 },
        { diferencia_absoluta: 500 },
      ];
      const insights = generateBusinessInsights(oportunidades);
      expect(insights.some((i: any) => i.tipo === 'valor')).toBe(true);
    });

    it('returns empty for small opportunities', () => {
      const insights = generateBusinessInsights([{ diferencia_absoluta: 5 }]);
      expect(insights).toHaveLength(0);
    });
  });

  describe('analyzeOpportunityTrends()', () => {
    it('identifies top categories by value', () => {
      const oportunidades = [
        { categoria: 'bebidas', diferencia_absoluta: 100 },
        { categoria: 'bebidas', diferencia_absoluta: 200 },
        { categoria: 'lacteos', diferencia_absoluta: 50 },
      ];
      const trends = analyzeOpportunityTrends(oportunidades);
      expect(trends.top_categories[0].categoria).toBe('bebidas');
      expect(trends.top_categories[0].valor_total).toBe(300);
    });
  });

  describe('identifyOpportunityClusters()', () => {
    it('groups opportunities by category', () => {
      const oportunidades = [
        { categoria: 'A', diferencia_absoluta: 10 },
        { categoria: 'A', diferencia_absoluta: 20 },
        { categoria: 'B', diferencia_absoluta: 30 },
      ];
      const clusters = identifyOpportunityClusters(oportunidades);
      // Only 'A' has >1 items
      expect(clusters).toHaveLength(1);
      expect(clusters[0].categoria).toBe('A');
      expect(clusters[0].tamaño).toBe(2);
    });

    it('returns empty for single-item categories', () => {
      const oportunidades = [
        { categoria: 'A', diferencia_absoluta: 10 },
        { categoria: 'B', diferencia_absoluta: 20 },
      ];
      const clusters = identifyOpportunityClusters(oportunidades);
      expect(clusters).toHaveLength(0);
    });
  });

  describe('calculateSavingsDistribution()', () => {
    it('distributes savings into ranges', () => {
      const oportunidades = [
        { diferencia_absoluta: 5 },
        { diferencia_absoluta: 25 },
        { diferencia_absoluta: 75 },
        { diferencia_absoluta: 200 },
        { diferencia_absoluta: 600 },
      ];
      const dist = calculateSavingsDistribution(oportunidades);
      expect(dist).toHaveLength(5);
      expect(dist[0].count).toBe(1); // $0-$10
      expect(dist[1].count).toBe(1); // $10-$50
      expect(dist[2].count).toBe(1); // $50-$100
      expect(dist[3].count).toBe(1); // $100-$500
      expect(dist[4].count).toBe(1); // $500+
    });
  });
});

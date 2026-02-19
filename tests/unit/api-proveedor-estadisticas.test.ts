/**
 * Unit tests for api-proveedor estadisticas utilities.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock Deno env
if (typeof globalThis.Deno === 'undefined') {
  (globalThis as any).Deno = { env: { get: () => 'https://test.supabase.co' } };
}

// Reset metrics singleton before importing
import { REQUEST_METRICS } from '../../supabase/functions/api-proveedor/utils/metrics.ts';

import {
  buildEstadisticasQuery,
  calcularMetricasScraping,
  calcularMetricasScrapingOptimizado,
  aggregateTemporalMetrics,
  calculateKPIs,
  calculateUptimePercentage,
  calculateEfficiencyScore,
  getPeakPerformanceDay,
  calculateConsistencyScore,
  identifyAnomalies,
} from '../../supabase/functions/api-proveedor/utils/estadisticas.ts';

describe('api-proveedor/utils/estadisticas', () => {
  beforeEach(() => {
    REQUEST_METRICS.total = 0;
    REQUEST_METRICS.success = 0;
    REQUEST_METRICS.error = 0;
    REQUEST_METRICS.averageResponseTime = 0;
    REQUEST_METRICS.cacheHits = 0;
    REQUEST_METRICS.endpoints.clear();
  });

  describe('buildEstadisticasQuery()', () => {
    it('builds query with date filter', () => {
      const fecha = new Date('2026-01-01T00:00:00Z');
      const query = buildEstadisticasQuery(fecha, '', 'dia');
      expect(query).toContain('/rest/v1/estadisticas_scraping');
      expect(query).toContain('created_at=gte.2026-01-01T00:00:00.000Z');
    });

    it('adds category filter when provided', () => {
      const fecha = new Date('2026-01-01T00:00:00Z');
      const query = buildEstadisticasQuery(fecha, 'bebidas', 'dia');
      expect(query).toContain('categoria_procesada=eq.bebidas');
    });

    it('orders by created_at desc', () => {
      const fecha = new Date();
      const query = buildEstadisticasQuery(fecha, '', 'hora');
      expect(query).toContain('order=created_at.desc');
    });
  });

  describe('calcularMetricasScraping()', () => {
    it('returns zeros for empty array', () => {
      const result = calcularMetricasScraping([]);
      expect(result.total_ejecuciones).toBe(0);
      expect(result.productos_promedio).toBe(0);
      expect(result.tasa_exito).toBe(0);
      expect(result.tiempo_promedio).toBe(0);
    });

    it('calculates correct metrics', () => {
      const stats = [
        { status: 'exitoso', productos_encontrados: 100, tiempo_ejecucion_ms: 2000 },
        { status: 'exitoso', productos_encontrados: 200, tiempo_ejecucion_ms: 3000 },
        { status: 'fallido', productos_encontrados: 0, tiempo_ejecucion_ms: 500 },
      ];
      const result = calcularMetricasScraping(stats);
      expect(result.total_ejecuciones).toBe(3);
      expect(result.productos_promedio).toBe(100); // 300/3
      expect(result.tasa_exito).toBe(67); // 2/3 = 66.7% rounded
      expect(result.tiempo_promedio_ms).toBe(1833); // 5500/3 rounded
    });
  });

  describe('calcularMetricasScrapingOptimizado()', () => {
    it('returns zeros with null trends for empty array', () => {
      const result = calcularMetricasScrapingOptimizado([]);
      expect(result.total_ejecuciones).toBe(0);
      expect(result.tendencias_rendimiento).toBeNull();
      expect(result.anomalias_detectadas).toBe(0);
    });

    it('includes extended metrics', () => {
      const stats = [
        { status: 'exitoso', productos_encontrados: 100, tiempo_ejecucion_ms: 2000, created_at: new Date().toISOString() },
      ];
      const result = calcularMetricasScrapingOptimizado(stats);
      expect(result.tendencias_rendimiento).toBeDefined();
      expect(result.uptime_percentage).toBeDefined();
      expect(result.efficiency_score).toBeDefined();
    });
  });

  describe('aggregateTemporalMetrics()', () => {
    it('groups by hour', () => {
      const now = new Date('2026-02-19T10:30:00Z');
      const stats = [
        { created_at: now.toISOString(), status: 'exitoso', productos_encontrados: 50, tiempo_ejecucion_ms: 1000 },
        { created_at: now.toISOString(), status: 'exitoso', productos_encontrados: 60, tiempo_ejecucion_ms: 1200 },
      ];
      const result = aggregateTemporalMetrics(stats, 'hora');
      expect(result).toHaveLength(1);
      expect(result[0].ejecuciones).toBe(2);
      expect(result[0].productos_totales).toBe(110);
    });

    it('groups by day', () => {
      const stats = [
        { created_at: '2026-02-19T08:00:00Z', status: 'exitoso', productos_encontrados: 50, tiempo_ejecucion_ms: 1000 },
        { created_at: '2026-02-19T14:00:00Z', status: 'exitoso', productos_encontrados: 60, tiempo_ejecucion_ms: 1000 },
        { created_at: '2026-02-18T10:00:00Z', status: 'fallido', productos_encontrados: 0, tiempo_ejecucion_ms: 500 },
      ];
      const result = aggregateTemporalMetrics(stats, 'dia');
      expect(result).toHaveLength(2);
    });

    it('groups by month for unknown granularity', () => {
      const stats = [
        { created_at: '2026-02-01T00:00:00Z', status: 'exitoso', productos_encontrados: 100, tiempo_ejecucion_ms: 2000 },
        { created_at: '2026-02-15T00:00:00Z', status: 'exitoso', productos_encontrados: 200, tiempo_ejecucion_ms: 3000 },
      ];
      const result = aggregateTemporalMetrics(stats, 'mes');
      expect(result).toHaveLength(1);
      expect(result[0].ejecuciones).toBe(2);
    });
  });

  describe('calculateKPIs()', () => {
    it('returns empty object for empty stats', () => {
      expect(calculateKPIs([])).toEqual({});
    });

    it('calculates KPIs for valid stats', () => {
      const stats = [
        { status: 'exitoso', tiempo_ejecucion_ms: 2000, productos_encontrados: 100, created_at: '2026-02-19T10:00:00Z' },
        { status: 'fallido', tiempo_ejecucion_ms: 500, productos_encontrados: 0, created_at: '2026-02-19T11:00:00Z' },
      ];
      const kpis = calculateKPIs(stats);
      expect(kpis.mean_time_to_success).toBe(2000);
      expect(kpis.failure_rate).toBe(50);
      expect(kpis.peak_performance_day).toBeDefined();
      expect(kpis.consistency_score).toBeDefined();
    });
  });

  describe('calculateUptimePercentage()', () => {
    it('returns 100 for empty stats', () => {
      expect(calculateUptimePercentage([])).toBe(100);
    });

    it('calculates correct percentage', () => {
      const stats = [
        { status: 'exitoso' },
        { status: 'exitoso' },
        { status: 'fallido' },
        { status: 'exitoso' },
      ];
      expect(calculateUptimePercentage(stats)).toBe(75);
    });
  });

  describe('calculateEfficiencyScore()', () => {
    it('returns NaN for empty stats (division by zero edge case)', () => {
      // avgProducts=0, avgTime=0 -> 0/0 = NaN -> NaN * 10 = NaN -> min(100, NaN)
      expect(calculateEfficiencyScore([])).toBeNaN();
    });

    it('returns higher score for more products per second', () => {
      const fast = [{ productos_encontrados: 100, tiempo_ejecucion_ms: 1000 }];
      const slow = [{ productos_encontrados: 10, tiempo_ejecucion_ms: 10000 }];
      expect(calculateEfficiencyScore(fast)).toBeGreaterThan(calculateEfficiencyScore(slow));
    });

    it('caps at 100', () => {
      const veryFast = [{ productos_encontrados: 1000, tiempo_ejecucion_ms: 100 }];
      expect(calculateEfficiencyScore(veryFast)).toBeLessThanOrEqual(100);
    });
  });

  describe('getPeakPerformanceDay()', () => {
    it('returns N/A for empty stats', () => {
      expect(getPeakPerformanceDay([])).toBe('N/A');
    });

    it('identifies the day with highest average products', () => {
      const stats = [
        { created_at: '2026-02-18T10:00:00Z', productos_encontrados: 50 },
        { created_at: '2026-02-19T10:00:00Z', productos_encontrados: 200 },
      ];
      const peak = getPeakPerformanceDay(stats);
      expect(peak).toContain('2026');
    });
  });

  describe('calculateConsistencyScore()', () => {
    it('returns 100 for single stat', () => {
      expect(calculateConsistencyScore([{ productos_encontrados: 50 }])).toBe(100);
    });

    it('returns high score for consistent results', () => {
      const stats = [
        { productos_encontrados: 100 },
        { productos_encontrados: 102 },
        { productos_encontrados: 98 },
      ];
      expect(calculateConsistencyScore(stats)).toBeGreaterThan(90);
    });

    it('returns lower score for inconsistent results', () => {
      const stats = [
        { productos_encontrados: 10 },
        { productos_encontrados: 500 },
        { productos_encontrados: 20 },
      ];
      expect(calculateConsistencyScore(stats)).toBeLessThan(50);
    });
  });

  describe('identifyAnomalies()', () => {
    it('marks non-exitoso entries as anomalies', () => {
      const stats = [
        { status: 'exitoso', created_at: '2026-02-19T10:00:00Z' },
        { status: 'fallido', created_at: '2026-02-19T11:00:00Z' },
      ];
      const anomalies = identifyAnomalies(stats);
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].type).toBe('execution_failure');
    });

    it('returns empty for all successful', () => {
      const stats = [
        { status: 'exitoso', created_at: '2026-02-19T10:00:00Z' },
      ];
      expect(identifyAnomalies(stats)).toHaveLength(0);
    });
  });
});

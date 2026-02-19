/**
 * Unit tests for api-proveedor metrics utilities.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  REQUEST_METRICS,
  updateRequestMetrics,
  calculatePerformanceScore,
  calculateOverallHealthScore,
  determineSystemStatus,
  calculateSystemUptime,
  assessSystemHealth,
  calculateRequestRate,
  calculateErrorRate,
  calculateResponseTimeP95,
  calculateThroughput,
  calculateAvailability,
} from '../../supabase/functions/api-proveedor/utils/metrics.ts';

describe('api-proveedor/utils/metrics', () => {
  beforeEach(() => {
    // Reset metrics singleton between tests
    REQUEST_METRICS.total = 0;
    REQUEST_METRICS.success = 0;
    REQUEST_METRICS.error = 0;
    REQUEST_METRICS.averageResponseTime = 0;
    REQUEST_METRICS.cacheHits = 0;
    REQUEST_METRICS.endpoints.clear();
  });

  describe('updateRequestMetrics()', () => {
    it('increments total on each call', () => {
      updateRequestMetrics(true, 100);
      updateRequestMetrics(false, 200);
      expect(REQUEST_METRICS.total).toBe(2);
    });

    it('increments success count on success', () => {
      updateRequestMetrics(true, 100);
      expect(REQUEST_METRICS.success).toBe(1);
      expect(REQUEST_METRICS.error).toBe(0);
    });

    it('increments error count on failure', () => {
      updateRequestMetrics(false, 100);
      expect(REQUEST_METRICS.error).toBe(1);
      expect(REQUEST_METRICS.success).toBe(0);
    });

    it('updates average response time', () => {
      updateRequestMetrics(true, 100);
      expect(REQUEST_METRICS.averageResponseTime).toBe(50); // (0 + 100) / 2
      updateRequestMetrics(true, 200);
      expect(REQUEST_METRICS.averageResponseTime).toBe(125); // (50 + 200) / 2
    });
  });

  describe('calculatePerformanceScore()', () => {
    it('returns reasonable score for perfect metrics', () => {
      const metrics = {
        total: 100,
        success: 100,
        error: 0,
        averageResponseTime: 50,
        cacheHits: 50,
        endpoints: new Map(),
      };
      const score = calculatePerformanceScore(metrics);
      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('returns lower score for high error rate', () => {
      const goodMetrics = {
        total: 100,
        success: 100,
        error: 0,
        averageResponseTime: 50,
        cacheHits: 0,
        endpoints: new Map(),
      };
      const badMetrics = {
        total: 100,
        success: 50,
        error: 50,
        averageResponseTime: 50,
        cacheHits: 0,
        endpoints: new Map(),
      };
      expect(calculatePerformanceScore(goodMetrics)).toBeGreaterThan(
        calculatePerformanceScore(badMetrics),
      );
    });

    it('handles zero total gracefully', () => {
      const metrics = {
        total: 0,
        success: 0,
        error: 0,
        averageResponseTime: 0,
        cacheHits: 0,
        endpoints: new Map(),
      };
      const score = calculatePerformanceScore(metrics);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateOverallHealthScore()', () => {
    it('returns weighted sum of component scores', () => {
      const components = {
        database: { score: 100 },
        scraper: { score: 100 },
        cache: { score: 100 },
        memory: { score: 100 },
        api_performance: { score: 100 },
        external_deps: { score: 100 },
      };
      expect(calculateOverallHealthScore(components)).toBe(100);
    });

    it('handles missing components', () => {
      const components = {
        database: { score: 100 },
      };
      const score = calculateOverallHealthScore(components);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });

    it('returns 0 for empty components', () => {
      expect(calculateOverallHealthScore({})).toBe(0);
    });
  });

  describe('determineSystemStatus()', () => {
    it('returns healthy for high score with all healthy components', () => {
      const components = {
        db: { status: 'healthy' },
        api: { status: 'healthy' },
      };
      expect(determineSystemStatus(95, components)).toEqual({
        status: 'healthy',
        color: 'green',
      });
    });

    it('returns degraded for moderate score without unhealthy components', () => {
      const components = {
        db: { status: 'healthy' },
        api: { status: 'degraded' },
      };
      expect(determineSystemStatus(75, components)).toEqual({
        status: 'degraded',
        color: 'yellow',
      });
    });

    it('returns unhealthy for low score', () => {
      const components = {
        db: { status: 'unhealthy' },
      };
      expect(determineSystemStatus(50, components)).toEqual({
        status: 'unhealthy',
        color: 'red',
      });
    });

    it('returns unhealthy when score > 90 but a component is not healthy', () => {
      const components = {
        db: { status: 'unhealthy' },
      };
      expect(determineSystemStatus(95, components).status).toBe('unhealthy');
    });
  });

  describe('calculateSystemUptime()', () => {
    it('returns 3600 (hardcoded uptime)', () => {
      expect(calculateSystemUptime()).toBe(3600);
    });
  });

  describe('assessSystemHealth()', () => {
    it('returns score 100 and healthy when all checks pass', () => {
      const result = assessSystemHealth({
        database: true,
        scraper: true,
        cache: true,
        opportunities: true,
      });
      expect(result.score).toBe(100);
      expect(result.overall).toBe('healthy');
    });

    it('returns degraded when some checks fail', () => {
      const result = assessSystemHealth({
        database: true,
        scraper: true,
        cache: false,
        opportunities: false,
      });
      expect(result.score).toBe(75);
      expect(result.overall).toBe('degraded');
    });

    it('returns unhealthy when critical checks fail', () => {
      const result = assessSystemHealth({
        database: false,
        scraper: false,
        cache: false,
        opportunities: false,
      });
      expect(result.score).toBe(20);
      expect(result.overall).toBe('unhealthy');
    });

    it('clamps score to 0 minimum', () => {
      const result = assessSystemHealth({
        database: false,
        scraper: false,
        cache: false,
        opportunities: false,
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('derived rate functions', () => {
    it('calculateRequestRate returns requests per second', () => {
      REQUEST_METRICS.total = 3600;
      expect(calculateRequestRate()).toBe(1);
    });

    it('calculateErrorRate returns 0 for no requests', () => {
      expect(calculateErrorRate()).toBe(0);
    });

    it('calculateErrorRate returns percentage', () => {
      REQUEST_METRICS.total = 100;
      REQUEST_METRICS.error = 10;
      expect(calculateErrorRate()).toBe(10);
    });

    it('calculateResponseTimeP95 returns 1.5x average', () => {
      REQUEST_METRICS.averageResponseTime = 100;
      expect(calculateResponseTimeP95()).toBe(150);
    });

    it('calculateThroughput returns success per minute', () => {
      REQUEST_METRICS.success = 60;
      expect(calculateThroughput()).toBe(1);
    });

    it('calculateAvailability returns 100 for no requests', () => {
      expect(calculateAvailability()).toBe(100);
    });

    it('calculateAvailability returns percentage', () => {
      REQUEST_METRICS.total = 100;
      REQUEST_METRICS.success = 95;
      expect(calculateAvailability()).toBe(95);
    });
  });
});

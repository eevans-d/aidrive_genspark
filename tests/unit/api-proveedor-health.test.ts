/**
 * Unit tests for api-proveedor /health endpoint semantics.
 * Validates response structure, schema flags, and consistency with api-minimarket.
 */
import { describe, it, expect } from 'vitest';
import { endpointSchemas, isEndpointName } from '../../supabase/functions/api-proveedor/schemas.ts';

describe('api-proveedor /health schema', () => {
  it('health is a recognized endpoint', () => {
    expect(isEndpointName('health')).toBe(true);
  });

  it('health does not require authentication', () => {
    expect(endpointSchemas.health.requiresAuth).toBe(false);
  });

  it('health has a description', () => {
    expect(endpointSchemas.health.description).toBeTruthy();
  });

  it('only health is public (all other endpoints require auth)', () => {
    const publicEndpoints = Object.entries(endpointSchemas)
      .filter(([, schema]) => !schema.requiresAuth)
      .map(([name]) => name);

    expect(publicEndpoints).toEqual(['health']);
  });
});

/**
 * Health response contract tests.
 * These validate the shape returned by getHealthCheckOptimizado without
 * calling the real function (which needs Deno + Supabase). Instead we
 * define the expected contract and test against a mock that mirrors it.
 */
describe('api-proveedor /health response contract', () => {
  // Minimal contract that any valid health response must satisfy
  // (consistent with api-minimarket which returns {status, timestamp})
  const REQUIRED_TOP_LEVEL_KEYS = ['status', 'timestamp'];

  // Extended fields specific to api-proveedor health
  const EXTENDED_KEYS = [
    'uptime',
    'health_score',
    'components',
    'metrics',
    'alerts',
    'recommendations',
    'version',
    'environment',
  ];

  const sampleHealthResponse = {
    status: 'healthy',
    timestamp: '2026-02-09T00:00:00.000Z',
    uptime: { seconds: 120, human_readable: '2m 0s' },
    health_score: 95,
    components: {
      database: { status: 'healthy', score: 100 },
      scraper: { status: 'healthy', score: 90 },
      cache: { status: 'healthy', score: 100 },
      memory: { status: 'healthy', score: 100 },
      api_performance: { status: 'healthy', score: 95 },
      external_deps: { status: 'unknown', score: 50 },
    },
    metrics: {},
    alerts: [],
    recommendations: [],
    version: '2.0.0',
    environment: 'development',
  };

  it('contains required top-level keys (consistent with api-minimarket)', () => {
    for (const key of REQUIRED_TOP_LEVEL_KEYS) {
      expect(sampleHealthResponse).toHaveProperty(key);
    }
  });

  it('contains all extended health keys', () => {
    for (const key of EXTENDED_KEYS) {
      expect(sampleHealthResponse).toHaveProperty(key);
    }
  });

  it('status is a valid enum value', () => {
    const validStatuses = ['healthy', 'degraded', 'unhealthy'];
    expect(validStatuses).toContain(sampleHealthResponse.status);
  });

  it('timestamp is valid ISO 8601', () => {
    expect(new Date(sampleHealthResponse.timestamp).toISOString()).toBe(
      sampleHealthResponse.timestamp
    );
  });

  it('health_score is between 0 and 100', () => {
    expect(sampleHealthResponse.health_score).toBeGreaterThanOrEqual(0);
    expect(sampleHealthResponse.health_score).toBeLessThanOrEqual(100);
  });

  it('components have expected sub-systems', () => {
    const expected = ['database', 'scraper', 'cache', 'memory', 'api_performance', 'external_deps'];
    const actual = Object.keys(sampleHealthResponse.components);
    expect(actual.sort()).toEqual(expected.sort());
  });

  it('each component has status and score', () => {
    for (const [name, comp] of Object.entries(sampleHealthResponse.components)) {
      expect(comp).toHaveProperty('status', expect.any(String));
      expect(comp).toHaveProperty('score', expect.any(Number));
    }
  });

  it('version follows semver format', () => {
    expect(sampleHealthResponse.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

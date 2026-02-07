/**
 * Tests de locking/dedupe para cron-jobs-maxiconsumo/orchestrator.ts
 *
 * Valida:
 * - Skip cuando lock no se adquiere
 * - Release del lock al finalizar
 * - Fallback "sin lock" cuando el RPC no existe (404)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mocks hoisted: deben declararse antes de importar el orquestador.
vi.mock('../../supabase/functions/_shared/circuit-breaker.ts', () => ({
  getCircuitBreaker: vi.fn(() => ({
    allowRequest: () => true,
    recordSuccess: vi.fn(),
    recordFailure: vi.fn(),
    getState: () => ({ state: 'closed' }),
  })),
}));

vi.mock('../../supabase/functions/cron-jobs-maxiconsumo/jobs/daily-price-update.ts', () => ({
  executeDailyPriceUpdate: vi.fn().mockResolvedValue({
    success: true,
    executionTimeMs: 1,
    productsProcessed: 0,
    productsSuccessful: 0,
    productsFailed: 0,
    alertsGenerated: 0,
    emailsSent: 0,
    smsSent: 0,
    metrics: {},
    errors: [],
    warnings: [],
    recommendations: [],
  }),
}));

vi.mock('../../supabase/functions/cron-jobs-maxiconsumo/jobs/weekly-analysis.ts', () => ({
  executeWeeklyAnalysis: vi.fn(),
}));
vi.mock('../../supabase/functions/cron-jobs-maxiconsumo/jobs/realtime-alerts.ts', () => ({
  executeRealtimeAlerts: vi.fn(),
}));
vi.mock('../../supabase/functions/cron-jobs-maxiconsumo/jobs/maintenance.ts', () => ({
  executeMaintenanceCleanup: vi.fn(),
}));

import { executeJob, createExecutionContext } from '../../supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts';
import { executeDailyPriceUpdate } from '../../supabase/functions/cron-jobs-maxiconsumo/jobs/daily-price-update.ts';

describe('cron-jobs-maxiconsumo/orchestrator locking', () => {
  const supabaseUrl = 'https://test.supabase.co';
  const serviceRoleKey = 'service-key';
  const jobId = 'daily_price_update';

  const mockFetch = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalFetch = (globalThis as any).fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = mockFetch;
  });

  afterEach(() => {
    // Restore global fetch to avoid cross-test pollution.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('skips si no se adquiere lock', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => false,
    });

    const ctx = createExecutionContext(jobId, 'req-1', 'scheduled');
    const result = await executeJob(jobId, ctx, supabaseUrl, serviceRoleKey, { requestId: 'req-1' });

    expect(result.success).toBe(true);
    expect(result.metrics).toMatchObject({ skipped: true, reason: 'lock_active' });
    expect(result.warnings).toContain('job_locked');
    expect(executeDailyPriceUpdate).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('adquiere y libera lock en ejecución exitosa', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => true })  // acquire
      .mockResolvedValueOnce({ ok: true, json: async () => true }); // release

    const ctx = createExecutionContext(jobId, 'req-2', 'scheduled');
    const result = await executeJob(jobId, ctx, supabaseUrl, serviceRoleKey, { requestId: 'req-2' });

    expect(result.success).toBe(true);
    expect(executeDailyPriceUpdate).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Primera llamada: acquire
    expect(mockFetch.mock.calls[0][0]).toContain('/rest/v1/rpc/sp_acquire_job_lock');
    // Segunda llamada: release
    expect(mockFetch.mock.calls[1][0]).toContain('/rest/v1/rpc/sp_release_job_lock');
  });

  it('fallback: si RPC de lock no existe (404), ejecuta job igualmente', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' }) // acquire 404
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' }); // release 404 (swallowed)

    const ctx = createExecutionContext(jobId, 'req-3', 'scheduled');
    const result = await executeJob(jobId, ctx, supabaseUrl, serviceRoleKey, { requestId: 'req-3' });

    expect(result.success).toBe(true);
    expect(executeDailyPriceUpdate).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

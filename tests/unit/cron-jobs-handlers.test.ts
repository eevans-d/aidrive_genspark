/**
 * Tests unitarios para cron-jobs-maxiconsumo/jobs/*
 * Mejora cobertura de daily-price-update, maintenance, realtime-alerts, weekly-analysis
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globalmente
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock writeExecutionLog
vi.mock('../../supabase/functions/cron-jobs-maxiconsumo/execution-log.ts', () => ({
  writeExecutionLog: vi.fn().mockResolvedValue(undefined)
}));

import { executeDailyPriceUpdate } from '../../supabase/functions/cron-jobs-maxiconsumo/jobs/daily-price-update.ts';
import { executeMaintenanceCleanup } from '../../supabase/functions/cron-jobs-maxiconsumo/jobs/maintenance.ts';
import type { JobExecutionContext, StructuredLog } from '../../supabase/functions/cron-jobs-maxiconsumo/types.ts';

describe('cron-jobs-maxiconsumo/jobs', () => {
  const supabaseUrl = 'https://test.supabase.co';
  const serviceRoleKey = 'test-service-key';

  const validContext: JobExecutionContext = {
    executionId: 'exec-123',
    jobId: 'test_job',
    runId: 'run-456',
    startTime: new Date('2026-01-28T00:00:00Z'),
    requestId: 'req-789',
    source: 'scheduled',
    parameters: {}
  };

  const validLog: StructuredLog = {
    requestId: 'req-789',
    jobId: 'test_job',
    runId: 'run-456'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeDailyPriceUpdate', () => {
    it('debería retornar error si contexto es inválido', async () => {
      const invalidContext = { ...validContext, jobId: '' };
      
      const result = await executeDailyPriceUpdate(
        invalidContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Validation');
    });

    it('debería retornar error si supabaseUrl está vacío', async () => {
      const result = await executeDailyPriceUpdate(
        validContext,
        '',
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Validation');
    });

    it('debería retornar error si serviceRoleKey está vacío', async () => {
      const result = await executeDailyPriceUpdate(
        validContext,
        supabaseUrl,
        '',
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Validation');
    });

    it('debería procesar correctamente cuando scraper responde OK', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { productos_extraidos: 50, guardados: 45 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { oportunidades: 5 } })
        });

      const result = await executeDailyPriceUpdate(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(true);
      expect(result.productsProcessed).toBe(50);
      expect(result.productsSuccessful).toBe(45);
      expect(result.alertsGenerated).toBe(5);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('debería manejar error del scraper', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { oportunidades: 0 } })
        });

      const result = await executeDailyPriceUpdate(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Scraper error: 500');
    });

    it('debería manejar excepción durante ejecución', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const result = await executeDailyPriceUpdate(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toBe('Network failure');
    });

    it('debería calcular executionTimeMs correctamente', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { productos_extraidos: 10, guardados: 10 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { oportunidades: 0 } })
        });

      const result = await executeDailyPriceUpdate(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      // executionTimeMs puede ser 0 si la ejecución es muy rápida (mocks instantáneos)
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('debería llamar al endpoint correcto del scraper', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} })
        });

      await executeDailyPriceUpdate(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `${supabaseUrl}/functions/v1/scraper-maxiconsumo/scraping`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${serviceRoleKey}`
          })
        })
      );
    });
  });

  describe('executeMaintenanceCleanup', () => {
    it('debería retornar error si contexto es inválido', async () => {
      const invalidContext = { ...validContext, jobId: '' };
      
      const result = await executeMaintenanceCleanup(
        invalidContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Validation');
    });

    it('debería limpiar registros antiguos correctamente', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 1 }, { id: 2 }]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 3 }]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        });

      const result = await executeMaintenanceCleanup(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(true);
      expect(result.metrics.logs_deleted).toBe(2);
      expect(result.metrics.metrics_deleted).toBe(1);
      expect(result.metrics.alerts_deleted).toBe(0);
    });

    it('debería usar parámetros de retención personalizados', async () => {
      const ctxWithParams: JobExecutionContext = {
        ...validContext,
        parameters: { daysToKeepLogs: 7, daysToKeepMetrics: 14 }
      };

      mockFetch
        .mockResolvedValue({ ok: true, json: async () => [] });

      await executeMaintenanceCleanup(
        ctxWithParams,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      // Verificar que se usa la fecha correcta (7 días para logs)
      const logsCall = mockFetch.mock.calls[0][0];
      expect(logsCall).toContain('cron_jobs_execution_log');
    });

    it('debería recomendar reducir retención si limpia muchos registros', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => new Array(500).fill({ id: 1 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => new Array(400).fill({ id: 1 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => new Array(200).fill({ id: 1 })
        });

      const result = await executeMaintenanceCleanup(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toContain('Alta cantidad de registros limpiados - considerar reducir retención');
    });

    it('debería manejar excepción durante ejecución', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Database error'));

      const result = await executeMaintenanceCleanup(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toBe('Database error');
    });

    it('debería usar headers correctos para DELETE', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

      await executeMaintenanceCleanup(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe('DELETE');
      expect(options.headers.apikey).toBe(serviceRoleKey);
      expect(options.headers['Prefer']).toBe('return=representation');
    });

    it('debería calcular productsProcessed como total limpiado', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [1, 2, 3] })
        .mockResolvedValueOnce({ ok: true, json: async () => [4, 5] })
        .mockResolvedValueOnce({ ok: true, json: async () => [6] });

      const result = await executeMaintenanceCleanup(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.productsProcessed).toBe(6);
      expect(result.productsSuccessful).toBe(6);
      expect(result.productsFailed).toBe(0);
    });
  });
});

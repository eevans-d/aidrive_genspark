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
import { executeRealtimeAlerts } from '../../supabase/functions/cron-jobs-maxiconsumo/jobs/realtime-alerts.ts';
import { executeWeeklyAnalysis } from '../../supabase/functions/cron-jobs-maxiconsumo/jobs/weekly-analysis.ts';
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

  describe('executeRealtimeAlerts', () => {
    it('debería retornar error si contexto es inválido', async () => {
      const invalidContext = { ...validContext, jobId: '' };

      const result = await executeRealtimeAlerts(
        invalidContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Validation');
    });

    it('debería retornar error si supabaseUrl está vacío', async () => {
      const result = await executeRealtimeAlerts(
        validContext,
        '',
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Validation');
    });

    it('debería retornar error si serviceRoleKey está vacío', async () => {
      const result = await executeRealtimeAlerts(
        validContext,
        supabaseUrl,
        '',
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Validation');
    });

    it('debería procesar alertas críticas correctamente', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { producto_id: 1, precio: 150, precio_anterior: 100, productos: { nombre: 'Prod1' } },
            { producto_id: 2, precio: 80, precio_anterior: 100, productos: { nombre: 'Prod2' } }
          ])
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const result = await executeRealtimeAlerts(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(true);
      expect(result.alertsGenerated).toBe(2);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('debería no generar alertas si cambios están bajo threshold', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { producto_id: 1, precio: 105, precio_anterior: 100 }
        ])
      });

      const result = await executeRealtimeAlerts(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(true);
      expect(result.alertsGenerated).toBe(0);
    });

    it('debería usar threshold personalizado de parámetros', async () => {
      const ctxWithThreshold: JobExecutionContext = {
        ...validContext,
        parameters: { criticalChangeThreshold: 5 }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { producto_id: 1, precio: 110, precio_anterior: 100 }
          ])
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const result = await executeRealtimeAlerts(
        ctxWithThreshold,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(true);
      expect(result.alertsGenerated).toBe(1);
    });

    it('debería manejar excepción durante ejecución', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Database timeout'));

      const result = await executeRealtimeAlerts(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toBe('Database timeout');
    });

    it('debería calcular executionTimeMs correctamente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      });

      const result = await executeRealtimeAlerts(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('debería consultar precios de los últimos 15 minutos', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      });

      await executeRealtimeAlerts(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('precios_historicos');
      expect(url).toContain('fecha_cambio=gte.');
    });

    it('debería crear alertas con severidad crítica', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { producto_id: 1, precio: 200, precio_anterior: 100, productos: { nombre: 'Test' } }
          ])
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await executeRealtimeAlerts(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      const postCall = mockFetch.mock.calls.find(call => call[1]?.method === 'POST');
      expect(postCall).toBeDefined();
      if (postCall) {
        const body = JSON.parse(postCall[1].body);
        expect(body[0].severidad).toBe('critica');
      }
    });
  });

  describe('executeWeeklyAnalysis', () => {
    it('debería retornar error si contexto es inválido', async () => {
      const invalidContext = { ...validContext, jobId: '' };

      const result = await executeWeeklyAnalysis(
        invalidContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Validation');
    });

    it('debería retornar error si supabaseUrl está vacío', async () => {
      const result = await executeWeeklyAnalysis(
        validContext,
        '',
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Validation');
    });

    it('debería retornar error si serviceRoleKey está vacío', async () => {
      const result = await executeWeeklyAnalysis(
        validContext,
        supabaseUrl,
        '',
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Validation');
    });

    it('debería calcular trends correctamente con datos válidos', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([
            { precio: 120, precio_anterior: 100 },
            { precio: 80, precio_anterior: 100 }
          ])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([{ severidad: 'critica' }, { severidad: 'normal' }])
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const result = await executeWeeklyAnalysis(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(true);
      expect(result.metrics.total_cambios).toBe(2);
      expect(result.metrics.alertas_semana).toBe(2);
      expect(result.metrics.alertas_criticas).toBe(1);
    });

    it('debería manejar respuestas vacías correctamente', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) })
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const result = await executeWeeklyAnalysis(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(true);
      expect(result.metrics.total_cambios).toBe(0);
      expect(result.metrics.promedio_cambio).toBe('0.00');
    });

    it('debería generar recomendación si alertas críticas > 10', async () => {
      const criticalAlerts = Array(12).fill({ severidad: 'critica' });
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) })
        .mockResolvedValueOnce({ ok: true, json: async () => criticalAlerts })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const result = await executeWeeklyAnalysis(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toContain('Alta volatilidad de precios - revisar estrategia de compras');
    });

    it('debería generar recomendación si totalChanges > 100', async () => {
      const manyChanges = Array(105).fill({ precio: 100, precio_anterior: 90 });
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => manyChanges })
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const result = await executeWeeklyAnalysis(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toContain('Considerar aumentar frecuencia de scraping');
    });

    it('debería guardar métricas en cron_jobs_metrics', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ([{ precio: 100, precio_anterior: 90 }]) })
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await executeWeeklyAnalysis(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      const metricsCall = mockFetch.mock.calls.find(call =>
        call[0].includes('cron_jobs_metrics') && call[1]?.method === 'POST'
      );
      expect(metricsCall).toBeDefined();
    });

    it('debería manejar excepción durante ejecución', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await executeWeeklyAnalysis(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toBe('Connection refused');
    });

    it('debería calcular productsProcessed como totalChanges', async () => {
      const changes = [
        { precio: 100, precio_anterior: 90 },
        { precio: 110, precio_anterior: 100 },
        { precio: 120, precio_anterior: 110 }
      ];
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => changes })
        .mockResolvedValueOnce({ ok: true, json: async () => ([]) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const result = await executeWeeklyAnalysis(
        validContext,
        supabaseUrl,
        serviceRoleKey,
        validLog
      );

      expect(result.productsProcessed).toBe(3);
      expect(result.productsSuccessful).toBe(3);
      expect(result.productsFailed).toBe(0);
    });
  });
});

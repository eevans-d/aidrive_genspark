/**
 * Tests unitarios para cron-jobs-maxiconsumo/execution-log.ts
 * Mejora cobertura de writeExecutionLog y funciones de validación
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globalmente
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import después del mock
import { writeExecutionLog } from '../../supabase/functions/cron-jobs-maxiconsumo/execution-log.ts';
import type { JobExecutionContext, StructuredLog } from '../../supabase/functions/cron-jobs-maxiconsumo/types.ts';

describe('execution-log', () => {
  const supabaseUrl = 'https://test.supabase.co';
  const serviceRoleKey = 'test-service-key';

  const validContext: JobExecutionContext = {
    executionId: 'exec-123',
    jobId: 'daily_price_update',
    runId: 'run-456',
    startTime: new Date('2026-01-28T00:00:00Z'),
    requestId: 'req-789',
    source: 'scheduled',
    parameters: { daysToKeepLogs: 30 }
  };

  const validLog: StructuredLog = {
    requestId: 'req-789',
    jobId: 'daily_price_update',
    runId: 'run-456'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('writeExecutionLog', () => {
    it('debería escribir un log exitoso correctamente', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 1000,
        endTimeMs: Date.now(),
        estado: 'exitoso',
        resultado: { processed: 100 },
        metrics: {
          productosProcesados: 100,
          productosExitosos: 95,
          productosFallidos: 5,
          alertasGeneradas: 10,
          emailsEnviados: 2,
          smsEnviados: 0
        },
        logMeta: validLog
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(`${supabaseUrl}/rest/v1/cron_jobs_execution_log`);
      expect(options.method).toBe('POST');
      
      const body = JSON.parse(options.body);
      expect(body.job_id).toBe('daily_price_update');
      expect(body.estado).toBe('exitoso');
      expect(body.productos_procesados).toBe(100);
      expect(body.productos_exitosos).toBe(95);
      expect(body.productos_fallidos).toBe(5);
      expect(body.alertas_generadas).toBe(10);
    });

    it('debería normalizar estados válidos en inglés', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'success',
        logMeta: validLog
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.estado).toBe('exitoso');
    });

    it('debería normalizar estado "failed" a "fallido"', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'failed',
        errorMessage: 'Test error',
        logMeta: validLog
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.estado).toBe('fallido');
      expect(body.error_message).toBe('Test error');
    });

    it('debería normalizar estado "partial" a "parcial"', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'partial',
        logMeta: validLog
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.estado).toBe('parcial');
    });

    it('debería manejar estados inválidos como fallido', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'invalid_status',
        logMeta: validLog
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.estado).toBe('fallido');
      expect(body.error_message).toContain('validation_errors');
    });

    it('debería convertir métricas negativas a cero', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'exitoso',
        metrics: {
          productosProcesados: -10,
          productosExitosos: -5,
          productosFallidos: NaN
        },
        logMeta: validLog
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.productos_procesados).toBe(0);
      expect(body.productos_exitosos).toBe(0);
      expect(body.productos_fallidos).toBe(0);
    });

    it('debería truncar métricas decimales', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'exitoso',
        metrics: {
          productosProcesados: 10.9,
          productosExitosos: 5.1
        },
        logMeta: validLog
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.productos_procesados).toBe(10);
      expect(body.productos_exitosos).toBe(5);
    });

    it('debería calcular duración correctamente', async () => {
      const start = Date.now() - 1500;
      const end = Date.now();

      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: start,
        endTimeMs: end,
        estado: 'exitoso',
        logMeta: validLog
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.duracion_ms).toBeGreaterThanOrEqual(1400);
      expect(body.duracion_ms).toBeLessThanOrEqual(1600);
    });

    it('debería incluir execution_id y request_id', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'exitoso',
        logMeta: validLog
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.execution_id).toBe('exec-123');
      expect(body.request_id).toBe('req-789');
    });

    it('debería manejar errores de fetch sin lanzar excepción', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // No debería lanzar
      await expect(writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'exitoso',
        logMeta: validLog
      })).resolves.toBeUndefined();
    });

    it('debería manejar respuestas no-ok sin lanzar excepción', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' });

      await expect(writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'exitoso',
        logMeta: validLog
      })).resolves.toBeUndefined();
    });

    it('debería usar parámetros del contexto si no se proporcionan', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'exitoso'
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.parametros_ejecucion).toEqual({ daysToKeepLogs: 30 });
    });

    it('debería incluir memory_usage_start si se proporciona', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'exitoso',
        metrics: {
          memoryUsageStart: 1024000
        },
        logMeta: validLog
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.memory_usage_start).toBe(1024000);
    });

    it('debería incluir resultado personalizado', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'exitoso',
        resultado: { custom: 'data', count: 42 },
        logMeta: validLog
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.resultado).toEqual({ custom: 'data', count: 42 });
    });

    it('debería manejar contexto con userId opcional', async () => {
      const ctxWithUser: JobExecutionContext = {
        ...validContext,
        userId: 'user-abc'
      };

      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: ctxWithUser,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'exitoso',
        logMeta: validLog
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('debería validar job_id vacío como error', async () => {
      const ctxBadJobId: JobExecutionContext = {
        ...validContext,
        jobId: ''
      };

      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: ctxBadJobId,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'exitoso',
        logMeta: validLog
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.estado).toBe('fallido');
      expect(body.error_message).toContain('job_id requerido');
    });

    it('debería enviar headers de autorización correctos', async () => {
      await writeExecutionLog(supabaseUrl, serviceRoleKey, {
        ctx: validContext,
        startTimeMs: Date.now() - 500,
        endTimeMs: Date.now(),
        estado: 'exitoso',
        logMeta: validLog
      });

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers.apikey).toBe(serviceRoleKey);
      expect(options.headers.Authorization).toBe(`Bearer ${serviceRoleKey}`);
      expect(options.headers['Content-Type']).toBe('application/json');
    });
  });
});

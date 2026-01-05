/**
 * Tests para módulos de cron-jobs-maxiconsumo
 */
import { describe, it, expect } from 'vitest';
import {
  getJobConfig,
  getActiveJobs
} from '../../supabase/functions/cron-jobs-maxiconsumo/config.ts';
import {
  generateRunId,
  createExecutionContext
} from '../../supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts';

describe('cron-jobs-maxiconsumo/config', () => {
  describe('getJobConfig', () => {
    it('retorna config para job existente', () => {
      const config = getJobConfig('daily_price_update');
      expect(config).toBeDefined();
      expect(config?.jobId).toBe('daily_price_update');
      expect(config?.type).toBe('diario');
    });

    it('retorna undefined para job inexistente', () => {
      expect(getJobConfig('nonexistent')).toBeUndefined();
    });
  });

  describe('getActiveJobs', () => {
    it('retorna solo jobs activos', () => {
      const active = getActiveJobs();
      expect(active.length).toBe(4);
      expect(active.every(j => j.active)).toBe(true);
    });

    it('incluye daily_price_update', () => {
      const active = getActiveJobs();
      expect(active.find(j => j.jobId === 'daily_price_update')).toBeDefined();
    });
  });
});

describe('cron-jobs-maxiconsumo/orchestrator', () => {
  describe('generateRunId', () => {
    it('genera IDs únicos', () => {
      const id1 = generateRunId();
      const id2 = generateRunId();
      expect(id1).not.toBe(id2);
    });

    it('tiene formato correcto', () => {
      const id = generateRunId();
      expect(id).toMatch(/^run_\d+_[a-z0-9]+$/);
    });
  });

  describe('createExecutionContext', () => {
    it('crea contexto con campos requeridos', () => {
      const ctx = createExecutionContext('daily_price_update', 'req123', 'api');
      expect(ctx.jobId).toBe('daily_price_update');
      expect(ctx.requestId).toBe('req123');
      expect(ctx.source).toBe('api');
      expect(ctx.runId).toMatch(/^run_/);
      expect(ctx.executionId.length).toBeGreaterThan(10);
      expect(ctx.startTime).toBeInstanceOf(Date);
    });

    it('mergea parametros de config y params', () => {
      const ctx = createExecutionContext('daily_price_update', 'req456', 'manual', { custom: true });
      expect(ctx.parameters).toHaveProperty('categories');
      expect(ctx.parameters).toHaveProperty('custom', true);
    });
  });
});

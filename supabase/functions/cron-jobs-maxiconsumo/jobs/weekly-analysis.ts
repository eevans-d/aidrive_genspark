/**
 * Job: Análisis semanal de tendencias
 * @module cron-jobs-maxiconsumo/jobs/weekly-analysis
 */

import type { JobExecutionContext, JobResult, StructuredLog } from '../types.ts';
import { createLogger } from '../../_shared/logger.ts';
import { writeExecutionLog } from '../execution-log.ts';
import { validateJobContext, validateEnvVars, ValidationError } from '../validators.ts';

const logger = createLogger('cron-jobs-maxiconsumo:job:weekly-analysis');

type PriceChangeRow = {
  precio?: number | null;
  precio_nuevo?: number | null;
  precio_anterior?: number | null;
};

type AlertRow = {
  severidad?: string | null;
};

function normalizeBatchSize(parameters: Record<string, unknown>): number {
  const raw = Number(parameters.batchSize ?? parameters.batch_size ?? 500);
  if (!Number.isFinite(raw) || raw <= 0) return 500;
  return Math.min(Math.floor(raw), 5000);
}

function normalizeMaxRows(parameters: Record<string, unknown>): number {
  const raw = Number(parameters.maxRows ?? parameters.max_rows ?? 50000);
  if (!Number.isFinite(raw) || raw <= 0) return 50000;
  return Math.min(Math.floor(raw), 500000);
}

async function fetchPaged<T>(
  baseUrl: string,
  batchSize: number,
  headers: Record<string, string>,
  maxRows: number,
): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;

  while (true) {
    const url = `${baseUrl}&limit=${batchSize}&offset=${offset}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Paged fetch failed (${response.status}) for ${baseUrl}`);
    }

    const page = await response.json() as T[];
    if (!Array.isArray(page)) break;

    results.push(...page);
    if (results.length >= maxRows) break;
    if (page.length < batchSize) break;
    offset += batchSize;
  }

  return results.slice(0, maxRows);
}

function computeAbsoluteChange(row: PriceChangeRow): number {
  const current = row.precio_nuevo ?? row.precio;
  const previous = row.precio_anterior ?? current;

  if (typeof current !== 'number' || !Number.isFinite(current)) return 0;
  if (typeof previous !== 'number' || !Number.isFinite(previous)) return 0;
  return Math.abs(current - previous);
}

export async function executeWeeklyAnalysis(
  ctx: JobExecutionContext,
  supabaseUrl: string,
  serviceRoleKey: string,
  log: StructuredLog
): Promise<JobResult> {
  // Validación runtime de inputs
  try {
    validateJobContext(ctx);
    validateEnvVars(supabaseUrl, serviceRoleKey);
  } catch (e) {
    if (e instanceof ValidationError) {
      logger.error('VALIDATION_FAILED', { field: e.field, reason: e.reason });
      return {
        success: false, executionTimeMs: 0,
        productsProcessed: 0, productsSuccessful: 0, productsFailed: 0,
        alertsGenerated: 0, emailsSent: 0, smsSent: 0,
        metrics: {}, errors: [`Validation: ${e.message}`], warnings: [], recommendations: []
      };
    }
    throw e;
  }

  const jobLog = { ...log, jobId: ctx.jobId, runId: ctx.runId };
  logger.info('JOB_START', jobLog);

  const startTime = Date.now();
  const errors: string[] = [], warnings: string[] = [], recommendations: string[] = [];

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const parameters = ctx.parameters as Record<string, unknown>;
    const batchSize = normalizeBatchSize(parameters);
    const maxRows = normalizeMaxRows(parameters);
    const authHeaders = { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` };

    // 1. Fetch weekly data in pages to avoid high-memory spikes/timeouts.
    const [prices, alerts] = await Promise.all([
      fetchPaged<PriceChangeRow>(
        `${supabaseUrl}/rest/v1/precios_historicos?select=precio_nuevo,precio_anterior&fecha_cambio=gte.${weekAgo}`,
        batchSize,
        authHeaders,
        maxRows,
      ),
      fetchPaged<AlertRow>(
        `${supabaseUrl}/rest/v1/alertas_cambios_precios?select=severidad&fecha_alerta=gte.${weekAgo}`,
        batchSize,
        authHeaders,
        maxRows,
      ),
    ]);

    // 2. Calculate trends
    const totalChanges = prices.length;
    const avgChange = prices.length > 0
      ? prices.reduce((sum: number, p: PriceChangeRow) => sum + computeAbsoluteChange(p), 0) / prices.length
      : 0;

    const trends = {
      total_cambios: totalChanges,
      promedio_cambio: avgChange.toFixed(2),
      alertas_semana: alerts.length,
      alertas_criticas: alerts.filter((a: any) => a.severidad === 'critica').length
    };

    logger.info('TRENDS_CALCULATED', { ...jobLog, trends });

    // 3. Generate recommendations
    if (trends.alertas_criticas > 10) {
      recommendations.push('Alta volatilidad de precios - revisar estrategia de compras');
    }
    if (totalChanges > 100) {
      recommendations.push('Considerar aumentar frecuencia de scraping');
    }

    // 4. Save analysis
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const fechaMetricas = new Date().toISOString().split('T')[0];
    await fetch(`${supabaseUrl}/rest/v1/cron_jobs_metrics`, {
      method: 'POST',
      headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: ctx.jobId,
        fecha_metricas: fechaMetricas,
        ejecuciones_totales: 1,
        disponibilidad_porcentual: 100,
        tiempo_promedio_ms: durationMs,
        alertas_generadas_total: trends.alertas_semana,
        created_at: new Date().toISOString()
      })
    });

    // 5. Log execution
    await writeExecutionLog(supabaseUrl, serviceRoleKey, {
      ctx,
      startTimeMs: startTime,
      endTimeMs: endTime,
      estado: 'exitoso',
      resultado: { runId: ctx.runId, trends, recommendations },
      metrics: {
        productosProcesados: totalChanges,
        productosExitosos: totalChanges,
        productosFallidos: 0,
        alertasGeneradas: trends.alertas_semana,
        emailsEnviados: 0,
        smsEnviados: 0
      },
      logMeta: jobLog
    });

    logger.info('JOB_COMPLETE', { ...jobLog, trends, duration: durationMs });

    return {
      success: true, executionTimeMs: durationMs,
      productsProcessed: totalChanges, productsSuccessful: totalChanges, productsFailed: 0,
      alertsGenerated: 0, emailsSent: 0, smsSent: 0,
      metrics: trends, errors, warnings, recommendations
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error('JOB_ERROR', { ...jobLog, error: errorMessage });
    const endTime = Date.now();
    await writeExecutionLog(supabaseUrl, serviceRoleKey, {
      ctx,
      startTimeMs: startTime,
      endTimeMs: endTime,
      estado: 'fallido',
      errorMessage,
      resultado: { runId: ctx.runId, recommendations },
      metrics: {
        productosProcesados: 0,
        productosExitosos: 0,
        productosFallidos: 0,
        alertasGeneradas: 0,
        emailsEnviados: 0,
        smsEnviados: 0
      },
      logMeta: jobLog
    });
    return {
      success: false, executionTimeMs: Date.now() - startTime,
      productsProcessed: 0, productsSuccessful: 0, productsFailed: 0,
      alertsGenerated: 0, emailsSent: 0, smsSent: 0,
      metrics: {}, errors: [errorMessage], warnings, recommendations
    };
  }
}

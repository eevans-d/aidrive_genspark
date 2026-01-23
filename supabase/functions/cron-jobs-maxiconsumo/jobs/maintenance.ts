/**
 * Job: Mantenimiento del sistema
 * @module cron-jobs-maxiconsumo/jobs/maintenance
 */

import type { JobExecutionContext, JobResult, StructuredLog } from '../types.ts';
import { createLogger } from '../../_shared/logger.ts';
import { writeExecutionLog } from '../execution-log.ts';
import { validateJobContext, validateEnvVars, ValidationError, isPositiveNumber } from '../validators.ts';

const logger = createLogger('cron-jobs-maxiconsumo:job:maintenance');

export async function executeMaintenanceCleanup(
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
  const metrics: Record<string, number> = {};

  try {
    const daysLogs = (ctx.parameters.daysToKeepLogs as number) || 30;
    const daysMetrics = (ctx.parameters.daysToKeepMetrics as number) || 90;

    // 1. Clean old execution logs
    const logsDate = new Date(Date.now() - daysLogs * 24 * 60 * 60 * 1000).toISOString();
    const logsRes = await fetch(
      `${supabaseUrl}/rest/v1/cron_jobs_execution_log?created_at=lt.${logsDate}`,
      {
        method: 'DELETE',
        headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Prefer': 'return=representation' }
      }
    );
    metrics.logs_deleted = logsRes.ok ? (await logsRes.json()).length : 0;
    logger.info('LOGS_CLEANED', { ...jobLog, count: metrics.logs_deleted });

    // 2. Clean old metrics
    const metricsDate = new Date(Date.now() - daysMetrics * 24 * 60 * 60 * 1000).toISOString();
    const metricsRes = await fetch(
      `${supabaseUrl}/rest/v1/cron_jobs_metrics?created_at=lt.${metricsDate}`,
      {
        method: 'DELETE',
        headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Prefer': 'return=representation' }
      }
    );
    metrics.metrics_deleted = metricsRes.ok ? (await metricsRes.json()).length : 0;

    // 3. Clean old processed alerts
    const alertsDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const alertsRes = await fetch(
      `${supabaseUrl}/rest/v1/alertas_cambios_precios?procesada=eq.true&fecha_alerta=lt.${alertsDate}`,
      {
        method: 'DELETE',
        headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Prefer': 'return=representation' }
      }
    );
    metrics.alerts_deleted = alertsRes.ok ? (await alertsRes.json()).length : 0;

    // 4. Recommendations
    const totalCleaned = metrics.logs_deleted + metrics.metrics_deleted + metrics.alerts_deleted;
    if (totalCleaned > 1000) {
      recommendations.push('Alta cantidad de registros limpiados - considerar reducir retención');
    }

    // 5. Log execution
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    await writeExecutionLog(supabaseUrl, serviceRoleKey, {
      ctx,
      startTimeMs: startTime,
      endTimeMs: endTime,
      estado: 'exitoso',
      resultado: { runId: ctx.runId, metrics, recommendations },
      metrics: {
        productosProcesados: totalCleaned,
        productosExitosos: totalCleaned,
        productosFallidos: 0,
        alertasGeneradas: 0,
        emailsEnviados: 0,
        smsEnviados: 0
      },
      logMeta: jobLog
    });

    logger.info('JOB_COMPLETE', { ...jobLog, metrics, duration: durationMs });

    return {
      success: true, executionTimeMs: durationMs,
      productsProcessed: totalCleaned, productsSuccessful: totalCleaned, productsFailed: 0,
      alertsGenerated: 0, emailsSent: 0, smsSent: 0,
      metrics, errors, warnings, recommendations
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
      resultado: { runId: ctx.runId, metrics, recommendations },
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
      metrics, errors: [errorMessage], warnings, recommendations
    };
  }
}

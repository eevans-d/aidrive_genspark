/**
 * Job: Mantenimiento del sistema
 * @module cron-jobs-maxiconsumo/jobs/maintenance
 */

import type { JobExecutionContext, JobResult, StructuredLog } from '../types.ts';

export async function executeMaintenanceCleanup(
  ctx: JobExecutionContext,
  supabaseUrl: string,
  serviceRoleKey: string,
  log: StructuredLog
): Promise<JobResult> {
  const jobLog = { ...log, jobId: ctx.jobId, runId: ctx.runId, event: 'JOB_START' };
  console.log(JSON.stringify(jobLog));

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
    console.log(JSON.stringify({ ...jobLog, event: 'LOGS_CLEANED', count: metrics.logs_deleted }));

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
    await fetch(`${supabaseUrl}/rest/v1/cron_jobs_execution_log`, {
      method: 'POST',
      headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: ctx.jobId,
        execution_id: ctx.executionId,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        duracion_ms: durationMs,
        estado: 'success',
        request_id: ctx.requestId,
        parametros_ejecucion: ctx.parameters,
        resultado: { runId: ctx.runId, metrics, recommendations },
        productos_procesados: totalCleaned,
        productos_exitosos: totalCleaned,
        productos_fallidos: 0,
        alertas_generadas: 0,
        emails_enviados: 0,
        sms_enviados: 0
      })
    });

    console.log(JSON.stringify({ ...jobLog, event: 'JOB_COMPLETE', metrics, duration: durationMs }));

    return {
      success: true, executionTimeMs: durationMs,
      productsProcessed: totalCleaned, productsSuccessful: totalCleaned, productsFailed: 0,
      alertsGenerated: 0, emailsSent: 0, smsSent: 0,
      metrics, errors, warnings, recommendations
    };
  } catch (e) {
    console.error(JSON.stringify({ ...jobLog, event: 'JOB_ERROR', error: (e as Error).message }));
    return {
      success: false, executionTimeMs: Date.now() - startTime,
      productsProcessed: 0, productsSuccessful: 0, productsFailed: 0,
      alertsGenerated: 0, emailsSent: 0, smsSent: 0,
      metrics, errors: [(e as Error).message], warnings, recommendations
    };
  }
}

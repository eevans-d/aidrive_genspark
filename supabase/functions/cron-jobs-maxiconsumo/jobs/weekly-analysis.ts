/**
 * Job: Análisis semanal de tendencias
 * @module cron-jobs-maxiconsumo/jobs/weekly-analysis
 */

import type { JobExecutionContext, JobResult, StructuredLog } from '../types.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('cron-jobs-maxiconsumo:job:weekly-analysis');

export async function executeWeeklyAnalysis(
  ctx: JobExecutionContext,
  supabaseUrl: string,
  serviceRoleKey: string,
  log: StructuredLog
): Promise<JobResult> {
  const jobLog = { ...log, jobId: ctx.jobId, runId: ctx.runId };
  logger.info('JOB_START', jobLog);

  const startTime = Date.now();
  const errors: string[] = [], warnings: string[] = [], recommendations: string[] = [];

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch weekly data
    const [pricesRes, alertsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/precios_historicos?select=*&fecha_cambio=gte.${weekAgo}`, {
        headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
      }),
      fetch(`${supabaseUrl}/rest/v1/alertas_cambios_precios?select=*&fecha_alerta=gte.${weekAgo}`, {
        headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
      })
    ]);

    const prices = pricesRes.ok ? await pricesRes.json() : [];
    const alerts = alertsRes.ok ? await alertsRes.json() : [];

    // 2. Calculate trends
    const totalChanges = prices.length;
    const avgChange = prices.length > 0 
      ? prices.reduce((sum: number, p: any) => sum + Math.abs(p.precio - (p.precio_anterior || p.precio)), 0) / prices.length 
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
        resultado: { runId: ctx.runId, trends, recommendations },
        productos_procesados: totalChanges,
        productos_exitosos: totalChanges,
        productos_fallidos: 0,
        alertas_generadas: trends.alertas_semana,
        emails_enviados: 0,
        sms_enviados: 0
      })
    });

    logger.info('JOB_COMPLETE', { ...jobLog, trends, duration: durationMs });

    return {
      success: true, executionTimeMs: durationMs,
      productsProcessed: totalChanges, productsSuccessful: totalChanges, productsFailed: 0,
      alertsGenerated: 0, emailsSent: 0, smsSent: 0,
      metrics: trends, errors, warnings, recommendations
    };
  } catch (e) {
    logger.error('JOB_ERROR', { ...jobLog, error: (e as Error).message });
    return {
      success: false, executionTimeMs: Date.now() - startTime,
      productsProcessed: 0, productsSuccessful: 0, productsFailed: 0,
      alertsGenerated: 0, emailsSent: 0, smsSent: 0,
      metrics: {}, errors: [(e as Error).message], warnings, recommendations
    };
  }
}

/**
 * Job: Análisis semanal de tendencias
 * @module cron-jobs-maxiconsumo/jobs/weekly-analysis
 */

import type { JobExecutionContext, JobResult, StructuredLog } from '../types.ts';

export async function executeWeeklyAnalysis(
  ctx: JobExecutionContext,
  supabaseUrl: string,
  serviceRoleKey: string,
  log: StructuredLog
): Promise<JobResult> {
  const jobLog = { ...log, jobId: ctx.jobId, runId: ctx.runId, event: 'JOB_START' };
  console.log(JSON.stringify(jobLog));

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

    console.log(JSON.stringify({ ...jobLog, event: 'TRENDS_CALCULATED', trends }));

    // 3. Generate recommendations
    if (trends.alertas_criticas > 10) {
      recommendations.push('Alta volatilidad de precios - revisar estrategia de compras');
    }
    if (totalChanges > 100) {
      recommendations.push('Considerar aumentar frecuencia de scraping');
    }

    // 4. Save analysis
    await fetch(`${supabaseUrl}/rest/v1/cron_jobs_metrics`, {
      method: 'POST',
      headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: ctx.jobId, run_id: ctx.runId, metric_type: 'weekly_analysis',
        metric_data: trends, created_at: new Date().toISOString()
      })
    });

    // 5. Log execution
    await fetch(`${supabaseUrl}/rest/v1/cron_jobs_execution_log`, {
      method: 'POST',
      headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: ctx.jobId, run_id: ctx.runId, status: 'success',
        execution_time_ms: Date.now() - startTime, metadata: trends
      })
    });

    console.log(JSON.stringify({ ...jobLog, event: 'JOB_COMPLETE', trends, duration: Date.now() - startTime }));

    return {
      success: true, executionTimeMs: Date.now() - startTime,
      productsProcessed: totalChanges, productsSuccessful: totalChanges, productsFailed: 0,
      alertsGenerated: 0, emailsSent: 0, smsSent: 0,
      metrics: trends, errors, warnings, recommendations
    };
  } catch (e) {
    console.error(JSON.stringify({ ...jobLog, event: 'JOB_ERROR', error: (e as Error).message }));
    return {
      success: false, executionTimeMs: Date.now() - startTime,
      productsProcessed: 0, productsSuccessful: 0, productsFailed: 0,
      alertsGenerated: 0, emailsSent: 0, smsSent: 0,
      metrics: {}, errors: [(e as Error).message], warnings, recommendations
    };
  }
}

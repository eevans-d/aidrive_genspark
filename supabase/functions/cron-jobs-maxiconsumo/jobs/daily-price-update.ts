/**
 * Job: Actualización diaria de precios
 * @module cron-jobs-maxiconsumo/jobs/daily-price-update
 */

import type { JobExecutionContext, JobResult, StructuredLog } from '../types.ts';

export async function executeDailyPriceUpdate(
  ctx: JobExecutionContext,
  supabaseUrl: string,
  serviceRoleKey: string,
  log: StructuredLog
): Promise<JobResult> {
  const jobLog = { ...log, jobId: ctx.jobId, runId: ctx.runId, event: 'JOB_START' };
  console.log(JSON.stringify(jobLog));

  const startTime = Date.now();
  const errors: string[] = [], warnings: string[] = [], recommendations: string[] = [];
  let processed = 0, successful = 0, failed = 0, alerts = 0;

  try {
    // 1. Trigger scraper
    const scraperRes = await fetch(`${supabaseUrl}/functions/v1/scraper-maxiconsumo/scraping`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'cron', jobId: ctx.jobId, runId: ctx.runId })
    });

    if (scraperRes.ok) {
      const data = await scraperRes.json();
      processed = data.data?.productos_extraidos || 0;
      successful = data.data?.guardados || 0;
      console.log(JSON.stringify({ ...jobLog, event: 'SCRAPING_COMPLETE', processed, successful }));
    } else {
      errors.push(`Scraper error: ${scraperRes.status}`);
    }

    // 2. Run comparison
    const compRes = await fetch(`${supabaseUrl}/functions/v1/scraper-maxiconsumo/comparacion`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' }
    });

    if (compRes.ok) {
      const data = await compRes.json();
      alerts = data.data?.oportunidades || 0;
      if (alerts > 0) recommendations.push(`${alerts} oportunidades de ahorro detectadas`);
    }

    // 3. Log execution
    await fetch(`${supabaseUrl}/rest/v1/cron_jobs_execution_log`, {
      method: 'POST',
      headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: ctx.jobId, run_id: ctx.runId, status: errors.length === 0 ? 'success' : 'partial',
        productos_procesados: processed, alertas_generadas: alerts,
        execution_time_ms: Date.now() - startTime, errors, warnings
      })
    });

    console.log(JSON.stringify({ ...jobLog, event: 'JOB_COMPLETE', processed, alerts, duration: Date.now() - startTime }));

    return {
      success: errors.length === 0,
      executionTimeMs: Date.now() - startTime,
      productsProcessed: processed, productsSuccessful: successful, productsFailed: failed,
      alertsGenerated: alerts, emailsSent: 0, smsSent: 0,
      metrics: { scraped: processed, compared: alerts },
      errors, warnings, recommendations
    };
  } catch (e) {
    console.error(JSON.stringify({ ...jobLog, event: 'JOB_ERROR', error: (e as Error).message }));
    return {
      success: false, executionTimeMs: Date.now() - startTime,
      productsProcessed: processed, productsSuccessful: successful, productsFailed: failed,
      alertsGenerated: alerts, emailsSent: 0, smsSent: 0,
      metrics: {}, errors: [(e as Error).message], warnings, recommendations
    };
  }
}

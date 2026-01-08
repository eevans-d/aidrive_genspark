/**
 * Job: Actualización diaria de precios
 * @module cron-jobs-maxiconsumo/jobs/daily-price-update
 */

import type { JobExecutionContext, JobResult, StructuredLog } from '../types.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('cron-jobs-maxiconsumo:job:daily-price-update');

export async function executeDailyPriceUpdate(
  ctx: JobExecutionContext,
  supabaseUrl: string,
  serviceRoleKey: string,
  log: StructuredLog
): Promise<JobResult> {
  const jobLog = { ...log, jobId: ctx.jobId, runId: ctx.runId };
  logger.info('JOB_START', jobLog);

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
      logger.info('SCRAPING_COMPLETE', { ...jobLog, processed, successful });
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
        estado: errors.length === 0 ? 'success' : 'partial',
        request_id: ctx.requestId,
        parametros_ejecucion: ctx.parameters,
        resultado: { runId: ctx.runId, processed, successful, failed, alerts, warnings, recommendations },
        error_message: errors.length > 0 ? errors.join(' | ') : null,
        productos_procesados: processed,
        productos_exitosos: successful,
        productos_fallidos: failed,
        alertas_generadas: alerts,
        emails_enviados: 0,
        sms_enviados: 0
      })
    });

    logger.info('JOB_COMPLETE', { ...jobLog, processed, alerts, duration: durationMs });

    return {
      success: errors.length === 0,
      executionTimeMs: durationMs,
      productsProcessed: processed, productsSuccessful: successful, productsFailed: failed,
      alertsGenerated: alerts, emailsSent: 0, smsSent: 0,
      metrics: { scraped: processed, compared: alerts },
      errors, warnings, recommendations
    };
  } catch (e) {
    logger.error('JOB_ERROR', { ...jobLog, error: (e as Error).message });
    return {
      success: false, executionTimeMs: Date.now() - startTime,
      productsProcessed: processed, productsSuccessful: successful, productsFailed: failed,
      alertsGenerated: alerts, emailsSent: 0, smsSent: 0,
      metrics: {}, errors: [(e as Error).message], warnings, recommendations
    };
  }
}

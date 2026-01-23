/**
 * Job: Alertas en tiempo real
 * @module cron-jobs-maxiconsumo/jobs/realtime-alerts
 */

import type { JobExecutionContext, JobResult, StructuredLog } from '../types.ts';
import { createLogger } from '../../_shared/logger.ts';
import { writeExecutionLog } from '../execution-log.ts';
import { validateJobContext, validateEnvVars, ValidationError, isPositiveNumber } from '../validators.ts';

const logger = createLogger('cron-jobs-maxiconsumo:job:realtime-alerts');

export async function executeRealtimeAlerts(
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
  let alerts = 0, emails = 0, sms = 0;

  try {
    // 1. Fetch recent price changes
    const threshold = (ctx.parameters.criticalChangeThreshold as number) || 15;
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const res = await fetch(
      `${supabaseUrl}/rest/v1/precios_historicos?select=*,productos(nombre)&fecha_cambio=gte.${since}`,
      { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
    );

    if (res.ok) {
      const changes = await res.json();
      const critical = changes.filter((c: any) => {
        const pct = c.precio_anterior > 0 ? Math.abs((c.precio - c.precio_anterior) / c.precio_anterior * 100) : 0;
        return pct >= threshold;
      });

      alerts = critical.length;
      logger.info('CHANGES_DETECTED', { ...jobLog, total: changes.length, critical: alerts });

      // 2. Create alerts for critical changes
      if (alerts > 0) {
        const alertData = critical.map((c: any) => ({
          producto_id: c.producto_id,
          tipo_cambio: c.precio > c.precio_anterior ? 'aumento' : 'disminucion',
          valor_anterior: c.precio_anterior,
          valor_nuevo: c.precio,
          porcentaje_cambio: ((c.precio - c.precio_anterior) / c.precio_anterior * 100).toFixed(2),
          severidad: 'critica',
          mensaje: `Cambio crítico detectado: ${c.productos?.nombre}`,
          fecha_alerta: new Date().toISOString(),
          procesada: false
        }));

        await fetch(`${supabaseUrl}/rest/v1/alertas_cambios_precios`, {
          method: 'POST',
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData)
        });

        recommendations.push(`${alerts} alertas críticas requieren atención`);
      }
    }

    // 3. Log execution
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    await writeExecutionLog(supabaseUrl, serviceRoleKey, {
      ctx,
      startTimeMs: startTime,
      endTimeMs: endTime,
      estado: 'exitoso',
      resultado: { runId: ctx.runId, alerts, emails, sms },
      metrics: {
        productosProcesados: 0,
        productosExitosos: 0,
        productosFallidos: 0,
        alertasGeneradas: alerts,
        emailsEnviados: emails,
        smsEnviados: sms
      },
      logMeta: jobLog
    });

    logger.info('JOB_COMPLETE', { ...jobLog, alerts, duration: durationMs });

    return {
      success: true, executionTimeMs: durationMs,
      productsProcessed: 0, productsSuccessful: 0, productsFailed: 0,
      alertsGenerated: alerts, emailsSent: emails, smsSent: sms,
      metrics: { critical_alerts: alerts }, errors, warnings, recommendations
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
      resultado: { runId: ctx.runId, alerts, emails, sms },
      metrics: {
        productosProcesados: 0,
        productosExitosos: 0,
        productosFallidos: 0,
        alertasGeneradas: alerts,
        emailsEnviados: 0,
        smsEnviados: 0
      },
      logMeta: jobLog
    });
    return {
      success: false, executionTimeMs: Date.now() - startTime,
      productsProcessed: 0, productsSuccessful: 0, productsFailed: 0,
      alertsGenerated: alerts, emailsSent: 0, smsSent: 0,
      metrics: {}, errors: [errorMessage], warnings, recommendations
    };
  }
}

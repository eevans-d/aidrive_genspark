/**
 * Job: Alertas en tiempo real
 * @module cron-jobs-maxiconsumo/jobs/realtime-alerts
 */

import type { JobExecutionContext, JobResult, StructuredLog } from '../types.ts';

export async function executeRealtimeAlerts(
  ctx: JobExecutionContext,
  supabaseUrl: string,
  serviceRoleKey: string,
  log: StructuredLog
): Promise<JobResult> {
  const jobLog = { ...log, jobId: ctx.jobId, runId: ctx.runId, event: 'JOB_START' };
  console.log(JSON.stringify(jobLog));

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
      console.log(JSON.stringify({ ...jobLog, event: 'CHANGES_DETECTED', total: changes.length, critical: alerts }));

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
        resultado: { runId: ctx.runId, alerts, emails, sms },
        alertas_generadas: alerts,
        productos_procesados: 0,
        productos_exitosos: 0,
        productos_fallidos: 0,
        emails_enviados: emails,
        sms_enviados: sms
      })
    });

    console.log(JSON.stringify({ ...jobLog, event: 'JOB_COMPLETE', alerts, duration: durationMs }));

    return {
      success: true, executionTimeMs: durationMs,
      productsProcessed: 0, productsSuccessful: 0, productsFailed: 0,
      alertsGenerated: alerts, emailsSent: emails, smsSent: sms,
      metrics: { critical_alerts: alerts }, errors, warnings, recommendations
    };
  } catch (e) {
    console.error(JSON.stringify({ ...jobLog, event: 'JOB_ERROR', error: (e as Error).message }));
    return {
      success: false, executionTimeMs: Date.now() - startTime,
      productsProcessed: 0, productsSuccessful: 0, productsFailed: 0,
      alertsGenerated: alerts, emailsSent: 0, smsSent: 0,
      metrics: {}, errors: [(e as Error).message], warnings, recommendations
    };
  }
}

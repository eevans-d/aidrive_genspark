/**
 * Orquestador de jobs para cron-jobs-maxiconsumo
 * @module cron-jobs-maxiconsumo/orchestrator
 */

import type { JobExecutionContext, JobResult, StructuredLog, JobHandler } from './types.ts';
import { getJobConfig, JOB_CONFIGS } from './config.ts';
import { executeDailyPriceUpdate } from './jobs/daily-price-update.ts';
import { executeRealtimeAlerts } from './jobs/realtime-alerts.ts';
import { executeWeeklyAnalysis } from './jobs/weekly-analysis.ts';
import { executeMaintenanceCleanup } from './jobs/maintenance.ts';
import { getCircuitBreaker } from '../_shared/circuit-breaker.ts';

const JOB_HANDLERS: Record<string, JobHandler> = {
  'daily_price_update': executeDailyPriceUpdate,
  'weekly_trend_analysis': executeWeeklyAnalysis,
  'realtime_change_alerts': executeRealtimeAlerts,
  'maintenance_cleanup': executeMaintenanceCleanup
};

export function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function createExecutionContext(
  jobId: string, requestId: string, source: JobExecutionContext['source'], params: Record<string, unknown> = {}
): JobExecutionContext {
  const config = getJobConfig(jobId);
  return {
    executionId: crypto.randomUUID(),
    jobId,
    runId: generateRunId(),
    startTime: new Date(),
    requestId,
    source,
    parameters: { ...config?.parameters, ...params }
  };
}

export async function executeJob(
  jobId: string, ctx: JobExecutionContext, supabaseUrl: string, serviceRoleKey: string, log: StructuredLog
): Promise<JobResult> {
  const config = getJobConfig(jobId);
  if (!config) throw new Error(`Job not found: ${jobId}`);
  if (!config.active) throw new Error(`Job disabled: ${jobId}`);

  const handler = JOB_HANDLERS[jobId];
  if (!handler) throw new Error(`No handler for job: ${jobId}`);

  // Circuit breaker check
  const breaker = getCircuitBreaker(`cron-${jobId}`, { failureThreshold: config.circuitBreakerThreshold, successThreshold: 2, openTimeoutMs: 60000 });
  if (!breaker.allowRequest()) {
    throw new Error(`Circuit breaker open for job: ${jobId}`);
  }

  const jobLog: StructuredLog = { ...log, jobId, runId: ctx.runId };
  console.log(JSON.stringify({ ...jobLog, event: 'ORCHESTRATOR_EXECUTE_START' }));

  try {
    const result = await Promise.race([
      handler(ctx, supabaseUrl, serviceRoleKey, jobLog),
      new Promise<JobResult>((_, reject) => setTimeout(() => reject(new Error('Job timeout')), config.timeoutMs))
    ]);

    if (result.success) breaker.recordSuccess();
    else breaker.recordFailure();

    return result;
  } catch (e) {
    breaker.recordFailure();
    throw e;
  }
}

export function getJobStatus(): Record<string, { active: boolean; type: string; lastRun?: string }> {
  const status: Record<string, { active: boolean; type: string }> = {};
  for (const [id, config] of Object.entries(JOB_CONFIGS)) {
    status[id] = { active: config.active, type: config.type };
  }
  return status;
}

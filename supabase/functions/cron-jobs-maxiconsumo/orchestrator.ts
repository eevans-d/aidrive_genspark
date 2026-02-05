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
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('cron-jobs-maxiconsumo:orchestrator');

const JOB_HANDLERS: Record<string, JobHandler> = {
  'daily_price_update': executeDailyPriceUpdate,
  'weekly_trend_analysis': executeWeeklyAnalysis,
  'realtime_change_alerts': executeRealtimeAlerts,
  'maintenance_cleanup': executeMaintenanceCleanup
};

async function callRpc<T>(
  supabaseUrl: string,
  serviceRoleKey: string,
  fnName: string,
  payload: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`RPC ${fnName} failed: ${response.status} ${response.statusText}`);
  }

  return await response.json() as T;
}

async function tryAcquireJobLock(
  jobId: string,
  lockSeconds: number,
  supabaseUrl: string,
  serviceRoleKey: string,
  owner: string
): Promise<boolean> {
  let result: unknown;
  try {
    result = await callRpc<unknown>(supabaseUrl, serviceRoleKey, 'sp_acquire_job_lock', {
      p_job_id: jobId,
      p_lock_seconds: lockSeconds,
      p_owner: owner
    });
  } catch (error) {
    const message = (error as Error).message || '';
    if (message.includes('404') || message.includes('Not Found')) {
      logger.warn('JOB_LOCK_RPC_MISSING', { jobId, owner, action: 'fallback_no_lock' });
      return true;
    }
    throw error;
  }

  if (Array.isArray(result)) {
    return result[0] === true;
  }

  return result === true;
}

async function releaseJobLock(
  jobId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  owner: string
): Promise<void> {
  try {
    await callRpc<unknown>(supabaseUrl, serviceRoleKey, 'sp_release_job_lock', {
      p_job_id: jobId,
      p_owner: owner
    });
  } catch (error) {
    logger.warn('JOB_LOCK_RELEASE_FAILED', { jobId, error: (error as Error).message });
  }
}

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
  logger.info('ORCHESTRATOR_EXECUTE_START', jobLog);

  const lockOwner = ctx.executionId;
  const lockSeconds = Math.ceil(config.timeoutMs / 1000) + 60;
  const lockAcquired = await tryAcquireJobLock(jobId, lockSeconds, supabaseUrl, serviceRoleKey, lockOwner);

  if (!lockAcquired) {
    logger.warn('JOB_LOCKED', { ...jobLog, lockSeconds });
    return {
      success: true,
      executionTimeMs: 0,
      productsProcessed: 0,
      productsSuccessful: 0,
      productsFailed: 0,
      alertsGenerated: 0,
      emailsSent: 0,
      smsSent: 0,
      metrics: { skipped: true, reason: 'lock_active' },
      errors: [],
      warnings: ['job_locked'],
      recommendations: []
    };
  }

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
  } finally {
    if (lockAcquired) {
      await releaseJobLock(jobId, supabaseUrl, serviceRoleKey, lockOwner);
    }
  }
}

export function getJobStatus(): Record<string, { active: boolean; type: string; lastRun?: string }> {
  const status: Record<string, { active: boolean; type: string }> = {};
  for (const [id, config] of Object.entries(JOB_CONFIGS)) {
    status[id] = { active: config.active, type: config.type };
  }
  return status;
}

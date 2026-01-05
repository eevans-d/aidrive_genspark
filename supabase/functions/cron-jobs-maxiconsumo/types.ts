/**
 * Tipos compartidos para cron-jobs-maxiconsumo
 * @module cron-jobs-maxiconsumo/types
 */

export interface CronJobConfig {
  jobId: string;
  name: string;
  type: 'diario' | 'semanal' | 'tiempo_real' | 'manual';
  cronExpression: string;
  priority: number;
  timeoutMs: number;
  maxRetries: number;
  circuitBreakerThreshold: number;
  active: boolean;
  parameters: Record<string, unknown>;
  dependencies?: string[];
  notificationChannels: string[];
}

export interface JobExecutionContext {
  executionId: string;
  jobId: string;
  runId: string;
  startTime: Date;
  userId?: string;
  requestId: string;
  source: 'scheduled' | 'manual' | 'api' | 'recovery';
  parameters: Record<string, unknown>;
}

export interface JobResult {
  success: boolean;
  executionTimeMs: number;
  productsProcessed: number;
  productsSuccessful: number;
  productsFailed: number;
  alertsGenerated: number;
  emailsSent: number;
  smsSent: number;
  metrics: Record<string, unknown>;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  nextExecutionRecommended?: string;
}

export interface StructuredLog {
  requestId: string;
  jobId?: string;
  runId?: string;
  event?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export type JobHandler = (
  ctx: JobExecutionContext,
  supabaseUrl: string,
  serviceRoleKey: string,
  log: StructuredLog
) => Promise<JobResult>;

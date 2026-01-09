import { createLogger } from '../_shared/logger.ts';
import type { JobExecutionContext, StructuredLog } from './types.ts';

export type ExecutionStatus = 'exitoso' | 'fallido' | 'parcial';

type ExecutionLogMetrics = {
  productosProcesados?: number;
  productosExitosos?: number;
  productosFallidos?: number;
  alertasGeneradas?: number;
  emailsEnviados?: number;
  smsEnviados?: number;
  memoryUsageStart?: number;
};

type ExecutionLogInput = {
  ctx: JobExecutionContext;
  startTimeMs: number;
  endTimeMs: number;
  estado: string;
  errorMessage?: string | null;
  parametros?: Record<string, unknown>;
  resultado?: Record<string, unknown>;
  metrics?: ExecutionLogMetrics;
  logMeta?: StructuredLog;
};

const logger = createLogger('cron-jobs-maxiconsumo:execution-log');

const STATUS_MAP: Record<string, ExecutionStatus> = {
  exitoso: 'exitoso',
  success: 'exitoso',
  ok: 'exitoso',
  fallido: 'fallido',
  failed: 'fallido',
  error: 'fallido',
  parcial: 'parcial',
  partial: 'parcial'
};

function normalizeStatus(raw: string | undefined): { status: ExecutionStatus; errors: string[] } {
  const normalized = raw?.toLowerCase?.() ?? '';
  const mapped = STATUS_MAP[normalized];
  if (!mapped) {
    return { status: 'fallido', errors: [`estado invalido: ${raw ?? 'undefined'}`] };
  }
  return { status: mapped, errors: [] };
}

function toCount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.trunc(num);
}

function toDurationMs(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.trunc(num);
}

function validatePayload(payload: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const jobId = payload.job_id;
  const startTime = payload.start_time;
  const estado = payload.estado;
  const duracionMs = payload.duracion_ms;
  const endTime = payload.end_time;

  if (typeof jobId !== 'string' || jobId.trim().length === 0) {
    errors.push('job_id requerido');
  }
  if (typeof startTime !== 'string' || Number.isNaN(Date.parse(startTime))) {
    errors.push('start_time invalido');
  }
  if (typeof estado !== 'string' || !(estado in STATUS_MAP) && !Object.values(STATUS_MAP).includes(estado as ExecutionStatus)) {
    errors.push('estado invalido');
  }
  if (duracionMs !== undefined && !Number.isFinite(Number(duracionMs))) {
    errors.push('duracion_ms invalido');
  }
  if (endTime !== undefined && endTime !== null && typeof endTime === 'string' && Number.isNaN(Date.parse(endTime))) {
    errors.push('end_time invalido');
  }
  return errors;
}

function mergeErrorMessage(base: string | null | undefined, extras: string[]): string | null {
  const cleaned = extras.filter(Boolean);
  if (cleaned.length === 0) return base ?? null;
  const suffix = `validation_errors=${cleaned.join(', ')}`;
  return [base, suffix].filter(Boolean).join(' | ');
}

export async function writeExecutionLog(
  supabaseUrl: string,
  serviceRoleKey: string,
  input: ExecutionLogInput
): Promise<void> {
  const { ctx, startTimeMs, endTimeMs, errorMessage, parametros, resultado, metrics, logMeta } = input;
  const { status, errors: statusErrors } = normalizeStatus(input.estado);
  const durationMs = toDurationMs(endTimeMs - startTimeMs);

  const payload: Record<string, unknown> = {
    job_id: ctx.jobId,
    execution_id: ctx.executionId,
    start_time: new Date(startTimeMs).toISOString(),
    end_time: new Date(endTimeMs).toISOString(),
    duracion_ms: durationMs,
    estado: status,
    request_id: ctx.requestId,
    parametros_ejecucion: parametros ?? ctx.parameters ?? {},
    resultado: resultado ?? {},
    error_message: errorMessage ?? null,
    memory_usage_start: metrics?.memoryUsageStart ?? null,
    productos_procesados: toCount(metrics?.productosProcesados),
    productos_exitosos: toCount(metrics?.productosExitosos),
    productos_fallidos: toCount(metrics?.productosFallidos),
    alertas_generadas: toCount(metrics?.alertasGeneradas),
    emails_enviados: toCount(metrics?.emailsEnviados),
    sms_enviados: toCount(metrics?.smsEnviados)
  };

  const validationErrors = [...statusErrors, ...validatePayload(payload)];
  if (validationErrors.length > 0) {
    payload.estado = 'fallido';
    payload.error_message = mergeErrorMessage(payload.error_message as string | null | undefined, validationErrors);
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/cron_jobs_execution_log`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      logger.warn('EXECUTION_LOG_INSERT_FAILED', {
        ...logMeta,
        jobId: ctx.jobId,
        status: response.status,
        status_text: response.statusText
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn('EXECUTION_LOG_INSERT_FAILED', { ...logMeta, jobId: ctx.jobId, error: message });
  }
}

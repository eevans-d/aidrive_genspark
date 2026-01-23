/**
 * Validación runtime para cron jobs
 * @module cron-jobs-maxiconsumo/validators
 */

import type { JobExecutionContext, JobResult, CronJobConfig } from './types.ts';

// ─────────────────────────────────────────────────────────────
// Errores de validación
// ─────────────────────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly reason: string,
    public readonly value?: unknown
  ) {
    super(`Validation failed for "${field}": ${reason}`);
    this.name = 'ValidationError';
  }
}

// ─────────────────────────────────────────────────────────────
// Validadores primitivos
// ─────────────────────────────────────────────────────────────

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// ─────────────────────────────────────────────────────────────
// Validadores de contexto
// ─────────────────────────────────────────────────────────────

export function validateJobContext(ctx: unknown): asserts ctx is JobExecutionContext {
  if (!ctx || typeof ctx !== 'object') {
    throw new ValidationError('ctx', 'must be an object', ctx);
  }

  const c = ctx as Record<string, unknown>;

  if (!isNonEmptyString(c.executionId)) {
    throw new ValidationError('ctx.executionId', 'must be a non-empty string', c.executionId);
  }
  if (!isNonEmptyString(c.jobId)) {
    throw new ValidationError('ctx.jobId', 'must be a non-empty string', c.jobId);
  }
  if (!isNonEmptyString(c.runId)) {
    throw new ValidationError('ctx.runId', 'must be a non-empty string', c.runId);
  }
  if (!isNonEmptyString(c.requestId)) {
    throw new ValidationError('ctx.requestId', 'must be a non-empty string', c.requestId);
  }
  if (!(c.startTime instanceof Date)) {
    throw new ValidationError('ctx.startTime', 'must be a Date', c.startTime);
  }

  const validSources = ['scheduled', 'manual', 'api', 'recovery'];
  if (!validSources.includes(c.source as string)) {
    throw new ValidationError('ctx.source', `must be one of: ${validSources.join(', ')}`, c.source);
  }

  if (!c.parameters || typeof c.parameters !== 'object') {
    throw new ValidationError('ctx.parameters', 'must be an object', c.parameters);
  }
}

export function validateEnvVars(supabaseUrl: unknown, serviceRoleKey: unknown): void {
  if (!isValidUrl(supabaseUrl)) {
    throw new ValidationError('supabaseUrl', 'must be a valid URL', supabaseUrl);
  }
  if (!isNonEmptyString(serviceRoleKey)) {
    throw new ValidationError('serviceRoleKey', 'must be a non-empty string', '[REDACTED]');
  }
}

// ─────────────────────────────────────────────────────────────
// Validadores de configuración
// ─────────────────────────────────────────────────────────────

export function validateCronJobConfig(config: unknown): asserts config is CronJobConfig {
  if (!config || typeof config !== 'object') {
    throw new ValidationError('config', 'must be an object', config);
  }

  const c = config as Record<string, unknown>;

  if (!isNonEmptyString(c.jobId)) {
    throw new ValidationError('config.jobId', 'must be a non-empty string', c.jobId);
  }
  if (!isNonEmptyString(c.name)) {
    throw new ValidationError('config.name', 'must be a non-empty string', c.name);
  }

  const validTypes = ['diario', 'semanal', 'tiempo_real', 'manual'];
  if (!validTypes.includes(c.type as string)) {
    throw new ValidationError('config.type', `must be one of: ${validTypes.join(', ')}`, c.type);
  }

  if (!isNonEmptyString(c.cronExpression)) {
    throw new ValidationError('config.cronExpression', 'must be a non-empty string', c.cronExpression);
  }
  if (!isPositiveNumber(c.priority) || c.priority > 10) {
    throw new ValidationError('config.priority', 'must be a positive number between 1 and 10', c.priority);
  }
  if (!isPositiveNumber(c.timeoutMs)) {
    throw new ValidationError('config.timeoutMs', 'must be a positive number', c.timeoutMs);
  }
  if (!isNonNegativeNumber(c.maxRetries)) {
    throw new ValidationError('config.maxRetries', 'must be a non-negative number', c.maxRetries);
  }
  if (!isNonNegativeNumber(c.circuitBreakerThreshold)) {
    throw new ValidationError('config.circuitBreakerThreshold', 'must be a non-negative number', c.circuitBreakerThreshold);
  }
  if (typeof c.active !== 'boolean') {
    throw new ValidationError('config.active', 'must be a boolean', c.active);
  }
  if (!Array.isArray(c.notificationChannels)) {
    throw new ValidationError('config.notificationChannels', 'must be an array', c.notificationChannels);
  }
}

// ─────────────────────────────────────────────────────────────
// Validadores de resultado
// ─────────────────────────────────────────────────────────────

export function validateJobResult(result: unknown): asserts result is JobResult {
  if (!result || typeof result !== 'object') {
    throw new ValidationError('result', 'must be an object', result);
  }

  const r = result as Record<string, unknown>;

  if (typeof r.success !== 'boolean') {
    throw new ValidationError('result.success', 'must be a boolean', r.success);
  }
  if (!isNonNegativeNumber(r.executionTimeMs)) {
    throw new ValidationError('result.executionTimeMs', 'must be a non-negative number', r.executionTimeMs);
  }
  if (!isNonNegativeNumber(r.productsProcessed)) {
    throw new ValidationError('result.productsProcessed', 'must be a non-negative number', r.productsProcessed);
  }
  if (!isNonNegativeNumber(r.productsSuccessful)) {
    throw new ValidationError('result.productsSuccessful', 'must be a non-negative number', r.productsSuccessful);
  }
  if (!isNonNegativeNumber(r.productsFailed)) {
    throw new ValidationError('result.productsFailed', 'must be a non-negative number', r.productsFailed);
  }
  if (!isNonNegativeNumber(r.alertsGenerated)) {
    throw new ValidationError('result.alertsGenerated', 'must be a non-negative number', r.alertsGenerated);
  }
  if (!isNonNegativeNumber(r.emailsSent)) {
    throw new ValidationError('result.emailsSent', 'must be a non-negative number', r.emailsSent);
  }
  if (!isNonNegativeNumber(r.smsSent)) {
    throw new ValidationError('result.smsSent', 'must be a non-negative number', r.smsSent);
  }
  if (!Array.isArray(r.errors)) {
    throw new ValidationError('result.errors', 'must be an array', r.errors);
  }
  if (!Array.isArray(r.warnings)) {
    throw new ValidationError('result.warnings', 'must be an array', r.warnings);
  }
  if (!Array.isArray(r.recommendations)) {
    throw new ValidationError('result.recommendations', 'must be an array', r.recommendations);
  }
}

// ─────────────────────────────────────────────────────────────
// Validadores específicos de datos de alerta
// ─────────────────────────────────────────────────────────────

export interface AlertaInput {
  producto_id: string;
  tipo_cambio: 'aumento' | 'disminucion';
  valor_anterior: number;
  valor_nuevo: number;
  porcentaje_cambio: number;
  severidad: 'baja' | 'media' | 'alta' | 'critica';
  mensaje: string;
  fecha_alerta: string;
}

export function validateAlertaInput(alerta: unknown): asserts alerta is AlertaInput {
  if (!alerta || typeof alerta !== 'object') {
    throw new ValidationError('alerta', 'must be an object', alerta);
  }

  const a = alerta as Record<string, unknown>;

  if (!isNonEmptyString(a.producto_id)) {
    throw new ValidationError('alerta.producto_id', 'must be a non-empty string', a.producto_id);
  }

  const validTipos = ['aumento', 'disminucion'];
  if (!validTipos.includes(a.tipo_cambio as string)) {
    throw new ValidationError('alerta.tipo_cambio', `must be one of: ${validTipos.join(', ')}`, a.tipo_cambio);
  }

  if (!isNonNegativeNumber(a.valor_anterior)) {
    throw new ValidationError('alerta.valor_anterior', 'must be a non-negative number', a.valor_anterior);
  }
  if (!isNonNegativeNumber(a.valor_nuevo)) {
    throw new ValidationError('alerta.valor_nuevo', 'must be a non-negative number', a.valor_nuevo);
  }
  if (!isNonNegativeNumber(a.porcentaje_cambio)) {
    throw new ValidationError('alerta.porcentaje_cambio', 'must be a non-negative number', a.porcentaje_cambio);
  }

  const validSeveridades = ['baja', 'media', 'alta', 'critica'];
  if (!validSeveridades.includes(a.severidad as string)) {
    throw new ValidationError('alerta.severidad', `must be one of: ${validSeveridades.join(', ')}`, a.severidad);
  }

  if (!isNonEmptyString(a.mensaje)) {
    throw new ValidationError('alerta.mensaje', 'must be a non-empty string', a.mensaje);
  }
  if (!isValidISODate(a.fecha_alerta)) {
    throw new ValidationError('alerta.fecha_alerta', 'must be a valid ISO date string', a.fecha_alerta);
  }
}

export function validateAlertasArray(alertas: unknown): asserts alertas is AlertaInput[] {
  if (!Array.isArray(alertas)) {
    throw new ValidationError('alertas', 'must be an array', alertas);
  }

  for (let i = 0; i < alertas.length; i++) {
    try {
      validateAlertaInput(alertas[i]);
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`alertas[${i}].${e.field}`, e.reason, e.value);
      }
      throw e;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Validadores de comparación de precios
// ─────────────────────────────────────────────────────────────

export interface ComparacionInput {
  producto_id: string;
  nombre_producto?: string;
  precio_actual: number;
  precio_proveedor: number;
  diferencia_absoluta?: number;
  diferencia_porcentual?: number;
}

export function validateComparacionInput(comp: unknown): asserts comp is ComparacionInput {
  if (!comp || typeof comp !== 'object') {
    throw new ValidationError('comparacion', 'must be an object', comp);
  }

  const c = comp as Record<string, unknown>;

  if (!isNonEmptyString(c.producto_id)) {
    throw new ValidationError('comparacion.producto_id', 'must be a non-empty string', c.producto_id);
  }
  if (!isNonNegativeNumber(c.precio_actual)) {
    throw new ValidationError('comparacion.precio_actual', 'must be a non-negative number', c.precio_actual);
  }
  if (!isNonNegativeNumber(c.precio_proveedor)) {
    throw new ValidationError('comparacion.precio_proveedor', 'must be a non-negative number', c.precio_proveedor);
  }
}

// ─────────────────────────────────────────────────────────────
// Helper seguro para validar y transformar
// ─────────────────────────────────────────────────────────────

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ValidationError };

export function safeValidate<T>(
  value: unknown,
  validator: (v: unknown) => asserts v is T
): ValidationResult<T> {
  try {
    validator(value);
    return { success: true, data: value as T };
  } catch (e) {
    if (e instanceof ValidationError) {
      return { success: false, error: e };
    }
    throw e;
  }
}

/**
 * Wrapper para ejecutar un job con validación de entrada y salida
 */
export function withValidation<T extends (...args: Parameters<T>) => Promise<JobResult>>(
  jobFn: T,
  jobName: string
): T {
  return (async (...args: Parameters<T>): Promise<JobResult> => {
    const [ctx, supabaseUrl, serviceRoleKey] = args as [unknown, unknown, unknown, unknown];

    // Validar entradas
    validateJobContext(ctx);
    validateEnvVars(supabaseUrl, serviceRoleKey);

    // Ejecutar job
    const result = await jobFn(...args);

    // Validar salida
    validateJobResult(result);

    return result;
  }) as T;
}

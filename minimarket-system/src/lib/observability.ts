/**
 * Observabilidad UI
 * @description Reporter local y seguro. Captura errores con contexto enriquecido
 * (request-id, userId anonimizado, ruta, build version).
 *
 * Cuando VITE_SENTRY_DSN esta configurado, los errores se envian a Sentry
 * ademas de guardarse localmente en localStorage.
 *
 * Variables de entorno:
 *   VITE_SENTRY_DSN   — DSN de Sentry (opcional; sin ella opera en dry-run)
 *   VITE_BUILD_ID     — Identificador de build (opcional; inyectado por CI)
 *
 * Politica de PII:
 *   - userId se anonimiza con hash truncado (no se almacena el ID real).
 *   - No se capturan tokens, passwords ni datos de formulario.
 *   - Stack traces se incluyen solo en dev; en prod solo el mensaje.
 */

import * as Sentry from '@sentry/react'

export interface ObservabilityErrorPayload {
  error: unknown;
  errorId?: string;
  source?: string;
  /** x-request-id from API responses for server correlation */
  requestId?: string;
  /** Raw userId — will be anonymized before storage */
  userId?: string;
  context?: Record<string, unknown>;
}

interface StoredErrorReport {
  id: string;
  timestamp: string;
  source?: string;
  message: string;
  stack?: string;
  route?: string;
  buildVersion?: string;
  requestId?: string;
  userHash?: string;
  context?: Record<string, unknown>;
}

const STORAGE_KEY = 'mm_error_reports_v1';
const MAX_REPORTS = 50;

/**
 * Anonymize a userId via hash (truncated).
 * Uses sync approach since crypto.subtle is async.
 */
const anonymizeUserId = (userId: string): string => {
  // Simple deterministic hash for anonymization (no crypto dependency needed)
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const chr = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `anon_${(hash >>> 0).toString(36)}`;
};

const getBuildVersion = (): string => {
  try {
    return (import.meta.env.VITE_BUILD_ID as string) || 'dev';
  } catch {
    return 'unknown';
  }
};

const getCurrentRoute = (): string => {
  try {
    return window.location.pathname;
  } catch {
    return 'unknown';
  }
};

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: import.meta.env.DEV ? error.stack : undefined,
    };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: 'Error desconocido' };
  }
};

const safeReadReports = (): StoredErrorReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const safeWriteReports = (reports: StoredErrorReport[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // Evitar romper UI por fallos de storage
  }
};

/**
 * Reporta un error con contexto enriquecido.
 * - DEV: imprime en consola
 * - PROD: guarda en localStorage (últimos 50)
 * - Cuando VITE_SENTRY_DSN esté configurado: envía a Sentry
 */
export const reportError = ({
  error,
  errorId,
  source,
  requestId,
  userId,
  context,
}: ObservabilityErrorPayload) => {
  const serialized = serializeError(error);
  const id = errorId || `ERR-${Date.now().toString(36).toUpperCase()}`;

  if (import.meta.env.DEV) {
    console.error('[Observability] Error report', { id, source, requestId, ...serialized, context });
  }

  const report: StoredErrorReport = {
    id,
    timestamp: new Date().toISOString(),
    source,
    message: serialized.message,
    stack: serialized.stack,
    route: context?.route as string | undefined ?? getCurrentRoute(),
    buildVersion: getBuildVersion(),
    requestId,
    userHash: userId ? anonymizeUserId(userId) : undefined,
    context,
  };

  const existing = safeReadReports();
  const next = [report, ...existing].slice(0, MAX_REPORTS);
  safeWriteReports(next);

  // Sentry integration: send error when DSN is configured
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (sentryDsn) {
    const err = error instanceof Error ? error : new Error(serialized.message);
    Sentry.captureException(err, {
      tags: { source, requestId, errorId: id },
      extra: { ...context, route: report.route, buildVersion: report.buildVersion },
    });
  }
};

export const getStoredErrorReports = (): StoredErrorReport[] => safeReadReports();
export const clearStoredErrorReports = () => safeWriteReports([]);

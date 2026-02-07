/**
 * Observabilidad UI (modo dry-run)
 * @description Reporter local y seguro sin credenciales de producción.
 */

export interface ObservabilityErrorPayload {
  error: unknown;
  errorId?: string;
  source?: string;
  context?: Record<string, unknown>;
}

interface StoredErrorReport {
  id: string;
  timestamp: string;
  source?: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

const STORAGE_KEY = 'mm_error_reports_v1';
const MAX_REPORTS = 50;

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
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
 * Reporta un error en modo dry-run.
 * - DEV: imprime en consola
 * - PROD: guarda en localStorage (últimos 50)
 */
export const reportError = ({ error, errorId, source, context }: ObservabilityErrorPayload) => {
  const serialized = serializeError(error);
  const id = errorId || `ERR-${Date.now().toString(36).toUpperCase()}`;

  if (import.meta.env.DEV) {
    console.error('[Observability] Error report', { id, source, ...serialized, context });
  }

  const report: StoredErrorReport = {
    id,
    timestamp: new Date().toISOString(),
    source,
    message: serialized.message,
    stack: serialized.stack,
    context,
  };

  const existing = safeReadReports();
  const next = [report, ...existing].slice(0, MAX_REPORTS);
  safeWriteReports(next);

  // TODO: Integrar Sentry cuando haya credenciales
};

export const getStoredErrorReports = (): StoredErrorReport[] => safeReadReports();
export const clearStoredErrorReports = () => safeWriteReports([]);

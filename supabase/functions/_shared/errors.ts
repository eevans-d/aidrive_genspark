type ErrorDetails = Record<string, unknown> | string | null;

export class AppError extends Error {
  code: string;
  status: number;
  details?: ErrorDetails;

  constructor(message: string, code = 'INTERNAL_ERROR', status = 500, details?: ErrorDetails) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class HttpError extends AppError {
  constructor(message: string, status = 500, code = 'HTTP_ERROR', details?: ErrorDetails) {
    super(message, code, status, details);
    this.name = 'HttpError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown, fallbackCode = 'INTERNAL_ERROR', status = 500): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, fallbackCode, status);
  }

  return new AppError('Unexpected error', fallbackCode, status, {
    raw: error,
  });
}

// ============================================================================
// PostgREST / Fetch Error Conversion
// ============================================================================

export type PostgrestErrorBody = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

/**
 * Converts a fetch Response (PostgREST error) into an AppError.
 * Parses JSON body if possible, otherwise uses status text.
 */
export async function fromFetchResponse(
  response: Response,
  fallbackMessage = 'Request failed',
): Promise<AppError> {
  const status = response.status;
  let message = fallbackMessage;
  let code = 'FETCH_ERROR';
  let details: ErrorDetails = null;

  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = (await response.json()) as PostgrestErrorBody;
      message = body.message || body.details || response.statusText || fallbackMessage;
      code = mapPostgrestCode(body.code, status);
      details = {
        hint: body.hint,
        pgCode: body.code,
        statusText: response.statusText,
      };
    } else {
      const text = await response.text();
      message = text || response.statusText || fallbackMessage;
    }
  } catch {
    message = response.statusText || fallbackMessage;
  }

  return new AppError(message, code, status, details);
}

/**
 * Converts a caught error from fetch (network errors, etc.) into an AppError.
 */
export function fromFetchError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof TypeError) {
    // Network errors typically throw TypeError
    return new AppError(
      'Network error: unable to reach server',
      'NETWORK_ERROR',
      503,
      { originalMessage: error.message },
    );
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'FETCH_ERROR', 500);
  }

  return new AppError('Unknown fetch error', 'FETCH_ERROR', 500, { raw: error });
}

/**
 * Maps PostgreSQL/PostgREST error codes to semantic error codes.
 * Covers SQLSTATE classes and PGRST* codes.
 */
function mapPostgrestCode(pgCode: string | undefined, httpStatus: number): string {
  if (pgCode) {
    // PGRST codes from PostgREST (check first, most specific)
    const pgrstMap: Record<string, string> = {
      'PGRST000': 'POSTGREST_CONNECTION_ERROR',
      'PGRST001': 'POSTGREST_DB_ERROR',
      'PGRST002': 'POSTGREST_SCHEMA_CACHE_ERROR',
      'PGRST100': 'POSTGREST_PARSE_ERROR',
      'PGRST101': 'POSTGREST_INVALID_BODY',
      'PGRST102': 'POSTGREST_INVALID_PREFER',
      'PGRST103': 'POSTGREST_INVALID_RANGE',
      'PGRST105': 'POSTGREST_INVALID_FILTER',
      'PGRST106': 'POSTGREST_INVALID_COLUMN',
      'PGRST107': 'POSTGREST_INVALID_OPERATOR',
      'PGRST108': 'POSTGREST_INVALID_EMBED',
      'PGRST109': 'POSTGREST_INVALID_ORDERING',
      'PGRST110': 'POSTGREST_INVALID_OFFSET',
      'PGRST116': 'POSTGREST_NOT_SINGULAR',
      'PGRST200': 'POSTGREST_AUTH_ERROR',
      'PGRST201': 'POSTGREST_JWT_INVALID',
      'PGRST202': 'POSTGREST_JWT_EXPIRED',
      'PGRST301': 'POSTGREST_NOT_FOUND',
    };
    if (pgCode in pgrstMap) return pgrstMap[pgCode];
    if (pgCode.startsWith('PGRST')) return `POSTGREST_${pgCode}`;

    // SQLSTATE Class 08 — Connection Exception
    if (pgCode.startsWith('08')) return 'CONNECTION_ERROR';
    // Class 22 — Data Exception
    if (pgCode.startsWith('22')) {
      if (pgCode === '22001') return 'STRING_DATA_TOO_LONG';
      if (pgCode === '22003') return 'NUMERIC_OUT_OF_RANGE';
      if (pgCode === '22007') return 'INVALID_DATE_FORMAT';
      if (pgCode === '22012') return 'DIVISION_BY_ZERO';
      if (pgCode === '22P02') return 'INVALID_TEXT_REPRESENTATION';
      return 'DATA_EXCEPTION';
    }
    // Class 23 — Integrity Constraint Violation
    if (pgCode.startsWith('23')) {
      if (pgCode === '23505') return 'DUPLICATE_KEY';
      if (pgCode === '23503') return 'FOREIGN_KEY_VIOLATION';
      if (pgCode === '23502') return 'NOT_NULL_VIOLATION';
      if (pgCode === '23514') return 'CHECK_VIOLATION';
      return 'CONSTRAINT_VIOLATION';
    }
    // Class 28 — Invalid Authorization
    if (pgCode.startsWith('28')) return 'AUTH_ERROR';
    // Class 40 — Transaction Rollback
    if (pgCode.startsWith('40')) {
      if (pgCode === '40001') return 'SERIALIZATION_FAILURE';
      if (pgCode === '40P01') return 'DEADLOCK_DETECTED';
      return 'TRANSACTION_ROLLBACK';
    }
    // Class 42 — Syntax Error or Access Rule Violation
    if (pgCode.startsWith('42')) {
      if (pgCode === '42501') return 'PERMISSION_DENIED';
      if (pgCode === '42601') return 'SYNTAX_ERROR';
      if (pgCode === '42703') return 'UNDEFINED_COLUMN';
      if (pgCode === '42883') return 'UNDEFINED_FUNCTION';
      if (pgCode === '42P01') return 'UNDEFINED_TABLE';
      return 'QUERY_ERROR';
    }
    // Class 53 — Insufficient Resources
    if (pgCode.startsWith('53')) return 'INSUFFICIENT_RESOURCES';
    // Class 54 — Program Limit Exceeded
    if (pgCode.startsWith('54')) return 'LIMIT_EXCEEDED';
    // Class P0 — PL/pgSQL Error
    if (pgCode.startsWith('P0')) {
      if (pgCode === 'P0001') return 'RAISE_EXCEPTION';
      return 'PLPGSQL_ERROR';
    }
  }

  // Fallback based on HTTP status from response
  switch (httpStatus) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 405: return 'METHOD_NOT_ALLOWED';
    case 406: return 'NOT_ACCEPTABLE';
    case 409: return 'CONFLICT';
    case 416: return 'RANGE_NOT_SATISFIABLE';
    case 422: return 'UNPROCESSABLE_ENTITY';
    case 429: return 'RATE_LIMITED';
    default: return httpStatus >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR';
  }
}

/**
 * Determines appropriate HTTP status from an error.
 * Prefers status from AppError; only falls back to text inference for plain Errors.
 */
export function getErrorStatus(error: unknown): number {
  // AppError already has status - use it directly
  if (isAppError(error)) {
    return error.status;
  }

  // For plain Error, infer from message (legacy behavior, but discouraged)
  // Prefer wrapping errors with toAppError() instead
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('no autorizado') || msg.includes('unauthorized')) return 401;
    if (msg.includes('acceso denegado') || msg.includes('forbidden')) return 403;
    if (msg.includes('no encontrad') || msg.includes('not found')) return 404;
    if (msg.includes('ya existe') || msg.includes('duplicate')) return 409;
  }

  return 500;
}

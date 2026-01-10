type HeadersLike = Record<string, string>;

function buildHeaders(headers: HeadersLike = {}): HeadersLike {
  return { 'Content-Type': 'application/json', ...headers };
}

export type SuccessResponse<T = unknown> = {
  success: true;
  data: T;
  message?: string;
  requestId?: string;
};

export type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  message?: string;
  requestId?: string;
};

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export type OkOptions = {
  message?: string;
  requestId?: string;
  extra?: Record<string, unknown>;
};

export function ok<T = unknown>(
  data: T,
  status = 200,
  headers: HeadersLike = {},
  options: OkOptions = {},
): Response {
  const body: SuccessResponse<T> = { success: true, data };

  const extra = sanitizeExtra(options.extra);
  if (extra) {
    Object.assign(body, extra);
  }

  if (options.message) {
    body.message = options.message;
  }
  if (options.requestId) {
    body.requestId = options.requestId;
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: buildHeaders(headers),
  });
}

export type FailOptions = {
  details?: unknown;
  message?: string;
  requestId?: string;
  extra?: Record<string, unknown>;
};

function sanitizeExtra(extra?: Record<string, unknown>): Record<string, unknown> | null {
  if (!extra) return null;
  const { success, data, error, message, requestId, ...rest } = extra;
  return rest;
}

function isHeadersLike(value: unknown): value is HeadersLike {
  if (!value || typeof value !== 'object') return false;
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === 'string');
}

function isFailOptions(value: unknown): value is FailOptions {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return 'details' in obj || 'message' in obj || 'requestId' in obj || 'extra' in obj;
}

function coerceFailOptions(value: unknown): FailOptions {
  if (!value || typeof value !== 'object') return {};
  const obj = value as Record<string, unknown>;

  const options: FailOptions = {};
  if ('details' in obj) options.details = obj.details;
  if (typeof obj.message === 'string') options.message = obj.message;
  if (typeof obj.requestId === 'string') options.requestId = obj.requestId;
  if (obj.extra && typeof obj.extra === 'object' && !Array.isArray(obj.extra)) {
    options.extra = obj.extra as Record<string, unknown>;
  }

  return options;
}

// Overloads:
// 1) Legacy: fail(code, message, status?, details?, headers?)
// 2) Current: fail(code, message, status?, headers?, options?)
export function fail(
  code: string,
  message: string,
  status?: number,
  details?: unknown,
  headers?: HeadersLike,
): Response;
export function fail(
  code: string,
  message: string,
  status?: number,
  headers?: HeadersLike,
  options?: FailOptions,
): Response;
export function fail(
  code: string,
  message: string,
  status = 400,
  arg4: unknown = {},
  arg5: unknown = {},
): Response {
  let headers: HeadersLike = {};
  let options: FailOptions = {};

  // Prefer current signature when arg4 looks like headers.
  // If arg5 also looks like headers but does NOT look like FailOptions, assume legacy.
  if (isHeadersLike(arg4)) {
    if (isHeadersLike(arg5) && !isFailOptions(arg5)) {
      headers = arg5;
      options = { details: arg4 };
    } else {
      headers = arg4;
      options = coerceFailOptions(arg5);
    }
  } else if (isHeadersLike(arg5)) {
    // Legacy signature: (code, message, status, details, headers)
    headers = arg5;
    options = { details: arg4 };
  } else if (arg4 === undefined || arg4 === null) {
    // Edge case: details omitted in legacy, or headers omitted in current.
    if (isHeadersLike(arg5)) {
      headers = arg5;
      options = {};
    } else if (isFailOptions(arg5)) {
      options = coerceFailOptions(arg5);
    }
  } else {
    // Fallback: treat arg4 as details, arg5 as headers if possible.
    if (isHeadersLike(arg5)) {
      headers = arg5;
    }
    options = { details: arg4 };
  }

  const body: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  const extra = sanitizeExtra(options.extra);
  if (extra) {
    Object.assign(body, extra);
  }

  if (options.details !== undefined) {
    body.error.details = options.details;
  }
  if (options.message) {
    body.message = options.message;
  }
  if (options.requestId) {
    body.requestId = options.requestId;
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: buildHeaders(headers),
  });
}

/**
 * Legacy signature for backwards compatibility.
 * @deprecated Use fail(code, message, status, headers, { details }) instead.
 */
export function failWithDetails(
  code: string,
  message: string,
  status = 400,
  details: unknown = undefined,
  headers: HeadersLike = {},
): Response {
  return fail(code, message, status, details, headers);
}

// Default origins for local development when ALLOWED_ORIGINS is not set
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

export const DEFAULT_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
};

export function getCorsHeaders(
  overrides: Record<string, string> = {},
): Record<string, string> {
  return { ...DEFAULT_CORS_HEADERS, ...overrides };
}

export function handleCors(
  req: Request,
  headers: Record<string, string>,
): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  return null;
}

export function parseAllowedOrigins(value?: string | null): string[] {
  if (!value || value.trim() === '') {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export type CorsValidationResult = {
  allowed: boolean;
  headers: Record<string, string>;
  origin: string | null;
};

export function validateOrigin(
  req: Request,
  allowedOrigins: string[],
  overrides: Record<string, string> = {},
): CorsValidationResult {
  const origin = req.headers.get('origin');
  const effectiveOrigins = allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS;

  // No origin header (same-origin request or non-browser client)
  if (!origin) {
    return {
      allowed: true,
      headers: {
        ...DEFAULT_CORS_HEADERS,
        'Access-Control-Allow-Origin': effectiveOrigins[0],
        'Vary': 'Origin',
        ...overrides,
      },
      origin: null,
    };
  }

  // Check if origin is allowed
  const isAllowed = effectiveOrigins.includes(origin);

  return {
    allowed: isAllowed,
    headers: {
      ...DEFAULT_CORS_HEADERS,
      'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
      'Vary': 'Origin',
      ...overrides,
    },
    origin,
  };
}

/**
 * @deprecated Use validateOrigin() instead for proper origin validation
 */
export function resolveCorsHeaders(
  req: Request,
  allowedOrigins: string[] = [],
  overrides: Record<string, string> = {},
): Record<string, string> {
  const result = validateOrigin(req, allowedOrigins, overrides);
  return result.headers;
}

/**
 * Creates a standardized CORS error response.
 * Uses the same format as fail() from response.ts.
 */
export function createCorsErrorResponse(
  requestId?: string,
  corsHeaders: Record<string, string> = {},
): Response {
  const body: {
    success: false;
    error: { code: string; message: string };
    requestId?: string;
  } = {
    success: false,
    error: {
      code: 'CORS_ORIGIN_NOT_ALLOWED',
      message: 'Origin not allowed by CORS policy',
    },
  };

  if (requestId) {
    body.requestId = requestId;
  }

  // Merge CORS headers (already include Vary: Origin from validateOrigin)
  return new Response(JSON.stringify(body), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

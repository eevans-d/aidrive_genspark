export const DEFAULT_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
    return new Response(null, { status: 200, headers });
  }

  return null;
}

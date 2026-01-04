type HeadersLike = Record<string, string>;

function buildHeaders(headers: HeadersLike = {}): HeadersLike {
  return { 'Content-Type': 'application/json', ...headers };
}

export function ok(
  data: unknown,
  status = 200,
  headers: HeadersLike = {},
): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: buildHeaders(headers),
  });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details: unknown = undefined,
  headers: HeadersLike = {},
): Response {
  return new Response(JSON.stringify({
    success: false,
    error: {
      code,
      message,
      details,
    },
  }), {
    status,
    headers: buildHeaders(headers),
  });
}

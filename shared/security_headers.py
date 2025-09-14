"""
Security headers helpers for FastAPI and Flask apps.
Provides a consistent, environment-aware setup of common HTTP security headers.
"""
from typing import Optional, Dict
import os

DEFAULT_HEADERS: Dict[str, str] = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    # Conservative baseline; adjust as needed. Start as report-only in prod rollout.
    "Content-Security-Policy-Report-Only": "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'",
    # Modern replacement for Feature-Policy
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}


def _maybe_hsts(headers: Dict[str, str], env: str) -> None:
    # Enable HSTS only in production and when behind HTTPS
    if env.lower() == "prod":
        headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"


def get_security_headers(env: Optional[str] = None) -> Dict[str, str]:
    env = env or os.getenv("ENV", "dev")
    headers = dict(DEFAULT_HEADERS)
    _maybe_hsts(headers, env)
    return headers


def apply_fastapi_security(app, env: Optional[str] = None) -> None:
    """Attach a simple Starlette middleware to inject headers on all responses."""
    from starlette.middleware.base import BaseHTTPMiddleware

    security_headers = get_security_headers(env)

    class SecurityHeadersMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            response = await call_next(request)
            for k, v in security_headers.items():
                # Do not override if already set explicitly downstream
                if k not in response.headers:
                    response.headers[k] = v
            # Optional: redirect to HTTPS in prod if scheme is http
            env_local = (env or os.getenv("ENV", "dev")).lower()
            if env_local == "prod" and request.url.scheme == "http":
                # rely on reverse-proxy for redirect; here we only set headers
                pass
            return response

    app.add_middleware(SecurityHeadersMiddleware)


def apply_flask_security(app, env: Optional[str] = None) -> None:
    """Register an after_request hook to add headers in Flask."""
    security_headers = get_security_headers(env)

    @app.after_request
    def _add_headers(response):
        for k, v in security_headers.items():
            if k not in response.headers:
                response.headers[k] = v
        return response

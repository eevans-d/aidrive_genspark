"""
Shared error handling utilities: register global FastAPI handlers with consistent responses and safe logging.
"""
from typing import Any, Dict
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


def _base_payload(status: int, message: str, request: Request, code: str = "error") -> Dict[str, Any]:
    return {
        "status": status,
        "code": code,
        "message": message,
        "path": request.url.path,
    }


def register_fastapi_error_handlers(app) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        payload = _base_payload(exc.status_code, exc.detail or "HTTP error", request, code="http_error")
        # Avoid logging 404 as errors; log others at warning/error
        if exc.status_code >= 500:
            logger.exception("HTTPException 5xx: %s", exc.detail)
        elif exc.status_code >= 400 and exc.status_code != 404:
            logger.warning("HTTPException: %s", exc.detail)
        return JSONResponse(status_code=exc.status_code, content=payload)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        payload = _base_payload(422, "Validation error", request, code="validation_error")
        logger.info("Validation error at %s: %s", request.url.path, exc.errors())
        return JSONResponse(status_code=422, content=payload)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        payload = _base_payload(500, "Internal server error", request, code="internal_error")
        logger.exception("Unhandled exception at %s", request.url.path)
        return JSONResponse(status_code=500, content=payload)

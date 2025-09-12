"""
Middleware de seguridad para todos los servicios
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import time
import redis
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# Rate limiting con Redis
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=1, decode_responses=True)
    redis_client.ping()  # Test connection
except:
    redis_client = None
    logger.warning("Redis no disponible - rate limiting deshabilitado")

class SecurityMiddleware:
    """Middleware de seguridad centralizado"""
    
    def __init__(self):
        self.rate_limit_requests = 100  # requests por minuto
        self.rate_limit_window = 60     # segundos
    
    async def rate_limit_check(self, request: Request) -> bool:
        """Verificar rate limiting por IP"""
        if not redis_client:
            return True  # Si Redis no está disponible, permitir requests
            
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        try:
            current_requests = redis_client.get(key)
            if current_requests is None:
                redis_client.setex(key, self.rate_limit_window, 1)
                return True
            
            if int(current_requests) >= self.rate_limit_requests:
                return False
            
            redis_client.incr(key)
            return True
            
        except Exception as e:
            logger.error(f"Error en rate limiting: {e}")
            return True  # En caso de error, permitir request
    
    async def security_headers(self, response) -> None:
        """Agregar headers de seguridad"""
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"

async def security_middleware(request: Request, call_next):
    """Middleware principal de seguridad"""
    middleware = SecurityMiddleware()
    
    # Rate limiting
    if not await middleware.rate_limit_check(request):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded"}
        )
    
    # Procesar request
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Agregar headers de seguridad
    await middleware.security_headers(response)
    
    # Header de tiempo de proceso
    response.headers["X-Process-Time"] = str(process_time)
    
    return response
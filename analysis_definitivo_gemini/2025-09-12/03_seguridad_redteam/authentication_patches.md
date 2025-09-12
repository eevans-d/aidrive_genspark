# AUTHENTICATION & AUTHORIZATION IMPLEMENTATION PATCH
# Parche de seguridad crítico para implementar autenticación JWT

## ARCHIVO: shared/auth.py (NUEVO)
```python
"""
Sistema de Autenticación JWT para Multi-Agente Retail
Implementación de seguridad crítica
"""

import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
import os

# Configuración de seguridad
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE-ME-IN-PRODUCTION")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 8

# Configuración de hashing de passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class AuthManager:
    """Gestor de autenticación y autorización"""
    
    def __init__(self):
        self.secret_key = JWT_SECRET_KEY
        self.algorithm = JWT_ALGORITHM
        
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Crear token JWT"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verificar y decodificar token JWT"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expirado"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
    
    def hash_password(self, password: str) -> str:
        """Hash de password"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verificar password"""
        return pwd_context.verify(plain_password, hashed_password)

# Instancia global
auth_manager = AuthManager()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency para obtener usuario actual"""
    token = credentials.credentials
    payload = auth_manager.verify_token(token)
    return payload

def require_role(required_role: str):
    """Decorator para requerir rol específico"""
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere rol: {required_role}"
            )
        return current_user
    return role_checker

# Roles del sistema
ADMIN_ROLE = "admin"
DEPOSITO_ROLE = "deposito"
NEGOCIO_ROLE = "negocio"
ML_ROLE = "ml_service"
```

## ARCHIVO: shared/security_middleware.py (NUEVO)
```python
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
redis_client = redis.Redis(host='localhost', port=6379, db=1, decode_responses=True)

class SecurityMiddleware:
    """Middleware de seguridad centralizado"""
    
    def __init__(self):
        self.rate_limit_requests = 100  # requests por minuto
        self.rate_limit_window = 60     # segundos
    
    async def rate_limit_check(self, request: Request) -> bool:
        """Verificar rate limiting por IP"""
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
    security = SecurityMiddleware()
    
    # Rate limiting
    if not await security.rate_limit_check(request):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"error": "Rate limit excedido", "detail": "Demasiadas requests"}
        )
    
    # Procesar request
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Agregar headers de seguridad
    await security.security_headers(response)
    
    # Logging de seguridad
    logger.info(
        f"Security Log - IP: {request.client.host} - "
        f"Method: {request.method} - Path: {request.url.path} - "
        f"Status: {response.status_code} - Time: {process_time:.3f}s"
    )
    
    return response
```

## PARCHE PARA: agente_deposito/main_complete.py
```python
# AGREGAR IMPORTS AL INICIO
from shared.auth import get_current_user, require_role, ADMIN_ROLE, DEPOSITO_ROLE
from shared.security_middleware import security_middleware

# AGREGAR MIDDLEWARE DE SEGURIDAD (línea ~70)
app.middleware("http")(security_middleware)

# MODIFICAR ENDPOINTS PARA REQUERIR AUTENTICACIÓN:

# Endpoints que requieren rol ADMIN
@app.post("/productos", response_model=ProductoResponse, dependencies=[Depends(require_role(ADMIN_ROLE))])
@app.put("/productos/{producto_id}", response_model=ProductoResponse, dependencies=[Depends(require_role(ADMIN_ROLE))])
@app.delete("/productos/{producto_id}", dependencies=[Depends(require_role(ADMIN_ROLE))])

# Endpoints que requieren rol DEPOSITO o ADMIN
@app.get("/productos", response_model=PaginatedResponse, dependencies=[Depends(get_current_user)])
@app.get("/productos/{producto_id}", response_model=ProductoResponse, dependencies=[Depends(get_current_user)])
@app.post("/stock/update", dependencies=[Depends(require_role(DEPOSITO_ROLE))])
@app.post("/stock/adjust", dependencies=[Depends(require_role(DEPOSITO_ROLE))])

# Health check público pero con logging de seguridad
@app.get("/health")
async def health_check(request: Request):
    logger.info(f"Health check from IP: {request.client.host}")
    # ... resto del código
```

## PARCHE PARA: agente_negocio/main_complete.py
```python
# AGREGAR IMPORTS AL INICIO
from shared.auth import get_current_user, require_role, ADMIN_ROLE, NEGOCIO_ROLE
from shared.security_middleware import security_middleware

# AGREGAR MIDDLEWARE DE SEGURIDAD
app.middleware("http")(security_middleware)

# PROTEGER ENDPOINTS CRÍTICOS:
@app.post("/process-invoice", dependencies=[Depends(require_role(NEGOCIO_ROLE))])
@app.post("/generate-price", dependencies=[Depends(require_role(NEGOCIO_ROLE))])
@app.post("/ocr/extract", dependencies=[Depends(require_role(NEGOCIO_ROLE))])
```

## PARCHE PARA: ml/main_ml_service.py
```python
# AGREGAR IMPORTS AL INICIO
from shared.auth import get_current_user, require_role, ADMIN_ROLE, ML_ROLE
from shared.security_middleware import security_middleware

# AGREGAR MIDDLEWARE DE SEGURIDAD
app.middleware("http")(security_middleware)

# PROTEGER ENDPOINTS DE ML:
@app.post("/predict", dependencies=[Depends(require_role(ML_ROLE))])
@app.post("/train", dependencies=[Depends(require_role(ADMIN_ROLE))])
@app.delete("/models/{model_name}", dependencies=[Depends(require_role(ADMIN_ROLE))])
@app.get("/models", dependencies=[Depends(get_current_user)])
```

## CONFIGURACIÓN CORS SEGURA
```python
# REEMPLAZAR EN TODOS LOS SERVICIOS:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],  # Específico por entorno
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Métodos específicos
    allow_headers=["Authorization", "Content-Type"],  # Headers específicos
)
```

## VARIABLES DE ENTORNO REQUERIDAS (.env)
```bash
# Seguridad JWT
JWT_SECRET_KEY=tu-clave-super-secreta-en-produccion-256-bits
JWT_ALGORITHM=HS256

# Base de datos (NO hardcodear)
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# AFIP (usar archivos seguros)
AFIP_CUIT=20123456789
AFIP_PRIVATE_KEY_PATH=/secure/path/private_key.pem
AFIP_CERTIFICATE_PATH=/secure/path/certificate.crt

# Redis para rate limiting
REDIS_URL=redis://localhost:6379/1

# CORS por entorno
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## ENDPOINT DE AUTENTICACIÓN (NUEVO)
```python
# AGREGAR A: shared/auth_endpoints.py
@app.post("/auth/login")
async def login(username: str, password: str):
    # Verificar credenciales (implementar con base de datos)
    if verify_user_credentials(username, password):
        token_data = {
            "sub": username,
            "role": get_user_role(username),
            "iat": datetime.utcnow()
        }
        token = auth_manager.create_access_token(token_data)
        return {"access_token": token, "token_type": "bearer"}
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas"
    )
```

## INSTRUCCIONES DE IMPLEMENTACIÓN:

1. **INMEDIATO**: Crear archivos shared/auth.py y shared/security_middleware.py
2. **CRÍTICO**: Aplicar parches a todos los archivos main_complete.py
3. **URGENTE**: Configurar variables de entorno seguras
4. **ESENCIAL**: Implementar endpoint de login
5. **VITAL**: Configurar CORS restrictivo por entorno

⚠️ **ADVERTENCIA**: Sin estos parches, el sistema permanece COMPLETAMENTE VULNERABLE a ataques externos.
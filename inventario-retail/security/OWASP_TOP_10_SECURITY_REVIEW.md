# 🛡️ OWASP Top 10 Security Review - Mini Market Dashboard

**Versión:** 1.0.0  
**Status:** Implementation & Testing  
**Framework:** OWASP Top 10 (2021)  
**Objetivo:** Validar protecciones contra vulnerabilidades comunes

---

## 📋 Tabla de Contenidos

1. [Overview](#overview)
2. [OWASP Top 10 Review](#owasp-top-10-review)
3. [Testing Methodology](#testing-methodology)
4. [Vulnerability Checklist](#vulnerability-checklist)
5. [Remediation Guide](#remediation-guide)
6. [Testing Tools](#testing-tools)

---

## 🎯 Overview

### Scope
```
✅ FastAPI Dashboard (inventario-retail/web_dashboard/)
✅ API Endpoints (/api/*)
✅ Database Layer (PostgreSQL)
✅ Authentication Headers (X-API-Key)
✅ Encryption Implementation
✅ File Upload Handlers
✅ External Integrations
```

### Testing Coverage
- **Manual Testing:** Input validation, auth/authz boundaries
- **Automated Testing:** SQL injection, XSS, CSRF payloads
- **Configuration Review:** Security headers, CORS, TLS
- **Dependency Scan:** Known vulnerabilities in libraries

---

## 🔒 OWASP Top 10 (2021) Review

### 1️⃣ **A01:2021 – Broken Access Control**

#### Vulnerabilidades a Testear
```python
# ✅ 1.1 - Missing Authentication on Protected Endpoints
GET /api/inventory            # Sin X-API-Key
GET /api/metrics              # Sin X-API-Key
GET /api/system/config        # Sin X-API-Key
POST /api/data/export         # Sin X-API-Key

# ✅ 1.2 - Horizontal Privilege Escalation
# User A intenta acceder a datos de User B
GET /api/inventory?user_id=another_user

# ✅ 1.3 - Vertical Privilege Escalation
# Operator intenta acceder a admin endpoints
POST /api/system/permissions
POST /api/encryption/key-rotation
DELETE /api/users/admin_user

# ✅ 1.4 - CORS Misconfiguration
OPTIONS /api/inventory        # Header Access-Control-Allow-Origin

# ✅ 1.5 - JWT/Token Issues
# Token expirado, token inválido, token sin firma
Authorization: Bearer expired_token
Authorization: Bearer malformed_token
Authorization: Bearer signed_by_different_key
```

#### Tests a Implementar
```bash
# Test 1: Verificar que sin API Key se rechaza
curl -X GET http://localhost:8080/api/inventory
# Esperado: 401 Unauthorized

# Test 2: Verificar CORS headers
curl -X OPTIONS http://localhost:8080/api/inventory \
  -H "Origin: https://evil.com"
# Esperado: No Access-Control headers o solo allowed origins

# Test 3: Horizontal escalation
curl -X GET "http://localhost:8080/api/inventory?user_id=other_user" \
  -H "X-API-Key: user_api_key"
# Esperado: 403 Forbidden

# Test 4: Rate limiting en login
for i in {1..100}; do
  curl -X POST http://localhost:8080/api/auth/login \
    -d '{"user":"admin","pass":"wrong"}' &
done
# Esperado: 429 Too Many Requests después de N intentos
```

#### Remediation
```python
# ✅ Middleware de autenticación
class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api"):
            api_key = request.headers.get("X-API-Key")
            if not api_key:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Missing API Key"}
                )
            # Validar API key en BD/cache
            user = await validate_api_key(api_key)
            if not user:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid API Key"}
                )
            request.state.user = user
        return await call_next(request)

# ✅ CORS restrictivo
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dashboard.minimarket.local",
        "https://admin.minimarket.local"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["X-API-Key", "Content-Type"],
)

# ✅ Rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest):
    # Logic aquí
    pass

# ✅ Input validation
@app.get("/api/inventory")
async def get_inventory(
    user_id: Optional[str] = Query(None, regex="^[a-zA-Z0-9_-]{1,50}$"),
    request: Request = Depends(),
):
    # Solo el usuario puede ver sus datos
    if request.state.user.id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return {"data": [...]}
```

---

### 2️⃣ **A02:2021 – Cryptographic Failures**

#### Vulnerabilidades a Testear
```python
# ✅ 2.1 - Datos sensibles en tránsito sin TLS
GET http://dashboard.local/api/system/config  # HTTP, no HTTPS

# ✅ 2.2 - TLS débil (< 1.2)
# Conectar con TLS 1.0, 1.1

# ✅ 2.3 - Claves encriptación débiles
# AES-128, DES, o algoritmos deprecated

# ✅ 2.4 - Hardcoded keys
grep -r "ENCRYPTION_KEY" --include="*.py"
# Si encuentra key en código fuente

# ✅ 2.5 - Hashing débil para passwords
# MD5, SHA1 sin salt
```

#### Tests a Implementar
```bash
# Test 1: Verificar HTTPS forzado
curl -I http://localhost:8080/api/inventory
# Esperado: 301/308 redirect a HTTPS

# Test 2: Verificar TLS version
openssl s_client -connect localhost:8443 -tls1
# Esperado: Connection refused (no TLS 1.0)

openssl s_client -connect localhost:8443 -tls1_2
# Esperado: Connection established

# Test 3: Verificar cipher strength
nmap --script ssl-enum-ciphers -p 8443 localhost
# Esperado: Solo HIGH/VERY_HIGH strength ciphers

# Test 4: Verificar HSTS header
curl -I https://localhost:8080/api/inventory
# Esperado: Strict-Transport-Security: max-age=31536000
```

#### Remediation
```python
# ✅ Forzar HTTPS
class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.scheme != "https":
            return RedirectResponse(
                url=request.url.replace(scheme="https"),
                status_code=308
            )
        return await call_next(request)

# ✅ HSTS header
@app.middleware("http")
async def add_hsts_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains; preload"
    )
    return response

# ✅ Usar encryption keys desde env/secrets
import os
from cryptography.fernet import Fernet

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise ValueError("ENCRYPTION_KEY not set in environment")

cipher_suite = Fernet(ENCRYPTION_KEY.encode())

# ✅ Usar argon2 para passwords
from argon2 import PasswordHasher

hasher = PasswordHasher()
hashed_password = hasher.hash(password)

# ✅ Verificar todas las claves están en env
class ConfigValidator:
    @staticmethod
    def validate():
        required_keys = [
            "DATABASE_URL",
            "ENCRYPTION_KEY",
            "DASHBOARD_API_KEY",
            "JWT_SECRET"
        ]
        missing = [k for k in required_keys if not os.getenv(k)]
        if missing:
            raise ValueError(f"Missing required env vars: {missing}")
```

---

### 3️⃣ **A03:2021 – Injection**

#### Vulnerabilidades a Testear
```python
# ✅ 3.1 - SQL Injection
GET /api/inventory?search=' OR '1'='1
GET /api/inventory?id=1; DROP TABLE inventory;--

# ✅ 3.2 - NoSQL Injection (si applicable)
GET /api/data?filter={"admin":{"$ne":null}}

# ✅ 3.3 - Command Injection
POST /api/export?format=csv; rm -rf /

# ✅ 3.4 - LDAP Injection
POST /api/auth/ldap?username=*)(uid=*

# ✅ 3.5 - Template Injection
POST /api/template?name={{7*7}}
```

#### Tests a Implementar
```python
# test_sql_injection.py
import pytest
from fastapi.testclient import TestClient

@pytest.mark.security
class TestSQLInjection:
    """Test SQL Injection vulnerabilities"""
    
    @pytest.fixture
    def client(self):
        from inventario-retail.web_dashboard.dashboard_app import app
        return TestClient(app)
    
    def test_search_parameter_injection(self, client):
        """Test SQL injection via search parameter"""
        payloads = [
            "' OR '1'='1",
            "admin'--",
            "1' UNION SELECT * FROM users--",
            "1; DROP TABLE inventory;--"
        ]
        
        for payload in payloads:
            response = client.get(
                f"/api/inventory",
                params={"search": payload},
                headers={"X-API-Key": "test_key"}
            )
            # Debe fallar con 400 Bad Request o similar
            assert response.status_code in [400, 422, 403]
            assert "drop" not in response.text.lower()
    
    def test_id_parameter_injection(self, client):
        """Test SQL injection via ID parameter"""
        response = client.get(
            "/api/inventory/1; DELETE FROM inventory;--",
            headers={"X-API-Key": "test_key"}
        )
        assert response.status_code in [400, 404]
    
    def test_parameterized_queries_used(self, client):
        """Verify parameterized queries are used"""
        # Buscar en logs que se usan placeholders (?)
        response = client.get(
            "/api/inventory?search=test' OR '1'='1",
            headers={"X-API-Key": "test_key"}
        )
        # Si system está vulnerable, devolvería todos los records
        # Si usa parameterized queries, devolvería empty o error
        assert response.status_code != 200 or len(response.json()) == 0
```

#### Remediation
```python
# ✅ Usar parameterized queries
# ❌ MAL
query = f"SELECT * FROM inventory WHERE name = '{user_input}'"
result = db.execute(query)

# ✅ BIEN
query = "SELECT * FROM inventory WHERE name = %s"
result = db.execute(query, (user_input,))

# ✅ Con SQLAlchemy ORM
from sqlalchemy import select

stmt = select(Inventory).where(Inventory.name == user_input)
result = session.execute(stmt).scalars()

# ✅ Input validation y sanitización
from sqlalchemy import text

def safe_search(search_term: str) -> str:
    # Validar que solo contiene caracteres seguros
    if not re.match(r"^[a-zA-Z0-9\s\-_.]+$", search_term):
        raise ValueError("Invalid search term")
    return search_term.strip()

@app.get("/api/inventory")
async def search(search: str = Query(..., min_length=1, max_length=100)):
    clean_search = safe_search(search)
    # Usar en query
    pass

# ✅ ORM en lugar de raw SQL
# SQLAlchemy ORM previene injection
from sqlalchemy.orm import Session
from inventario_retail.models import Inventory

def get_inventory(db: Session, item_id: int):
    return db.query(Inventory).filter(
        Inventory.id == item_id
    ).first()
```

---

### 4️⃣ **A04:2021 – Insecure Design**

#### Vulnerabilidades a Testear
```python
# ✅ 4.1 - Missing rate limiting
# Enviar 1000 requests en 1 segundo

# ✅ 4.2 - No account lockout
# 100 failed login attempts without lockout

# ✅ 4.3 - Weak password policy
# Aceptar contraseña de 3 caracteres

# ✅ 4.4 - Missing security logging
# No se registran eventos de seguridad

# ✅ 4.5 - No resource limits
# Solicitar millones de filas sin paginación
```

#### Remediation
```python
# ✅ Rate limiting
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/auth/login")
@limiter.limit("5/minute")  # Max 5 attempts per minute
async def login(credentials: LoginRequest):
    pass

# ✅ Account lockout
from inventario_retail.models import User

async def handle_failed_login(username: str, db: Session):
    user = db.query(User).filter(User.username == username).first()
    if user:
        user.failed_attempts += 1
        if user.failed_attempts >= 5:
            user.is_locked = True
            user.locked_until = datetime.now() + timedelta(minutes=15)
        db.commit()

# ✅ Password policy
def validate_password(password: str) -> bool:
    """Enforce strong password policy"""
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain uppercase")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain lowercase")
    if not re.search(r"[0-9]", password):
        raise ValueError("Password must contain digit")
    if not re.search(r"[!@#$%^&*]", password):
        raise ValueError("Password must contain special character")
    return True

# ✅ Security logging
import logging

security_logger = logging.getLogger("security")

async def log_security_event(
    event_type: str,
    user_id: str,
    status: str,
    details: dict
):
    security_logger.warning(f"[{event_type}] user={user_id} status={status} details={details}")

# ✅ Resource limits
from inventario_retail.models import Inventory

@app.get("/api/inventory")
async def get_inventory(
    skip: int = Query(0, ge=0, le=10000),
    limit: int = Query(10, ge=1, le=100),  # Max 100 per request
):
    query = db.query(Inventory).offset(skip).limit(limit)
    return query.all()
```

---

### 5️⃣ **A05:2021 – Broken Authentication**

#### Vulnerabilidades a Testear
```python
# ✅ 5.1 - Weak credential storage
# Passwords en plain text o weakly hashed

# ✅ 5.2 - Session fixation
# Cookie no regenera después de login

# ✅ 5.3 - Weak session timeout
# Session nunca expira

# ✅ 5.4 - No MFA
# Segunda factor de autenticación

# ✅ 5.5 - Password reuse
# Permitir contraseñas anteriores
```

#### Tests a Implementar
```python
@pytest.mark.security
class TestAuthentication:
    def test_session_timeout(self, client):
        """Verify sessions timeout"""
        response = client.post("/api/auth/login", json={...})
        assert "Set-Cookie" in response.headers
        
        # Wait for timeout
        time.sleep(3600)  # 1 hour
        
        # Try to use old session
        response = client.get("/api/inventory", cookies=...)
        assert response.status_code == 401  # Should require re-auth
    
    def test_password_hashing(self, db: Session):
        """Verify passwords are hashed"""
        user = db.query(User).first()
        # Password field should not be plain text
        assert not user.password_hash.startswith(user.password)
        assert len(user.password_hash) > 50  # Hash es mucho más largo
    
    def test_mfa_enforcement(self, client):
        """Test MFA requirement for sensitive ops"""
        response = client.post(
            "/api/system/key-rotation",
            headers={"X-API-Key": "valid_key"}
        )
        # Should require MFA token
        assert response.status_code == 403
        assert "mfa" in response.json()["detail"].lower()
```

---

### 6️⃣ **A06:2021 – Vulnerable & Outdated Components**

#### Vulnerabilidades a Testear
```bash
# ✅ 6.1 - Outdated dependencies
pip install pip-audit
pip-audit

# ✅ 6.2 - Unsupported versions
# Python < 3.8, PostgreSQL < 12

# ✅ 6.3 - No dependency scanning in CI/CD
# Check if pipeline runs vulnerability scans
```

#### Remediation
```bash
# ✅ Verificar vulnerabilidades
pip install safety
safety check

# ✅ Actualizar dependencias
pip install --upgrade -r requirements.txt

# ✅ Lock versions
pip freeze > requirements.lock

# ✅ CI/CD scanning
# En .github/workflows/ci.yml:
- name: Scan dependencies
  run: |
    pip install pip-audit
    pip-audit
```

---

### 7️⃣ **A07:2021 – Identification & Authentication Failures**

(Similar a A05 - cubierto arriba)

---

### 8️⃣ **A08:2021 – Software & Data Integrity Failures**

#### Vulnerabilidades a Testear
```python
# ✅ 8.1 - Unsigned artifacts
# Descargar código sin verificar firma

# ✅ 8.2 - CI/CD pipeline compromise
# Build sin verificación de integridad

# ✅ 8.3 - Insecure deserialization
# pickle.loads() en datos no confiables
```

#### Remediation
```python
# ✅ Usar JSON en lugar de pickle
import json
# ✅ BIEN
data = json.loads(user_input)

# ✅ ❌ MAL
import pickle
data = pickle.loads(user_input)  # Puede ejecutar código arbitrario

# ✅ Firmar integridad de datos
import hmac
import hashlib

def sign_data(data: dict, secret: str) -> tuple:
    data_json = json.dumps(data, sort_keys=True)
    signature = hmac.new(
        secret.encode(),
        data_json.encode(),
        hashlib.sha256
    ).hexdigest()
    return data_json, signature

def verify_data(data_json: str, signature: str, secret: str) -> bool:
    expected_sig = hmac.new(
        secret.encode(),
        data_json.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected_sig)
```

---

### 9️⃣ **A09:2021 – Logging & Monitoring Failures**

(Cubierto en AUDIT_TRAIL.md - P2.1)

---

### 🔟 **A10:2021 – Server-Side Request Forgery (SSRF)**

#### Vulnerabilidades a Testear
```python
# ✅ 10.1 - SSRF en webhooks
POST /api/webhooks/callback?url=http://localhost:5432/

# ✅ 10.2 - SSRF en exports
GET /api/export?source=http://internal-admin:8000/

# ✅ 10.3 - XML External Entities (XXE)
POST /api/upload/xml
Content: <?xml version="1.0"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
```

#### Remediation
```python
# ✅ Whitelist URLs permitidas
ALLOWED_DOMAINS = [
    "minimarket-api.local",
    "backup-service.local"
]

def validate_url(url: str) -> bool:
    from urllib.parse import urlparse
    parsed = urlparse(url)
    
    if parsed.scheme not in ["https"]:
        return False
    
    if parsed.hostname not in ALLOWED_DOMAINS:
        return False
    
    if parsed.port and parsed.port not in [443]:
        return False
    
    return True

@app.post("/api/webhooks/callback")
async def webhook_callback(webhook_url: str):
    if not validate_url(webhook_url):
        raise HTTPException(status_code=400, detail="Invalid webhook URL")
    # Procesar...

# ✅ Deshabilitar XXE parsing
from xml.etree import ElementTree as ET
from defusedxml.ElementTree import parse

# ✅ BIEN
tree = parse(xml_file)

# ✅ ❌ MAL
tree = ET.parse(xml_file)  # Vulnerable a XXE
```

---

## 🧪 Testing Methodology

### Automated Testing Framework
```python
# tests/security/test_owasp_top_10.py

import pytest
from fastapi.testclient import TestClient
import time

class TestOWASPTop10:
    """Comprehensive OWASP Top 10 testing"""
    
    @pytest.fixture
    def client(self):
        from inventario-retail.web_dashboard.dashboard_app import app
        return TestClient(app)
    
    # Pruebas para cada categoría...
    def test_broken_access_control(self, client):
        pass
    
    def test_cryptographic_failures(self, client):
        pass
    
    def test_injection(self, client):
        pass
    
    # etc.
```

---

## ✅ Vulnerability Checklist

```
BROKEN ACCESS CONTROL (A01)
  ☐ Autenticación requerida en /api/*
  ☐ CORS configurado restrictivamente
  ☐ Rate limiting en endpoints críticos
  ☐ Verificación horizontal de permisos
  ☐ Logs de acceso denegado
  
CRYPTOGRAPHIC FAILURES (A02)
  ☐ HTTPS forzado (redirect 301/308)
  ☐ TLS 1.2+ únicamente
  ☐ HSTS header presente
  ☐ Claves en variables de entorno
  ☐ Hashing fuerte (Argon2)
  
INJECTION (A03)
  ☐ Parameterized queries
  ☐ Input validation y sanitización
  ☐ ORM en lugar de raw SQL
  ☐ Template escaping
  ☐ Command injection checks
  
INSECURE DESIGN (A04)
  ☐ Rate limiting implementado
  ☐ Account lockout después de N intentos
  ☐ Password policy enforcement
  ☐ Security logging configurado
  ☐ Resource limits (pagination)
  
BROKEN AUTHENTICATION (A05)
  ☐ Passwords hashed (Argon2)
  ☐ Session timeout configurado
  ☐ MFA para operaciones sensibles
  ☐ Password history check
  ☐ No session fixation
  
VULNERABLE COMPONENTS (A06)
  ☐ Dependencias actualizadas
  ☐ pip-audit sin vulnerabilidades
  ☐ Python 3.9+
  ☐ PostgreSQL 13+
  ☐ TLS library actualizado
  
IDENTIFICATION FAILURES (A07)
  ☐ (Ver A05)
  
INTEGRITY FAILURES (A08)
  ☐ JSON en lugar de pickle
  ☐ Signado de datos sensibles
  ☐ Verificación de integridad
  
LOGGING FAILURES (A09)
  ☐ Audit trail logging
  ☐ Security events captured
  ☐ Logs protegidos
  ☐ No passwords en logs
  
SSRF (A10)
  ☐ URL whitelist
  ☐ XXE disabled
  ☐ Validación de protocolo
  ☐ Validación de puerto
```

---

**Próximo paso:** Implementar test suite y ejecutar validaciones

Status: 🚀 Listo para testing automatizado

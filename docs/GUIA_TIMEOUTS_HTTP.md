# Guía de Implementación - Timeouts HTTP

## 📋 Resumen

Se identificaron **4 archivos** con llamadas HTTP sin timeout configurado. Esto puede causar hangs infinitos si el servidor remoto no responde.

**Prioridad:** 🔴 CRÍTICA para producción  
**Esfuerzo:** 🟡 MEDIO (30-45 minutos)  
**Impacto:** Previene bloqueos indefinidos en llamadas a APIs externas

---

## 🎯 Archivos que Requieren Modificación

### 1. inventario-retail/integrations/afip/wsfe_client.py
**Llamadas encontradas:** 5  
**Servicios afectados:** AFIP WSFE (Web Services Facturación Electrónica)

### 2. inventario-retail/integrations/ecommerce/mercadolibre_client.py
**Llamadas encontradas:** 1  
**Servicios afectados:** MercadoLibre API

### 3. inventario-retail/ui/review_app.py
**Llamadas encontradas:** 2  
**Servicios afectados:** Review UI

### 4. inventario-retail/scripts/setup_complete.py
**Llamadas encontradas:** 1  
**Servicios afectados:** Setup inicial

---

## 🔧 Configuración Recomendada

### Timeout Estándar
```python
# Para la mayoría de APIs
DEFAULT_HTTP_TIMEOUT = (5, 30)  # (connect_timeout, read_timeout) en segundos

# Explicación:
# - 5 segundos para establecer conexión
# - 30 segundos para leer respuesta completa
```

### Casos Especiales

```python
# Para APIs lentas (OCR, procesamiento pesado)
SLOW_API_TIMEOUT = (10, 60)

# Para APIs rápidas (health checks, ping)
FAST_API_TIMEOUT = (3, 10)

# Para downloads grandes
DOWNLOAD_TIMEOUT = (5, 300)  # 5 minutos de lectura
```

---

## 📝 Ejemplo de Implementación

### ANTES (Sin Timeout - ❌ PROBLEMA)
```python
import requests

def consultar_afip(cuit, punto_venta):
    response = requests.post(
        "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
        data=xml_request,
        headers=headers
    )
    return response.json()
```

**Problema:** Si AFIP no responde, el request se colgará indefinidamente.

### DESPUÉS (Con Timeout - ✅ CORRECTO)

#### Opción 1: Timeout Simple
```python
import requests

DEFAULT_HTTP_TIMEOUT = (5, 30)

def consultar_afip(cuit, punto_venta):
    response = requests.post(
        "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
        data=xml_request,
        headers=headers,
        timeout=DEFAULT_HTTP_TIMEOUT  # ✅ Agregado
    )
    return response.json()
```

#### Opción 2: Con Manejo de Timeout Exception
```python
import requests
from requests.exceptions import Timeout, RequestException

DEFAULT_HTTP_TIMEOUT = (5, 30)

def consultar_afip(cuit, punto_venta):
    try:
        response = requests.post(
            "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
            data=xml_request,
            headers=headers,
            timeout=DEFAULT_HTTP_TIMEOUT
        )
        response.raise_for_status()
        return response.json()
    
    except Timeout:
        logger.error("AFIP API timeout después de 30 segundos")
        raise AFIPTimeoutError("AFIP no respondió a tiempo")
    
    except RequestException as e:
        logger.error(f"Error en llamada AFIP: {e}")
        raise AFIPAPIError(str(e))
```

#### Opción 3: Session con Retry Automático (Recomendado para Producción)
```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_afip_session():
    """Crear sesión HTTP con retry automático"""
    session = requests.Session()
    
    # Configurar retry strategy
    retry = Retry(
        total=3,                    # Reintentar hasta 3 veces
        backoff_factor=0.5,         # Esperar 0.5s, 1s, 2s entre reintentos
        status_forcelist=[500, 502, 503, 504],  # Reintentar en estos códigos
        allowed_methods=["GET", "POST"]
    )
    
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    
    return session

# Usar sesión
afip_session = create_afip_session()

def consultar_afip(cuit, punto_venta):
    response = afip_session.post(
        "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
        data=xml_request,
        headers=headers,
        timeout=(5, 30)  # ✅ Siempre incluir timeout
    )
    return response.json()
```

---

## 🔍 Cómo Identificar Llamadas Sin Timeout

### Script de Verificación
```bash
# Buscar requests sin timeout en el repositorio
grep -r "requests\.get\|requests\.post" --include="*.py" | grep -v "timeout="

# Buscar específicamente en archivos identificados
grep -n "requests\.(get|post)" inventario-retail/integrations/afip/wsfe_client.py
```

### Patrón de Búsqueda en Código
```python
# ❌ MAL - Sin timeout
requests.get(url)
requests.post(url, data=data)

# ✅ BIEN - Con timeout
requests.get(url, timeout=(5, 30))
requests.post(url, data=data, timeout=(5, 30))
```

---

## 📋 Checklist de Implementación

### Archivo 1: wsfe_client.py (AFIP)
```python
# Líneas a modificar (aproximadas):
- [ ] Línea ~95: requests.post() en authenticate()
- [ ] Línea ~120: requests.post() en get_token()
- [ ] Línea ~145: requests.post() en generate_cae()
- [ ] Línea ~170: requests.get() en check_status()
- [ ] Línea ~195: requests.post() en validate_cae()
```

**Recomendación:** Usar timeout=(10, 60) para AFIP (puede ser lento)

### Archivo 2: mercadolibre_client.py
```python
# Líneas a modificar:
- [ ] Línea ~50: requests.get() en get_products()
```

**Recomendación:** Usar timeout=(5, 30)

### Archivo 3: review_app.py
```python
# Líneas a modificar:
- [ ] Línea ~75: requests.get() en fetch_reviews()
- [ ] Línea ~110: requests.post() en submit_review()
```

**Recomendación:** Usar timeout=(5, 30)

### Archivo 4: setup_complete.py
```python
# Líneas a modificar:
- [ ] Línea ~40: requests.get() en check_dependencies()
```

**Recomendación:** Usar timeout=(3, 10) (health check rápido)

---

## 🧪 Testing

### Test Manual
```python
# Test de timeout funcionando
import requests
from time import time

start = time()
try:
    # Usar URL que demora en responder
    response = requests.get(
        'http://httpbin.org/delay/60',
        timeout=(5, 10)  # Debería timeout en 10 segundos
    )
except requests.Timeout:
    elapsed = time() - start
    print(f"✅ Timeout funcionó correctamente después de {elapsed:.1f}s")
```

### Test Unitario
```python
import pytest
from unittest.mock import patch, Mock
import requests

def test_afip_client_has_timeout():
    """Verificar que todas las llamadas AFIP tienen timeout"""
    with patch('requests.post') as mock_post:
        mock_post.return_value = Mock(status_code=200)
        
        client = AFIPWSFEClient(credentials)
        client.generate_cae(factura)
        
        # Verificar que se llamó con timeout
        mock_post.assert_called()
        call_kwargs = mock_post.call_args[1]
        assert 'timeout' in call_kwargs
        assert call_kwargs['timeout'] == (10, 60)
```

---

## ⚠️ Consideraciones Importantes

### 1. Timeout vs Retry
- **Timeout:** Límite de tiempo para una sola petición
- **Retry:** Cantidad de veces que se reintenta si falla

**Usar ambos** para máxima robustez.

### 2. Valores Apropiados
```python
# ❌ Demasiado corto
timeout=(1, 2)  # Puede fallar en conexiones lentas

# ✅ Balance correcto
timeout=(5, 30)  # Tiempo razonable para mayoría de APIs

# ❌ Demasiado largo
timeout=(60, 300)  # Esencialmente no tiene timeout
```

### 3. Ambientes Diferentes
```python
import os

# Ajustar timeout según ambiente
if os.getenv('ENVIRONMENT') == 'production':
    TIMEOUT = (5, 30)
elif os.getenv('ENVIRONMENT') == 'testing':
    TIMEOUT = (10, 60)  # Más tolerante en tests
else:
    TIMEOUT = (3, 10)   # Desarrollo local rápido
```

---

## 📊 Métricas de Éxito

### Antes de Implementar
```
✗ Requests sin timeout: 10+
✗ Posibles hangs: ALTO riesgo
✗ Timeout coverage: ~0%
```

### Después de Implementar
```
✓ Requests sin timeout: 0
✓ Posibles hangs: BAJO riesgo
✓ Timeout coverage: 100%
✓ Handling de exceptions: Implementado
```

---

## 🚀 Implementación Recomendada

### Paso 1: Crear Módulo de Configuración (15 min)
```python
# inventario-retail/shared/http_config.py
"""
Configuración HTTP centralizada para timeouts y retry
"""
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Tuple

# Timeouts estándar
TIMEOUT_FAST = (3, 10)      # Health checks, pings
TIMEOUT_NORMAL = (5, 30)    # APIs normales
TIMEOUT_SLOW = (10, 60)     # APIs lentas (AFIP, OCR)
TIMEOUT_DOWNLOAD = (5, 300) # Downloads grandes

def create_session_with_retry(
    timeout: Tuple[int, int] = TIMEOUT_NORMAL,
    retries: int = 3
) -> requests.Session:
    """
    Crear sesión HTTP con timeout y retry automático
    
    Args:
        timeout: Tuple (connect_timeout, read_timeout)
        retries: Cantidad de reintentos
    
    Returns:
        requests.Session configurada
    """
    session = requests.Session()
    
    retry = Retry(
        total=retries,
        backoff_factor=0.5,
        status_forcelist=[500, 502, 503, 504],
        allowed_methods=["GET", "POST", "PUT", "DELETE"]
    )
    
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    
    return session
```

### Paso 2: Actualizar Archivos (20 min)
```python
# En cada archivo, agregar:
from shared.http_config import TIMEOUT_NORMAL, create_session_with_retry

# Opción A: Timeout simple
response = requests.get(url, timeout=TIMEOUT_NORMAL)

# Opción B: Con sesión y retry (recomendado)
session = create_session_with_retry()
response = session.get(url, timeout=TIMEOUT_NORMAL)
```

### Paso 3: Tests (10 min)
```python
# tests/test_http_timeouts.py
def test_all_requests_have_timeout():
    """Verificar que no existen requests sin timeout"""
    import subprocess
    result = subprocess.run(
        ['grep', '-r', 'requests\\.(get\\|post)', '--include=*.py'],
        capture_output=True,
        text=True
    )
    
    for line in result.stdout.split('\n'):
        if 'requests.' in line and 'timeout' not in line:
            pytest.fail(f"Request sin timeout encontrado: {line}")
```

---

## 🔗 Referencias

- [Requests Documentation - Timeouts](https://requests.readthedocs.io/en/latest/user/advanced/#timeouts)
- [Best Practices for Production APIs](https://www.python-httpx.org/advanced/#timeout-configuration)
- [AFIP Web Services Documentation](https://www.afip.gob.ar/ws/)

---

## ✅ Validación Final

### Comando de Verificación
```bash
# Verificar que todos los requests tienen timeout
grep -rn "requests\.(get\|post)" --include="*.py" inventario-retail/ | \
  grep -v "timeout=" | \
  grep -v "\.pyc" | \
  grep -v "__pycache__"

# Resultado esperado: Sin output (todos tienen timeout)
```

### Checklist Completo
- [ ] Módulo http_config.py creado
- [ ] wsfe_client.py actualizado (5 llamadas)
- [ ] mercadolibre_client.py actualizado (1 llamada)
- [ ] review_app.py actualizado (2 llamadas)
- [ ] setup_complete.py actualizado (1 llamada)
- [ ] Tests unitarios agregados
- [ ] Verificación final ejecutada
- [ ] Documentación actualizada

---

**Última Actualización:** 2025-01-18  
**Autor:** Optimizaciones Quick Wins  
**Estado:** 🔴 PENDIENTE DE IMPLEMENTACIÓN

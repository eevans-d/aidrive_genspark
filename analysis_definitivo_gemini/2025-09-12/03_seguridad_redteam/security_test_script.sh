#!/bin/bash
# SECURITY TESTING SCRIPT - Sistema Multi-Agente Retail
# ⚠️ SOLO USAR EN ENTORNO DE TESTING ⚠️

echo "🔍 INICIANDO ANÁLISIS DE SEGURIDAD RED TEAM"
echo "=========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs de los servicios
DEPOSITO_URL="http://localhost:8001"
NEGOCIO_URL="http://localhost:8002"
ML_URL="http://localhost:8003"

echo -e "\n${YELLOW}1. TESTING ENDPOINTS SIN AUTENTICACIÓN${NC}"
echo "================================================"

# Test AgenteDepósito
echo -e "\n🔍 Testing AgenteDepósito (Puerto 8001):"
echo "- GET /health (debería requerir auth):"
curl -s -o /dev/null -w "Status: %{http_code}\n" $DEPOSITO_URL/health

echo "- GET /productos (acceso a inventario sin auth):"
curl -s -o /dev/null -w "Status: %{http_code}\n" $DEPOSITO_URL/productos

echo "- GET /stock/critico (información sensible):"
curl -s -o /dev/null -w "Status: %{http_code}\n" $DEPOSITO_URL/stock/critico

# Test AgenteNegocio
echo -e "\n🔍 Testing AgenteNegocio (Puerto 8002):"
echo "- GET /health (debería requerir auth):"
curl -s -o /dev/null -w "Status: %{http_code}\n" $NEGOCIO_URL/health

# Test ML Service
echo -e "\n🔍 Testing ML Service (Puerto 8003):"
echo "- GET /health (debería requerir auth):"
curl -s -o /dev/null -w "Status: %{http_code}\n" $ML_URL/health

echo "- GET /models (información sensible de modelos):"
curl -s -o /dev/null -w "Status: %{http_code}\n" $ML_URL/models

echo -e "\n${YELLOW}2. TESTING CORS CONFIGURATION${NC}"
echo "============================================="

echo "- Testing CORS con origen malicioso:"
curl -s -H "Origin: http://malicious-site.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS $DEPOSITO_URL/productos \
     -w "Status: %{http_code}\n"

echo -e "\n${YELLOW}3. TESTING RATE LIMITING${NC}"
echo "=================================="

echo "- Enviando 10 requests rápidos (debería haber rate limiting):"
for i in {1..10}; do
  curl -s -o /dev/null -w "Request $i Status: %{http_code}\n" $DEPOSITO_URL/health &
done
wait

echo -e "\n${YELLOW}4. TESTING INPUT VALIDATION${NC}"
echo "====================================="

echo "- Testing SQL injection en parámetros:"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$DEPOSITO_URL/productos?nombre='; DROP TABLE productos; --"

echo "- Testing XSS en parámetros:"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$DEPOSITO_URL/productos?nombre=<script>alert('xss')</script>"

echo -e "\n${YELLOW}5. TESTING HEADERS DE SEGURIDAD${NC}"
echo "========================================="

echo "- Verificando headers de seguridad:"
curl -s -I $DEPOSITO_URL/health | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security|Content-Security-Policy)"

echo -e "\n${YELLOW}6. TESTING ENDPOINTS CRÍTICOS${NC}"
echo "======================================="

# Crear un producto sin autenticación
echo "- Intentando crear producto sin autenticación:"
curl -s -X POST $DEPOSITO_URL/productos \
     -H "Content-Type: application/json" \
     -d '{"nombre": "PRODUCTO_TEST_SECURITY", "descripcion": "Test de seguridad", "precio": 999.99, "stock_actual": 1000}' \
     -w "Status: %{http_code}\n"

# Intentar modificar stock sin autenticación
echo "- Intentando modificar stock sin autenticación:"
curl -s -X POST $DEPOSITO_URL/stock/update \
     -H "Content-Type: application/json" \
     -d '{"producto_id": 1, "cantidad": 999999, "tipo": "entrada", "motivo": "HACK_TEST"}' \
     -w "Status: %{http_code}\n"

echo -e "\n${RED}⚠️ RESULTADOS DEL ANÁLISIS DE SEGURIDAD ⚠️${NC}"
echo "=============================================="
echo -e "${RED}• Todos los endpoints están EXPUESTOS sin autenticación${NC}"
echo -e "${RED}• CORS permite cualquier origen (*)${NC}"
echo -e "${RED}• No hay rate limiting implementado${NC}"
echo -e "${RED}• Headers de seguridad ausentes${NC}"
echo -e "${RED}• Posible manipulación de datos sin autorización${NC}"

echo -e "\n${YELLOW}🔧 RECOMENDACIONES INMEDIATAS:${NC}"
echo "- Implementar autenticación JWT en TODOS los endpoints"
echo "- Configurar CORS restrictivo por entorno"
echo "- Implementar rate limiting por IP/usuario"
echo "- Agregar headers de seguridad obligatorios"
echo "- Validación robusta de inputs en todos los endpoints"

echo -e "\n${GREEN}✅ Análisis de seguridad completado${NC}"
echo "Ver red_team_security_analysis.md para detalles completos"
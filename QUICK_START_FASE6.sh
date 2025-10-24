#!/bin/bash

# Quick Start - aidrive_genspark Complete Stack
# Oct 24, 2025 - FASE 6 Complete

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  aidrive_genspark - Quick Start (FASE 6 Complete) ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}\n"

# Check prerequisites
echo -e "${YELLOW}[1/5] Verificando prerrequisitos...${NC}"
command -v docker &> /dev/null || { echo "❌ Docker no está instalado"; exit 1; }
command -v docker-compose &> /dev/null || { echo "❌ Docker Compose no está instalado"; exit 1; }
echo -e "${GREEN}✅ Docker & Docker Compose verificados${NC}\n"

# Load environment variables
echo -e "${YELLOW}[2/5] Configurando variables de environment...${NC}"
export DASHBOARD_API_KEY="${DASHBOARD_API_KEY:-dev-api-key-12345}"
export DASHBOARD_RATELIMIT_ENABLED="${DASHBOARD_RATELIMIT_ENABLED:-true}"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@postgres:5432/minimarket}"
export REDIS_URL="${REDIS_URL:-redis://redis:6379/0}"
echo -e "${GREEN}✅ Variables configuradas${NC}\n"

# Start Production Stack
echo -e "${YELLOW}[3/5] Iniciando stack de producción...${NC}"
echo "  Servicios: Dashboard, PostgreSQL, Redis, NGINX"
cd "$PROJECT_ROOT/inventario-retail"
docker-compose -f docker-compose.production.yml up -d
echo -e "${GREEN}✅ Stack de producción iniciado${NC}\n"

# Wait for services to be ready
echo -e "${YELLOW}[4/5] Esperando que los servicios estén listos...${NC}"
sleep 5
for i in {1..30}; do
  if curl -s -H "X-API-Key: $DASHBOARD_API_KEY" http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dashboard está listo${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Dashboard no respondió en tiempo"
    exit 1
  fi
  sleep 1
done

# Start Monitoring Stack
echo -e "${YELLOW}[5/5] Iniciando stack de monitoreo...${NC}"
echo "  Servicios: Prometheus, Grafana, AlertManager, Node Exporter"
docker-compose -f docker-compose.monitoring.yml up -d
sleep 3
echo -e "${GREEN}✅ Stack de monitoreo iniciado${NC}\n"

# Display access information
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 STACK COMPLETAMENTE INICIADO       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}📍 Acceso a Servicios:${NC}"
echo -e "  Dashboard API:    http://localhost:8080"
echo -e "  API Key:          $DASHBOARD_API_KEY"
echo -e "  Health Check:     http://localhost:8080/api/health"
echo ""
echo -e "${BLUE}📊 Monitoreo:${NC}"
echo -e "  Prometheus:       http://localhost:9090"
echo -e "  Grafana:          http://localhost:3000 (admin/admin)"
echo -e "  AlertManager:     http://localhost:9093"
echo ""
echo -e "${BLUE}💾 Base de Datos:${NC}"
echo -e "  PostgreSQL:       localhost:5432"
echo -e "  Usuario:          postgres"
echo -e "  Contraseña:       postgres"
echo -e "  BD:               minimarket"
echo ""
echo -e "${BLUE}🔌 Redis:${NC}"
echo -e "  Redis:            localhost:6379"
echo ""

# Show commands
echo -e "${YELLOW}📋 Comandos útiles:${NC}"
echo -e "  Ver logs dashboard:     docker logs -f dashboard"
echo -e "  Ver logs DB:            docker logs -f postgres"
echo -e "  Validar monitoreo:      bash scripts/validate_monitoring.sh"
echo -e "  Ejecutar tests:         pytest -q tests/web_dashboard"
echo -e "  Detener stack:          docker-compose down"
echo ""

# Run validation if requested
read -p "¿Ejecutar validación de monitoreo? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
  echo -e "${YELLOW}Ejecutando validación...${NC}\n"
  bash scripts/validate_monitoring.sh
fi

echo -e "\n${GREEN}✨ Stack listo. Accede a http://localhost:8080 para comenzar.${NC}\n"

#!/bin/bash

# =============================================================================
# Script de Setup Automatizado - Mini Market Deployment
# =============================================================================
# Este script ayuda a configurar rápidamente el entorno de desarrollo
# para cualquiera de las 4 plataformas soportadas.
#
# Uso: ./setup.sh [plataforma]
# Plataformas: docker, vercel, railway, aws, all
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
PROJECT_NAME="minimarket"
NODE_VERSION="18"

# Funciones utilitarias
print_header() {
    echo -e "${BLUE}"
    echo "================================================================================"
    echo "                    Mini Market - Setup Automatizado"
    echo "================================================================================"
    echo -e "${NC}"
}

print_step() {
    echo -e "${PURPLE}[PASO $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Verificar requisitos del sistema
check_requirements() {
    print_step "1" "Verificando requisitos del sistema..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado. Versión requerida: $NODE_VERSION+"
        exit 1
    fi
    
    NODE_MAJOR_VERSION=$(node --version | sed 's/v\([0-9]*\).*/\1/')
    if [ "$NODE_MAJOR_VERSION" -lt "$NODE_VERSION" ]; then
        print_error "Node.js versión $NODE_VERSION+ requerida. Versión actual: $(node --version)"
        exit 1
    fi
    print_success "Node.js $(node --version) ✓"
    
    # Verificar npm/pnpm
    if command -v pnpm &> /dev/null; then
        PACKAGE_MANAGER="pnpm"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
    else
        print_error "npm o pnpm no están disponibles"
        exit 1
    fi
    print_success "Package manager: $PACKAGE_MANAGER ✓"
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        print_error "Git no está instalado"
        exit 1
    fi
    print_success "Git $(git --version | cut -d' ' -f3) ✓"
}

# Instalar dependencias globales
install_global_deps() {
    print_step "2" "Instalando dependencias globales..."
    
    case $PLATFORM in
        "docker"|"all")
            if ! command -v docker &> /dev/null; then
                print_warning "Docker no está instalado. Instalando..."
                if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                    curl -fsSL https://get.docker.com -o get-docker.sh
                    sudo sh get-docker.sh
                    sudo usermod -aG docker $USER
                elif [[ "$OSTYPE" == "darwin"* ]]; then
                    print_info "Por favor instala Docker Desktop para MacOS desde https://www.docker.com/products/docker-desktop"
                fi
            fi
            print_success "Docker instalado ✓"
            
            if ! docker compose version &> /dev/null; then
                print_warning "Docker Compose plugin no disponible"
            else
                print_success "Docker Compose ✓"
            fi
            ;;
    esac
    
    case $PLATFORM in
        "vercel"|"all")
            if ! command -v vercel &> /dev/null; then
                print_info "Instalando Vercel CLI..."
                npm install -g vercel
            fi
            print_success "Vercel CLI ✓"
            ;;
    esac
    
    case $PLATFORM in
        "railway"|"all")
            if ! command -v railway &> /dev/null; then
                print_info "Instalando Railway CLI..."
                npm install -g @railway/cli
            fi
            print_success "Railway CLI ✓"
            ;;
    esac
    
    case $PLATFORM in
        "aws"|"all")
            if ! command -v aws &> /dev/null; then
                print_info "AWS CLI no detectado. Instalando..."
                if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
                    unzip awscliv2.zip
                    sudo ./aws/install
                    rm -rf aws awscliv2.zip
                else
                    print_warning "Instala AWS CLI manualmente para tu SO"
                fi
            fi
            print_success "AWS CLI ✓"
            
            if ! command -v sam &> /dev/null; then
                print_info "AWS SAM CLI no detectado. Instalando..."
                print_warning "Instala AWS SAM CLI manualmente"
            fi
            print_success "AWS SAM CLI ✓"
            ;;
    esac
}

# Configurar proyecto frontend
setup_frontend() {
    print_step "3" "Configurando frontend..."
    
    if [ ! -d "minimarket-system" ]; then
        print_info "Frontend no encontrado, clonando..."
        # Aquí iría la lógica para clonar el frontend
        print_warning "Frontend no encontrado. Ejecuta este script desde el directorio raíz del proyecto."
        return 1
    fi
    
    cd minimarket-system
    
    # Instalar dependencias
    print_info "Instalando dependencias del frontend..."
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm install
    else
        npm install
    fi
    
    # Crear archivo .env.local si no existe
    if [ ! -f ".env.local" ]; then
        print_info "Creando archivo .env.local..."
        case $PLATFORM in
            "docker"|"all")
                cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_ENV=development
EOF
                ;;
            "vercel"|"all")
                cat > .env.local << EOF
VITE_API_BASE_URL=https://tu-api-url.vercel.app
VITE_APP_ENV=development
EOF
                ;;
            "railway"|"all")
                cat > .env.local << EOF
VITE_API_BASE_URL=https://tu-app.railway.app
VITE_APP_ENV=development
EOF
                ;;
            "aws"|"all")
                cat > .env.local << EOF
VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
VITE_APP_ENV=development
EOF
                ;;
        esac
    fi
    
    print_success "Frontend configurado ✓"
    cd ..
}

# Configurar backend
setup_backend() {
    print_step "4" "Configurando backend..."
    
    if [ ! -d "backend" ]; then
        print_info "Backend no encontrado, creando estructura..."
        mkdir -p backend/src/{handlers,lib,types}
        mkdir -p backend/prisma
        mkdir -p backend/tests
        
        # Crear estructura básica
        cat > backend/package.json << EOF
{
  "name": "minimarket-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "node prisma/seed.js",
    "test": "jest"
  },
  "dependencies": {
    "@prisma/client": "^5.7.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "prisma": "^5.7.1",
    "tsx": "^4.6.2",
    "jest": "^29.7.0"
  }
}
EOF
    fi
    
    cd backend
    
    # Instalar dependencias
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm install
    else
        npm install
    fi
    
    # Configurar Prisma
    if [ ! -f "prisma/schema.prisma" ]; then
        cat > prisma/schema.prisma << EOF
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Usuario {
  id           String   @id @default(uuid())
  email        String   @unique
  nombre       String
  passwordHash String
  rol          String   @default("usuario")
  activo       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("usuarios")
}

model Categoria {
  id          String     @id @default(uuid())
  nombre      String
  descripcion String?
  activa      Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  productos   Producto[]

  @@map("categorias")
}

model Producto {
  id          String   @id @default(uuid())
  nombre      String
  descripcion String?
  precio      Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  categoriaId String?
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  categoria   Categoria? @relation(fields: [categoriaId], references: [id])

  @@map("productos")
  @@index([categoriaId])
  @@index([activo])
}
EOF
    fi
    
    # Crear archivo .env para backend
    if [ ! -f ".env" ]; then
        case $PLATFORM in
            "docker"|"railway"|"all")
                cat > .env << EOF
DATABASE_URL=postgresql://postgres:minimarket123@localhost:5432/minimarket
JWT_SECRET=development-jwt-secret-key-minimo-32-caracteres-1234567890
NODE_ENV=development
PORT=3001
EOF
                ;;
            "vercel"|"aws")
                cat > .env << EOF
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=production-jwt-secret-key-muy-seguro-32-caracteres-minimo
NODE_ENV=production
PORT=3001
EOF
                ;;
        esac
    fi
    
    print_success "Backend configurado ✓"
    cd ..
}

# Configurar Docker Compose
setup_docker() {
    print_step "5" "Configurando Docker Compose..."
    
    # Crear docker-compose.yml
    if [ ! -f "docker-compose.yml" ]; then
        cat > docker-compose.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ${PROJECT_NAME}_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: minimarket
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: minimarket123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"
    networks:
      - minimarket_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d minimarket"]
      interval: 10s
      timeout: 5s
      retries: 5

  adminer:
    image: adminer:latest
    container_name: ${PROJECT_NAME}_adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    networks:
      - minimarket_network
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
    driver: local

networks:
  minimarket_network:
    driver: bridge
EOF
    fi
    
    # Crear scripts de inicialización
    mkdir -p init-scripts
    cat > init-scripts/01-create-tables.sql << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'usuario',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    categoria_id UUID REFERENCES categorias(id),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
EOF
    
    print_success "Docker Compose configurado ✓"
}

# Configurar scripts útiles
setup_scripts() {
    print_step "6" "Creando scripts útiles..."
    
    # Script de desarrollo
    cat > dev.sh << EOF
#!/bin/bash
echo "🚀 Iniciando desarrollo..."

case $PLATFORM in
    "docker"|"all")
        echo "🐳 Iniciando con Docker..."
        docker compose up -d
        echo "✅ Servicios iniciados:"
        echo "  - Frontend: http://localhost:3000"
        echo "  - Backend: http://localhost:3001"
        echo "  - Adminer: http://localhost:8080"
        ;;
    *)
        echo "💻 Iniciando desarrollo local..."
        cd minimarket-system
        $PACKAGE_MANAGER run dev &
        cd ../backend
        $PACKAGE_MANAGER run dev
        ;;
esac
EOF
    
    chmod +x dev.sh
    
    # Script de producción
    cat > prod.sh << EOF
#!/bin/bash
echo "🏭 Iniciando producción..."

case $PLATFORM in
    "vercel")
        echo "☁️ Desplegando en Vercel..."
        vercel --prod
        ;;
    "railway")
        echo "🚂 Desplegando en Railway..."
        railway up
        ;;
    "aws")
        echo "☁️ Desplegando en AWS..."
        cd backend
        sam build
        sam deploy --no-confirm-changeset
        ;;
    "docker")
        echo "🐳 Buildando con Docker..."
        docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
        ;;
esac
EOF
    
    chmod +x prod.sh
    
    print_success "Scripts creados ✓"
}

# Mostrar resumen final
show_summary() {
    print_step "7" "Resumen de configuración"
    
    echo -e "${GREEN}================================================================================${NC}"
    echo -e "${GREEN}                        ✅ Setup Completado${NC}"
    echo -e "${GREEN}================================================================================${NC}"
    echo ""
    
    echo -e "${CYAN}📁 Estructura del proyecto:${NC}"
    echo "  minimarket-system/    (Frontend React + TypeScript)"
    echo "  backend/              (Backend Node.js + Prisma)"
    echo "  docker-compose.yml    (Configuración Docker)"
    echo "  dev.sh                (Script de desarrollo)"
    echo "  prod.sh               (Script de producción)"
    echo ""
    
    echo -e "${CYAN}🚀 Para iniciar desarrollo:${NC}"
    echo -e "  ${YELLOW}./dev.sh${NC}"
    echo ""
    
    echo -e "${CYAN}🏭 Para producción:${NC}"
    echo -e "  ${YELLOW}./prod.sh${NC}"
    echo ""
    
    echo -e "${CYAN}📚 Documentación:${NC}"
    echo "  Ver README.md para guías detalladas"
    echo ""
    
    echo -e "${CYAN}🌐 URLs de desarrollo:${NC}"
    case $PLATFORM in
        "docker"|"railway"|"all")
            echo "  Frontend:  http://localhost:3000"
            echo "  Backend:   http://localhost:3001"
            echo "  Adminer:   http://localhost:8080"
            echo "  PostgreSQL: localhost:5432"
            ;;
        "vercel")
            echo "  Frontend:  https://tu-app.vercel.app"
            echo "  Base de datos: PlanetScale Dashboard"
            ;;
        "aws")
            echo "  Frontend:  https://tu-distribution.cloudfront.net"
            echo "  API:       https://tu-api-id.execute-api.region.amazonaws.com/prod"
            echo "  RDS:       AWS RDS Console"
            ;;
    esac
    echo ""
    
    echo -e "${YELLOW}⚠️  Próximos pasos:${NC}"
    echo "1. Revisa y ajusta las variables de entorno en .env y .env.local"
    echo "2. Configura las credenciales de base de datos"
    echo "3. Ejecuta las migraciones de Prisma"
    echo "4. Consulta la documentación específica en docs/"
    echo ""
    
    echo -e "${GREEN}🎉 ¡Listo para desarrollar!${NC}"
}

# Mostrar ayuda
show_help() {
    echo "Uso: $0 [opción]"
    echo ""
    echo "Opciones:"
    echo "  docker     Configurar para Docker + PostgreSQL local (desarrollo)"
    echo "  vercel     Configurar para Vercel + PlanetScale"
    echo "  railway    Configurar para Railway + PostgreSQL"
    echo "  aws        Configurar para AWS Lambda + RDS"
    echo "  all        Configurar todas las opciones"
    echo "  help       Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 docker      # Setup para desarrollo local"
    echo "  $0 railway     # Setup para producción simple"
    echo "  $0 vercel      # Setup para máximo performance"
}

# Función principal
main() {
    PLATFORM=${1:-"docker"}
    
    # Validar plataforma
    case $PLATFORM in
        "docker"|"vercel"|"railway"|"aws"|"all"|"help")
            ;;
        *)
            print_error "Plataforma no válida: $PLATFORM"
            show_help
            exit 1
            ;;
    esac
    
    if [ "$PLATFORM" = "help" ]; then
        show_help
        exit 0
    fi
    
    print_header
    print_info "Configurando para plataforma: $PLATFORM"
    echo ""
    
    check_requirements
    install_global_deps
    setup_frontend
    setup_backend
    
    if [ "$PLATFORM" = "docker" ] || [ "$PLATFORM" = "all" ]; then
        setup_docker
    fi
    
    setup_scripts
    show_summary
    
    echo -e "\n${GREEN}¿Ejecutar desarrollo ahora? (y/N)${NC}"
    read -r -t 10 response
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        ./dev.sh
    fi
}

# Ejecutar función principal con todos los argumentos
main "$@"
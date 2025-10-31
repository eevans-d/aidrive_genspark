# Guía de Despliegue: Docker + PostgreSQL Local

## 📋 Resumen
Esta guía explica cómo ejecutar la aplicación React + TypeScript localmente usando Docker con PostgreSQL en contenedores. Ideal para desarrollo local, testing y entornos staging.

## 🛠️ Stack Tecnológico
- **Frontend**: React + TypeScript + Vite
- **Base de Datos**: PostgreSQL en contenedor Docker
- **Contenedores**: Docker Compose
- **ORM**: Prisma con PostgreSQL
- **Servidor de Desarrollo**: Vite Dev Server

## 🏗️ Arquitectura Local
```
┌─────────────────────────┐
│    React Frontend       │
│   (Vite Dev Server)     │
│     Puerto: 3000        │
└─────────────┬───────────┘
              │
              │ HTTP
              ▼
┌─────────────────────────┐
│   PostgreSQL Database   │
│     Puerto: 5432        │
│   Puerto Admin: 8080    │
└─────────────────────────┘
```

## 🔧 Configuración Previa

### 1. Instalar Docker y Docker Compose

#### Ubuntu/Debian
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Agregar GPG key de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Agregar repositorio Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Verificar instalación
docker --version
docker compose version

# Habilitar servicio Docker
sudo systemctl enable docker
sudo systemctl start docker
```

#### macOS
```bash
# Con Homebrew
brew install --cask docker

# O descargar Docker Desktop desde https://www.docker.com/products/docker-desktop

# Verificar instalación
docker --version
docker compose version
```

#### Windows
```bash
# Descargar Docker Desktop desde https://www.docker.com/products/docker-desktop

# Verificar instalación en PowerShell
docker --version
docker compose version
```

### 2. Verificar Instalación
```bash
# Verificar Docker daemon
docker info

# Test con contenedor hello-world
docker run hello-world

# Verificar Docker Compose
docker compose version

# Test de PostgreSQL (sin persistencia)
docker run --name test-postgres -e POSTGRES_PASSWORD=test -p 5432:5432 -d postgres:15
docker exec -it test-postgres psql -U postgres -c "SELECT version();"
docker stop test-postgres
docker rm test-postgres
```

## 🐳 Configuración de Docker Compose

### 1. Estructura del Proyecto
```
minimarket-docker/
├── docker-compose.yml
├── docker-compose.override.yml
├── docker-compose.prod.yml
├── .env
├── .env.local
├── backend/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   └── package.json
└── frontend/
    ├── Dockerfile
    ├── Dockerfile.dev
    ├── docker-entrypoint.sh
    ├── package.json
    └── src/
```

### 2. docker-compose.yml Principal
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Base de datos PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: minimarket_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: minimarket
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-minimarket123}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
      - ./backups:/backups
    ports:
      - "${DB_PORT:-5432}:5432"
    networks:
      - minimarket_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d minimarket"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Adminer para administración de BD
  adminer:
    image: adminer:latest
    container_name: minimarket_adminer
    restart: unless-stopped
    environment:
      ADMINER_DEFAULT_SERVER: postgres
    ports:
      - "${ADMINER_PORT:-8080}:8080"
    networks:
      - minimarket_network
    depends_on:
      postgres:
        condition: service_healthy
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "2"

  # Backend Node.js (opcional - para desarrollo)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      args:
        NODE_ENV: development
    container_name: minimarket_backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-minimarket123}@postgres:5432/minimarket
      JWT_SECRET: ${JWT_SECRET:-development-jwt-secret-key}
      PORT: 3001
    ports:
      - "${BACKEND_PORT:-3001}:3001"
    volumes:
      - ./backend/src:/app/src:ro
      - ./backend/prisma:/app/prisma:ro
      - backend_node_modules:/app/node_modules
    networks:
      - minimarket_network
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Frontend React (desarrollo)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
      args:
        NODE_ENV: development
    container_name: minimarket_frontend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      VITE_API_BASE_URL: ${VITE_API_BASE_URL:-http://localhost:3001}
      VITE_APP_ENV: development
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - frontend_node_modules:/app/node_modules
    networks:
      - minimarket_network
    depends_on:
      backend:
        condition: service_healthy
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
    driver: local
  backend_node_modules:
    driver: local
  frontend_node_modules:
    driver: local

networks:
  minimarket_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### 3. Archivo de Variables de Entorno (.env)
```env
# Database Configuration
DB_PASSWORD=minimarket123
DB_PORT=5432
ADMINER_PORT=8080

# Application Configuration
JWT_SECRET=development-jwt-secret-key-minimo-32-caracteres-1234567890
NODE_ENV=development

# Frontend Configuration
FRONTEND_PORT=3000
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_ENV=development

# Backend Configuration
BACKEND_PORT=3001

# Docker Configuration
COMPOSE_PROJECT_NAME=minimarket
```

### 4. docker-compose.override.yml (Desarrollo)
```yaml
# docker-compose.override.yml
version: '3.8'

services:
  postgres:
    environment:
      POSTGRES_DB: minimarket_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev123
    ports:
      - "5433:5432"  # Puerto diferente para desarrollo

  frontend:
    environment:
      VITE_API_BASE_URL: http://localhost:3001
      VITE_APP_ENV: development
    # Hot reload está habilitado por defecto

  backend:
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:dev123@postgres:5432/minimarket_dev
```

### 5. docker-compose.prod.yml (Producción Local)
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: minimarket
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${PROD_DB_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    restart: always
    networks:
      - minimarket_prod_network

  adminer:
    restart: always

  # Frontend build para producción
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    ports:
      - "80:80"
    restart: always
    networks:
      - minimarket_prod_network

volumes:
  postgres_prod_data:
    driver: local

networks:
  minimarket_prod_network:
    driver: bridge
```

## 📦 Configuración de Contenedores

### 1. Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS base

# Instalar dependencias de sistema
RUN apk add --no-cache \
    openssl \
    curl \
    postgresql-client

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Generar Prisma Client
RUN npx prisma generate

# Copiar código fuente
COPY src ./src/

# Build de la aplicación
RUN npm run build

# Usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambiar propietario de archivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3001}/health || exit 1

# Exponer puerto
EXPOSE ${PORT:-3001}

# Comando de inicio
CMD ["npm", "start"]
```

### 2. Backend Dockerfile Dev
```dockerfile
# backend/Dockerfile.dev
FROM node:18-alpine

# Instalar dependencias de sistema
RUN apk add --no-cache \
    openssl \
    curl \
    postgresql-client

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias
RUN npm install

# Generar Prisma Client
RUN npx prisma generate

# Copiar código fuente
COPY src ./src/

# Exponer puerto
EXPOSE 3001

# Comando de desarrollo
CMD ["npm", "run", "dev"]
```

### 3. Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY pnpm-lock.yaml* yarn.lock* package-lock.json* ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Build para producción
RUN pnpm run build:prod

# Servir con nginx
FROM nginx:alpine

# Copiar build
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puerto
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 4. Frontend Dockerfile Dev
```dockerfile
# frontend/Dockerfile.dev
FROM node:18-alpine

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar package files
COPY package*.json pnpm-lock.yaml* ./

# Instalar dependencias
RUN pnpm install

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando de desarrollo con hot reload
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]
```

### 5. Configuración Nginx para Producción
```nginx
# frontend/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    sendfile        on;
    keepalive_timeout  65;
    client_max_body_size 50M;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy (si es necesario)
        location /api/ {
            proxy_pass http://backend:3001/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

## 🗄️ Configuración de Base de Datos

### 1. Scripts de Inicialización
```sql
-- init-scripts/01-create-extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "citext";

-- init-scripts/02-create-tables.sql
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL,
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_categorias_updated_at ON categorias;
CREATE TRIGGER update_categorias_updated_at 
    BEFORE UPDATE ON categorias 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_productos_updated_at ON productos;
CREATE TRIGGER update_productos_updated_at 
    BEFORE UPDATE ON productos 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- init-scripts/03-seed-data.sql
INSERT INTO usuarios (email, nombre, password_hash, rol) VALUES 
('admin@minimarket.com', 'Administrador', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdvA5lb5vy.wjFi', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categorias (nombre, descripcion) VALUES 
('Bebidas', 'Bebidas alcohólicas y no alcohólicas'),
('Alimentos', 'Productos alimenticios'),
('Higiene', 'Productos de higiene personal'),
('Limpieza', 'Productos de limpieza del hogar')
ON CONFLICT DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) 
SELECT 'Coca Cola 500ml', 'Refresco de cola', 2.50, 100, c.id
FROM categorias c WHERE c.nombre = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) 
SELECT 'Pan Francés', 'Pan fresco del día', 1.20, 50, c.id
FROM categorias c WHERE c.nombre = 'Alimentos'
ON CONFLICT DO NOTHING;
```

### 2. Script de Backup
```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/minimarket_backup_$DATE.sql"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Crear backup
docker exec minimarket_postgres pg_dump -U postgres -d minimarket > $BACKUP_FILE

# Comprimir backup
gzip $BACKUP_FILE

# Limpiar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -name "minimarket_backup_*.sql.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_FILE.gz"
```

### 3. Script de Restore
```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring database from: $BACKUP_FILE"
echo "This will overwrite the current database. Continue? (y/N)"
read -r confirmation

if [ "$confirmation" != "y" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Descomprimir y restaurar
gunzip -c "$BACKUP_FILE" | docker exec -i minimarket_postgres psql -U postgres -d minimarket

echo "Database restored successfully"
```

## 🚀 Comandos de Ejecución

### 1. Inicio de Servicios
```bash
# Iniciar todos los servicios en desarrollo
docker compose up -d

# Iniciar solo base de datos
docker compose up -d postgres

# Iniciar con logs en tiempo real
docker compose up -d --follow

# Iniciar servicios específicos
docker compose up -d postgres adminer
```

### 2. Verificación de Estado
```bash
# Ver estado de contenedores
docker compose ps

# Ver logs de todos los servicios
docker compose logs

# Ver logs de servicio específico
docker compose logs postgres
docker compose logs frontend
docker compose logs backend

# Ver logs en tiempo real
docker compose logs -f postgres
```

### 3. Acceso a Servicios
```bash
# Frontend (React App)
open http://localhost:3000

# Backend API
curl http://localhost:3001/health

# Base de datos PostgreSQL
docker exec -it minimarket_postgres psql -U postgres -d minimarket

# Adminer (Administrador DB)
open http://localhost:8080
# Credenciales Adminer:
# Sistema: PostgreSQL
# Servidor: postgres
# Usuario: postgres
# Contraseña: minimarket123
# Base de datos: minimarket
```

### 4. Comandos de Desarrollo
```bash
# Ejecutar comandos dentro de contenedores
docker compose exec postgres psql -U postgres -d minimarket
docker compose exec frontend sh
docker compose exec backend sh

# Instalar nuevas dependencias
docker compose exec frontend pnpm install <package>
docker compose exec backend npm install <package>

# Ejecutar Prisma commands
docker compose exec backend npx prisma generate
docker compose exec backend npx prisma db push
docker compose exec backend npx prisma db seed

# Rebuild contenedores después de cambios
docker compose up -d --build
```

### 5. Gestión de Datos
```bash
# Crear backup
./scripts/backup-database.sh

# Restaurar backup
./scripts/restore-database.sh /backups/minimarket_backup_20231031_120000.sql.gz

# Limpiar volúmenes (¡CUIDADO - elimina datos!)
docker compose down -v

# Ver uso de espacio en disco
docker system df
docker volume ls

# Limpiar imágenes y contenedores no utilizados
docker system prune -a
```

## 🔧 Configuración del Proyecto

### 1. Configuración de Prisma para Docker
```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Configuración para Docker
  directUrl = env("DIRECT_URL")
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
```

### 2. Variables de Entorno para Backend
```env
# backend/.env
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:minimarket123@postgres:5432/minimarket
DIRECT_URL=postgresql://postgres:minimarket123@localhost:5433/minimarket

# JWT
JWT_SECRET=development-jwt-secret-key-minimo-32-caracteres-1234567890

# Logging
LOG_LEVEL=debug
```

### 3. Variables de Entorno para Frontend
```env
# frontend/.env
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_ENV=development
VITE_PORT=3000
```

### 4. Scripts package.json
```json
// backend/package.json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "node prisma/seed.js",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset --force",
    "docker:build": "docker compose build",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f",
    "docker:ps": "docker compose ps",
    "docker:exec": "docker compose exec backend sh",
    "docker:backup": "./scripts/backup-database.sh",
    "docker:restore": "./scripts/restore-database.sh"
  }
}
```

```json
// frontend/package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:prod": "NODE_ENV=production tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "docker:build": "docker compose build frontend",
    "docker:up": "docker compose up -d frontend",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f frontend",
    "docker:exec": "docker compose exec frontend sh"
  }
}
```

## 🧪 Testing y Desarrollo

### 1. Configuración de Jest para Backend
```javascript
// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
};
```

### 2. Tests de Integración
```typescript
// backend/tests/integration/database.test.ts
import { PrismaClient } from '@prisma/client';

describe('Database Integration', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should connect to database', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  test('should create and retrieve user', async () => {
    const user = await prisma.usuario.create({
      data: {
        email: 'test@example.com',
        nombre: 'Test User',
        passwordHash: 'hashedpassword',
        rol: 'usuario',
      },
    });

    expect(user.email).toBe('test@example.com');
    expect(user.id).toBeDefined();

    await prisma.usuario.delete({ where: { id: user.id } });
  });

  test('should query products with categories', async () => {
    const productos = await prisma.producto.findMany({
      include: {
        categoria: true,
      },
      take: 10,
    });

    expect(Array.isArray(productos)).toBe(true);
    productos.forEach(producto => {
      expect(producto.id).toBeDefined();
      expect(producto.nombre).toBeDefined();
    });
  });
});
```

### 3. Tests del Frontend
```typescript
// frontend/src/test/api.test.ts
import api from '../services/api';

describe('API Service', () => {
  test('should make GET request to products endpoint', async () => {
    const response = await api.get('/products');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('productos');
    expect(Array.isArray(response.data.productos)).toBe(true);
  });

  test('should handle authentication', async () => {
    const loginResponse = await api.post('/auth/login', {
      email: 'admin@minimarket.com',
      password: 'admin123'
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data).toHaveProperty('token');
  });
});
```

### 4. Script de Testing
```bash
#!/bin/bash
# scripts/run-tests.sh

echo "🧪 Running tests..."

# Test backend
echo "Testing backend..."
cd backend
npm run db:generate
npm test

echo "✅ Backend tests completed"

# Test frontend
echo "Testing frontend..."
cd ../frontend
npm run build
npm test -- --watchAll=false

echo "✅ Frontend tests completed"

echo "🎉 All tests completed"
```

## 🐛 Troubleshooting

### Problema: Contenedor no inicia
```bash
# Verificar logs específicos
docker compose logs postgres
docker compose logs frontend

# Verificar puerto en uso
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :5432

# Verificar permisos de archivos
ls -la docker-compose.yml
chmod +x scripts/*.sh
```

**Solución**: 
1. Verificar que los puertos estén disponibles
2. Verificar permisos de ejecución de scripts
3. Verificar variables de entorno en .env

### Problema: Base de datos no conecta
```bash
# Verificar estado del contenedor PostgreSQL
docker compose ps postgres
docker compose logs postgres

# Test de conectividad
docker compose exec postgres pg_isready -U postgres -d minimarket

# Verificar variables de entorno
docker compose exec postgres env | grep POSTGRES
```

**Solución**:
1. Esperar a que PostgreSQL termine de inicializarse
2. Verificar credenciales en variables de entorno
3. Reiniciar contenedor: `docker compose restart postgres`

### Problema: Prisma no puede conectar
```bash
# Verificar DATABASE_URL
docker compose exec backend env | grep DATABASE

# Test manual de conexión
docker compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const client = new PrismaClient();
client.\$connect().then(() => console.log('Connected')).catch(console.error);
"

# Regenerar Prisma client
docker compose exec backend npm run db:generate
```

**Solución**:
1. Verificar que DATABASE_URL sea correcta
2. Regenerar Prisma client
3. Verificar que la base de datos esté inicializada

### Problema: Hot reload no funciona
```bash
# Verificar que los volúmenes estén montados correctamente
docker compose config

# Reiniciar contenedor frontend
docker compose restart frontend

# Verificar logs
docker compose logs frontend
```

**Solución**:
1. Verificar configuración de volúmenes en docker-compose.yml
2. Asegurar que se use Dockerfile.dev
3. Verificar que NODE_ENV=development

### Problema: Error de permisos en Linux
```bash
# Verificar propietario de archivos
ls -la

# Cambiar propietario si es necesario
sudo chown -R $USER:$USER .

# Verificar que el usuario esté en grupo docker
groups $USER
sudo usermod -aG docker $USER

# Reiniciar sesión o ejecutar
newgrp docker
```

### Problema: Puerto ya en uso
```bash
# Encontrar proceso que usa el puerto
sudo lsof -i :3000
sudo lsof -i :5432

# Matar proceso si es necesario
sudo kill -9 <PID>

# O cambiar puertos en docker-compose.yml
```

## 📊 Monitoreo y Logs

### 1. Configuración de Logs
```yaml
# En docker-compose.yml - ya configurado con json-file driver
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 2. Visualización de Logs
```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver logs de servicio específico
docker compose logs -f postgres
docker compose logs -f --tail=50 frontend

# Logs de последних 10 минут
docker compose logs --since="10m"
```

### 3. Monitoreo de Recursos
```bash
# Uso de CPU y memoria
docker stats

# Uso de espacio en disco
docker system df

# Información de contenedores
docker compose ps
docker inspect minimarket_postgres
```

### 4. Health Checks
```bash
# Verificar health checks
docker compose ps

# Test manual de health endpoints
curl http://localhost:3001/health
curl http://localhost:3000

# Verificar base de datos
docker compose exec postgres pg_isready -U postgres
```

## 🔐 Seguridad para Desarrollo

### 1. Variables de Entorno Sensibles
```env
# Nunca committing .env con passwords reales
# Usar .env.local para desarrollo local
# El .env.example debe contener valores de ejemplo
```

### 2. Red de Docker
```yaml
# Los contenedores están en la red minimarket_network
# Acceso desde host solo a puertos explicitamente mapeados
```

### 3. Usuario no-root en Producción
```dockerfile
# Ya configurado en Dockerfiles de producción
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

## 🎯 Checklist de Desarrollo

### Configuración Inicial
- [ ] ✅ Docker y Docker Compose instalados
- [ ] ✅ Variables de entorno configuradas en .env
- [ ] ✅ Estructura de directorios creada
- [ ] ✅ Scripts de inicialización de BD creados

### Ejecución de Servicios
- [ ] ✅ PostgreSQL container inicia correctamente
- [ ] ✅ Adminer accesible en puerto 8080
- [ ] ✅ Frontend accesible en puerto 3000
- [ ] ✅ Backend API responde en puerto 3001

### Base de Datos
- [ ] ✅ Tablas creadas automáticamente
- [ ] ✅ Datos de ejemplo insertados
- [ ] ✅ Prisma Client generado
- [ ] ✅ Conexión desde aplicación funciona

### Desarrollo
- [ ] ✅ Hot reload funciona en frontend
- [ ] ✅ Cambios en backend se reflejan (restart necesario)
- [ ] ✅ Logs visibles en docker compose logs
- [ ] ✅ Backup y restore funcionando

### Integración
- [ ] ✅ Frontend conecta a backend API
- [ ] ✅ Autenticación JWT funciona localmente
- [ ] ✅ CRUD de productos funcional
- [ ] ✅ Adminer permite administración de BD

## 🆘 Comandos Útiles

```bash
# Gestión de contenedores
docker compose up -d                    # Iniciar servicios
docker compose down                     # Detener servicios
docker compose restart                  # Reiniciar servicios
docker compose build                    # Rebuild imágenes

# Logs y debugging
docker compose logs -f                  # Ver logs en tiempo real
docker compose logs --tail=100 postgres # Ver últimos 100 logs
docker compose ps                       # Ver estado
docker compose exec postgres sh         # Ejecutar comando en contenedor

# Base de datos
docker compose exec postgres psql -U postgres -d minimarket  # Conectar a BD
./scripts/backup-database.sh                                     # Crear backup
./scripts/restore-database.sh <archivo>                          # Restaurar backup

# Desarrollo
docker compose exec frontend pnpm install <package>              # Instalar deps frontend
docker compose exec backend npm install <package>                # Instalar deps backend
docker compose exec backend npm run db:generate                  # Regenerar Prisma

# Limpieza
docker system prune -a                   # Limpiar sistema completo
docker volume prune                      # Limpiar volúmenes huérfanos
docker compose down -v --remove-orphans # Detener y eliminar volúmenes

# Monitoreo
docker stats                            # Ver uso de recursos
docker system df                        # Ver uso de disco
```

## 📈 Optimización para Desarrollo

### 1. Mejoras de Performance
```yaml
# Configurar cache de Docker Compose
services:
  frontend:
    volumes:
      - ./frontend/node_modules:/app/node_modules:cached  # Cache de MacOS
```

### 2. Docker Sync para MacOS
```bash
# Instalar docker-sync
gem install docker-sync

# Crear docker-sync.yml
version: '2'
syncs:
  frontend-sync:
    sync_strategy: 'native_osx'
    source: './frontend/src'
    destination: '/app/src'
    sync_excludes: ['.git', 'node_modules', 'dist']

# Usar docker-sync
docker-sync start
```

### 3. Aliases Útiles
```bash
# Agregar a ~/.bashrc o ~/.zshrc
alias dm-up='docker compose up -d'
alias dm-down='docker compose down'
alias dm-logs='docker compose logs -f'
alias dm-ps='docker compose ps'
alias dm-restart='docker compose restart'
alias dm-clean='docker system prune -a'
alias dm-backup='./scripts/backup-database.sh'
```

---

**Última actualización**: 2025-10-31  
**Versión**: 1.0  
**Stack**: React + TypeScript + Vite + PostgreSQL + Docker
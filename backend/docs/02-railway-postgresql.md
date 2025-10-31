# Guía de Despliegue: Railway + PostgreSQL

## 📋 Resumen
Esta guía explica cómo desplegar la aplicación React + TypeScript en Railway usando PostgreSQL como base de datos.

## 🛠️ Stack Tecnológico
- **Frontend**: React + TypeScript + Vite
- **Base de Datos**: PostgreSQL (Railway)
- **Despliegue**: Railway
- **ORM**: Prisma con PostgreSQL

## 🔧 Configuración Previa

### 1. Configuración de Railway

#### Instalar Railway CLI
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login en Railway
railway login

# Inicializar proyecto
railway init
```

#### Crear Proyecto en Railway
```bash
# Crear nuevo proyecto
railway new

# O usar el dashboard en https://railway.app
```

### 2. Configuración de Base de Datos PostgreSQL

#### Crear Servicio PostgreSQL en Railway
```bash
# Desde el dashboard o CLI
railway add postgresql

# Esto automáticamente configurará:
# - DATABASE_URL
# - PGHOST
# - PGPORT
# - PGUSER
# - PGPASSWORD
# - PGDATABASE
```

#### Verificar Variables de Entorno PostgreSQL
```bash
# Ver variables configuradas automáticamente
railway variables

# Debería mostrar algo como:
# DATABASE_URL=postgresql://postgres:[password]@host:[port]/railway
# PGHOST=containers-us-west-xxxx.train.host
# PGPORT=5432
# PGUSER=postgres
# PGPASSWORD=[generated-password]
# PGDATABASE=railway
```

#### Configuración de Tablas PostgreSQL
```sql
-- Conectar a la base de datos
railway connect

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear tablas básicas
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'usuario',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
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

-- Índices para performance
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at 
    BEFORE UPDATE ON categorias 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_productos_updated_at 
    BEFORE UPDATE ON productos 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

### 3. Configuración del Proyecto

#### Instalar Dependencias PostgreSQL
```bash
npm install @prisma/client pg bcryptjs jsonwebtoken
npm install -D prisma @types/pg @types/bcryptjs @types/jsonwebtoken
```

#### Configuración de Prisma
```bash
# Inicializar Prisma
npx prisma init

# Esto creará:
# - prisma/schema.prisma
# - .env (para variables locales)
```

#### Configurar prisma/schema.prisma
```prisma
// prisma/schema.prisma
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
```

#### Configurar Conexión a Base de Datos
```typescript
// src/lib/database.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Función para conectar y verificar la base de datos
export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Función para desconectar
export async function disconnectFromDatabase() {
  await prisma.$disconnect();
}
```

## 🚀 Despliegue en Railway

### 1. Configurar railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run build && npm run preview",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Variables de Entorno en Railway

#### Configurar desde Dashboard
```bash
# Ir a Railway Dashboard > Variables
# Agregar las siguientes variables:
```

```env
# Variables Auto-generadas por Railway PostgreSQL
DATABASE_URL=postgresql://postgres:[password]@host:port/railway
PGHOST=containers-us-west-xxxx.train.host
PGPORT=5432
PGUSER=postgres
PGPASSWORD=[generated-password]
PGDATABASE=railway

# Variables de Aplicación
JWT_SECRET=your-jwt-secret-key-minimo-32-caracteres
NODE_ENV=production
VITE_APP_ENV=production
RAILWAY_ENVIRONMENT=production
PORT=3000
```

#### Configurar con CLI
```bash
# Agregar variables una por una
railway variables set JWT_SECRET=tu-jwt-secret-aqui
railway variables set NODE_ENV=production
railway variables set VITE_APP_ENV=production

# O crear archivo .env.local y usar
railway variables set --file .env.local
```

### 3. Configuración de package.json
```json
{
  "name": "mini-market-railway",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:railway": "tsc -b && vite build",
    "preview": "vite preview",
    "preview:railway": "vite preview --host 0.0.0.0 --port $PORT",
    "start": "npm run preview:railway",
    "deploy": "railway up",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "node prisma/seed.js",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.7.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "@types/node": "^22.10.7",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/pg": "^8.10.9",
    "prisma": "^5.7.1",
    "typescript": "~5.6.2",
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 4. Configuración de vite.config.ts
```typescript
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select'
          ],
        },
      },
    },
  },
  server: {
    host: true,
    port: 3000,
  },
  preview: {
    host: true,
    port: 3000,
  },
})
```

### 5. Comandos de Despliegue
```bash
# Desarrollo local
npm run dev

# Desplegar en Railway
railway up

# Ver logs en tiempo real
railway logs

# Abrir en navegador
railway open

# Ver variables
railway variables

# Ver status
railway status
```

### 6. Configuración de Dominio Personalizado
```bash
# Configurar desde el dashboard o CLI
railway domain add tu-dominio.com

# Railway automáticamente configurará SSL
```

## 📝 Migraciones y Base de Datos

### 1. Generar Cliente Prisma
```bash
# En cada deploy o cambio de schema
npm run db:generate

# Esto genera el cliente TypeScript basado en prisma/schema.prisma
```

### 2. Ejecutar Migraciones
```bash
# Para desarrollo
npx prisma migrate dev --name init

# Para producción (automático en deploy)
npm run db:migrate
```

### 3. Script de Seed (Datos Iniciales)
```javascript
// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Crear usuario admin
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@minimarket.com' },
    update: {},
    create: {
      email: 'admin@minimarket.com',
      nombre: 'Administrador',
      passwordHash: await bcrypt.hash('admin123', 12),
      rol: 'admin',
    },
  });

  // Crear categorías
  const categorias = await prisma.categoria.createMany({
    data: [
      { nombre: 'Bebidas', descripcion: 'Bebidas alcohólicas y no alcohólicas' },
      { nombre: 'Alimentos', descripcion: 'Productos alimenticios' },
      { nombre: 'Higiene', descripcion: 'Productos de higiene personal' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Database seeded successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

```bash
# Ejecutar seed
npm run db:seed
```

## 🔍 Variables de Entorno Completas

### Desarrollo (.env.local)
```env
# PostgreSQL local
DATABASE_URL="postgresql://postgres:password@localhost:5432/mini_market_dev"

# Aplicación
JWT_SECRET=dev-jwt-secret-key-1234567890123456789012
NODE_ENV=development
VITE_APP_ENV=development
```

### Producción (Railway)
```env
# PostgreSQL Railway (auto-generado)
DATABASE_URL=postgresql://postgres:[password]@host:port/railway

# Variables de aplicación
JWT_SECRET=prod-jwt-secret-key-muy-seguro-32-caracteres-minimo
NODE_ENV=production
VITE_APP_ENV=production
RAILWAY_ENVIRONMENT=production
PORT=3000
```

## 🧪 Testing del Despliegue

### 1. Test de Conectividad PostgreSQL
```bash
# Usando Railway CLI
railway connect

# Test básico
psql $DATABASE_URL -c "SELECT version();"
```

### 2. Test de Aplicación
```bash
# Verificar que la app responde
curl https://tu-app.railway.app/health

# O visitar en el navegador
```

### 3. Verificar Logs
```bash
# Logs en tiempo real
railway logs --follow

# Logs de build
railway logs --type build

# Logs de aplicación
railway logs --type app
```

## 🐛 Troubleshooting

### Problema: Error de Conexión a PostgreSQL
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Test de conexión manual
node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Connection error', err))
  .finally(() => client.end());
"
```

**Solución**: 
1. Verificar que el servicio PostgreSQL esté activo en Railway
2. Regenerar la DATABASE_URL si es necesario
3. Verificar variables de entorno en el dashboard

### Problema: Migration Failed
```bash
# Error común: Relation does not exist
```

**Solución**:
```bash
# Reset completo de la base de datos (¡CUIDADO en producción!)
railway run npx prisma migrate reset

# O ejecutar migrate deploy
railway run npm run db:migrate
```

### Problema: Build Falla
```bash
# Error: Out of memory o timeout
```

**Solución**:
1. Optimizar bundle size
2. Dividir build en pasos
3. Usar build cache

### Problema: Prisma Client No Generado
```bash
# Error: Cannot find module '@prisma/client'
```

**Solución**:
```bash
# Regenerar cliente
npm run db:generate

# Verificar que postinstall script esté en package.json
# "postinstall": "prisma generate"
```

### Problema: Variables de Entorno No Disponibles
```bash
# Verificar variables en Railway
railway variables

# Redeployar para aplicar cambios
railway up --detach
```

**Solución**: 
1. Verificar que las variables estén configuradas en Railway Dashboard
2. Reiniciar el servicio: `railway restart`
3. Redeployar: `railway up`

### Problema: SSL Connection Failed
```typescript
// Configurar SSL en Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  errorFormat: 'colorless',
});
```

**Solución**: Railway PostgreSQL requiere SSL. Asegurar que la DATABASE_URL incluya `?sslmode=require`:
```env
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
```

## 📊 Monitoreo y Logs

### 1. Configurar Monitoreo en Railway
```bash
# Habilitar métricas en el dashboard
# Railway automáticamente proporciona:
# - CPU usage
# - Memory usage
# - Network traffic
# - Request metrics
```

### 2. Logs Estructurados
```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta }));
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ level: 'error', message, error }));
  },
  warn: (message: string, meta?: any) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta }));
  },
};
```

### 3. Health Check
```typescript
// src/routes/health.ts
import { Router } from 'express';
import { prisma, connectToDatabase } from '../lib/database';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    const dbConnected = await connectToDatabase();
    
    // Test de base de datos
    await prisma.usuario.count();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      version: process.env.npm_package_version,
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

export default router;
```

## 🔐 Seguridad

### 1. Configuración de SSL
```bash
# Railway maneja SSL automáticamente
# Las conexiones HTTPS son obligatorias en producción
```

### 2. Variables de Entorno Seguras
- ✅ JWT_SECRET: Mínimo 32 caracteres aleatorios
- ✅ DATABASE_URL: Generada automáticamente por Railway
- ❌ No hardcodear credenciales en el código

### 3. CORS Configuration
```typescript
// En main.tsx o servidor
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://tu-dominio.com'],
  credentials: true,
};
```

### 4. Rate Limiting (Si es necesario)
```typescript
// Usar middleware de rate limiting
// Railway no incluye esto por defecto
```

## 📈 Optimización de Performance

### 1. Database Connection Pooling
```typescript
// prisma/schema.prisma
// Railway maneja el connection pooling automáticamente
// Para configuraciones avanzadas:
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["pooledConnections"]
}
```

### 2. Build Optimization
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          prisma: ['@prisma/client'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### 3. Database Indexing
```sql
-- Ya configurado en el schema inicial
-- Railway sugiere índices adicionales basados en queries reales
```

## 🎯 Checklist de Despliegue

- [ ] ✅ Servicio PostgreSQL creado en Railway
- [ ] ✅ DATABASE_URL configurada automáticamente
- [ ] ✅ Variables de entorno de aplicación configuradas
- [ ] ✅ Prisma schema configurado correctamente
- [ ] ✅ Build local funcionando
- [ ] ✅ Migraciones ejecutadas exitosamente
- [ ] ✅ Conexión a base de datos verificada
- [ ] ✅ Dominio personalizado configurado (opcional)
- [ ] ✅ SSL/HTTPS habilitado automáticamente
- [ ] ✅ Health check endpoint funcionando
- [ ] ✅ Logs configurados y monitoreando

## 🆘 Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Gestión de base de datos
railway run npx prisma migrate dev
railway run npm run db:generate
railway run npm run db:seed

# Despliegue
railway up
railway up --detach

# Monitoreo
railway logs --follow
railway logs --type app
railway logs --type build

# Variables
railway variables
railway variables set KEY=value
railway variables unset KEY

# Estado del servicio
railway status
railway open
railway shell

# Base de datos
railway connect
railway run psql $DATABASE_URL
```

## 🔄 CI/CD con GitHub Actions (Opcional)

```yaml
# .github/workflows/railway-deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate Prisma Client
        run: npm run db:generate
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Railway
        uses: railway/deploy-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: ${{ secrets.RAILWAY_SERVICE_ID }}
```

---

**Última actualización**: 2025-10-31  
**Versión**: 1.0  
**Stack**: React + TypeScript + Vite + PostgreSQL + Railway
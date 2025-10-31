# Guía de Despliegue: Vercel + PlanetScale/MySQL

## 📋 Resumen
Esta guía explica cómo desplegar la aplicación React + TypeScript en Vercel usando PlanetScale como base de datos MySQL.

## 🛠️ Stack Tecnológico
- **Frontend**: React + TypeScript + Vite
- **Base de Datos**: PlanetScale (MySQL)
- **Despliegue**: Vercel
- **ORM**: Kysely o Prisma con driver MySQL

## 🔧 Configuración Previa

### 1. Configuración de PlanetScale

#### Crear Base de Datos en PlanetScale
```bash
# Instalar CLI de PlanetScale
npm install -g pscale

# Login en PlanetScale
pscale auth login

# Crear nueva base de datos
pscale database create mini-market
pscale branch create mini-market main

# Conectar a la rama de desarrollo
pscale connect mini-market main --port 3306
```

#### Configuración de Tablas MySQL
```sql
-- Crear tablas básicas para la aplicación
CREATE TABLE `usuarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','usuario') NOT NULL DEFAULT 'usuario',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `productos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  `precio` decimal(10,2) NOT NULL,
  `stock` int NOT NULL DEFAULT 0,
  `categoria_id` bigint,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `categorias` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2. Configuración del Proyecto

#### Instalar Dependencias MySQL
```bash
# En el directorio del proyecto
npm install @planetscale/database kysely
npm install -D @types/bcryptjs
npm install bcryptjs jsonwebtoken
```

#### Configuración de Kysely para MySQL
```typescript
// src/lib/database.ts
import { Kysely, MysqlDialect } from 'kysely';
import { connect } from '@planetscale/database';

// Configuración PlanetScale
const config = {
  host: process.env.PLANETSCALE_HOST!,
  username: process.env.PLANETSCALE_USERNAME!,
  password: process.env.PLANETSCALE_PASSWORD!,
  database: process.env.PLANETSCALE_DATABASE!,
};

const dialect = new MysqlDialect({
  pool: connect(config).pool,
});

export interface Database {
  usuarios: UsuarioTable;
  productos: ProductoTable;
  categorias: CategoriaTable;
}

export interface UsuarioTable {
  id: number;
  email: string;
  nombre: string;
  password_hash: string;
  rol: 'admin' | 'usuario';
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductoTable {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria_id?: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriaTable {
  id: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export const db = new Kysely<Database>({
  dialect,
});
```

## 🚀 Despliegue en Vercel

### 1. Configurar Variables de Entorno

#### En el Dashboard de Vercel
```bash
# Variables de Base de Datos PlanetScale
PLANETSCALE_HOST=aws.connect.psdb.cloud
PLANETSCALE_USERNAME=your_username
PLANETSCALE_PASSWORD=your_password
PLANETSCALE_DATABASE=mini-market

# Variables de Aplicación
JWT_SECRET=your-jwt-secret-key
NODE_ENV=production
VITE_APP_ENV=production
```

#### Configuración con Vercel CLI
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login en Vercel
vercel login

# Configurar variables de entorno
vercel env add PLANETSCALE_HOST production
vercel env add PLANETSCALE_USERNAME production
vercel env add PLANETSCALE_PASSWORD production
vercel env add PLANETSCALE_DATABASE production
vercel env add JWT_SECRET production
```

### 2. Configurar vercel.json
```json
{
  "buildCommand": "npm run build:prod",
  "outputDirectory": "dist",
  "installCommand": "npm install --prefer-offline",
  "framework": "vite",
  "regions": ["us-east-1"],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### 3. Comandos de Despliegue
```bash
# Despliegue local para testing
npm run build:prod
vercel --prod

# Despliegue automático desde GitHub
# Conectar repositorio en vercel.com
```

### 4. Configuración de Dominio Personalizado (Opcional)
```bash
# Agregar dominio en Vercel Dashboard
# o con CLI
vercel domains add tu-dominio.com
vercel alias https://tu-app.vercel.app tu-dominio.com
```

## 📝 Configuración de Build

### package.json Scripts
```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "build:vercel": "tsc -b && vite build --mode production",
    "deploy": "vercel --prod"
  }
}
```

### vite.config.ts para Producción
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
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
})
```

## 🔍 Variables de Entorno Completas

### Desarrollo (.env.local)
```env
# PlanetScale
PLANETSCALE_HOST=aws.connect.psdb.cloud
PLANETSCALE_USERNAME=tu_username_dev
PLANETSCALE_PASSWORD=tu_password_dev
PLANETSCALE_DATABASE=mini-market

# Aplicación
VITE_APP_ENV=development
JWT_SECRET=dev-secret-key
NODE_ENV=development
```

### Producción (Vercel)
```env
# PlanetScale (producción)
PLANETSCALE_HOST=aws.connect.psdb.cloud
PLANETSCALE_USERNAME=tu_username_prod
PLANETSCALE_PASSWORD=tu_password_prod
PLANETSCALE_DATABASE=mini-market

# Aplicación
VITE_APP_ENV=production
JWT_SECRET=prod-secret-key-minimo-32-caracteres
NODE_ENV=production
```

## 🧪 Testing del Despliegue

### 1. Verificar Conectividad
```bash
# Test de conexión a PlanetScale
node -e "
const { connect } = require('@planetscale/database');
const conn = connect({
  host: process.env.PLANETSCALE_HOST,
  username: process.env.PLANETSCALE_USERNAME,
  password: process.env.PLANETSCALE_PASSWORD,
  database: process.env.PLANETSCALE_DATABASE
});
conn.execute('SELECT 1').then(console.log).catch(console.error);
"
```

### 2. Test de Build Local
```bash
# Simular build de Vercel localmente
NODE_ENV=production npm run build
npm run preview
```

### 3. Verificar Logs de Vercel
```bash
# Ver logs en tiempo real
vercel logs tu-deployment-url.vercel.app
```

## 🐛 Troubleshooting

### Problema: Error de Conexión a PlanetScale
```bash
# Verificar credenciales
echo $PLANETSCALE_HOST
echo $PLANETSCALE_USERNAME
echo $PLANETSCALE_PASSWORD
echo $PLANETSCALE_DATABASE

# Test de conexión manual
pscale connect mini-market main
```

**Solución**: Verificar que las variables de entorno estén correctamente configuradas en el dashboard de Vercel.

### Problema: Build Falla en Vercel
```bash
# Error común: Out of memory
# Solución: Optimizar bundle
```

**Solución**: Agregar configuración en vercel.json:
```json
{
  "functions": {
    "app/api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

### Problema: Timeouts de Base de Datos
```typescript
// Solución: Aumentar timeout y implementar retry
import { connect } from '@planetscale/database';

const config = {
  host: process.env.PLANETSCALE_HOST!,
  username: process.env.PLANETSCALE_USERNAME!,
  password: process.env.PLANETSCALE_PASSWORD!,
  database: process.env.PLANETSCALE_DATABASE!,
  // Añadir configuración de timeout
  fetch: (url, opts = {}) => {
    return fetch(url, {
      ...opts,
      // Timeout de 30 segundos
      signal: AbortSignal.timeout(30000),
    });
  },
};
```

### Problema: CORS con PlanetScale
```typescript
// Configurar CORS en funciones serverless si es necesario
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### Problema: Bundle Size Grande
```typescript
// Optimizar en vite.config.ts
export default defineConfig({
  build: {
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
    chunkSizeWarningLimit: 1000,
  },
});
```

## 📊 Monitoreo y Logs

### 1. Configurar Vercel Analytics
```bash
# En vercel.json
{
  "analytics": {
    "enabled": true
  }
}
```

### 2. Logs de PlanetScale
```bash
# Conectar y ver logs
pscale connect mini-market main
# Acceder al dashboard de PlanetScale para logs detallados
```

### 3. Sentry para Error Tracking (Opcional)
```bash
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// vite.config.ts
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "tu-org",
      project: "tu-proyecto",
    }),
  ],
});
```

## 🔐 Seguridad

### 1. Variables de Entorno Sensibles
- ✅ JWT_SECRET: Mínimo 32 caracteres
- ✅ PLANETSCALE_PASSWORD: Usar password seguro
- ❌ No exponer credenciales en el código

### 2. Configuración de CORS
```typescript
// En API routes si es necesario
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### 3. Rate Limiting
```typescript
// Implementar rate limiting si es necesario
// Usar servicios como Upstash Redis para rate limiting global
```

## 📈 Optimización de Performance

### 1. Optimización de Build
```typescript
// vite.config.ts - Build optimization
build: {
  target: 'esnext',
  minify: 'terser',
  cssMinify: true,
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
        charts: ['recharts'],
      },
    },
  },
},
```

### 2. Database Connection Pooling
```typescript
// Configurar pool de conexiones en PlanetScale
const config = {
  host: process.env.PLANETSCALE_HOST!,
  username: process.env.PLANETSCALE_USERNAME!,
  password: process.env.PLANETSCALE_PASSWORD!,
  database: process.env.PLANETSCALE_DATABASE!,
  // Configurar pool
  maxIdleTime: 30000,
  maxPoolSize: 10,
  minIdleSize: 2,
};
```

## 🎯 Checklist de Despliegue

- [ ] ✅ Base de datos PlanetScale configurada
- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ Build local funcionando (`npm run build`)
- [ ] ✅ Conexión a base de datos testada
- [ ] ✅ Dominio personalizado configurado (opcional)
- [ ] ✅ SSL/HTTPS habilitado automáticamente por Vercel
- [ ] ✅ Build optimizado y analizado
- [ ] ✅ Logs de error configurados
- [ ] ✅ Monitoreo de performance habilitado

## 🆘 Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build:prod

# Preview del build
npm run preview

# Desplegar
vercel --prod

# Ver logs
vercel logs

# Manage domains
vercel domains

# Environment variables
vercel env ls
vercel env rm VARIABLE_NAME
```

---

**Última actualización**: 2025-10-31  
**Versión**: 1.0  
**Stack**: React + TypeScript + Vite + PlanetScale + Vercel
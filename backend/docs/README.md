# 📚 Guías de Despliegue - Mini Market

Este directorio contiene guías completas de despliegue para diferentes plataformas y entornos, adaptadas para el sistema Mini Market desarrollado con React + TypeScript + Vite.

## 📖 Índice de Guías

### 🚀 [01 - Vercel + PlanetScale/MySQL](./01-vercel-planetscale-mysql.md)
**Ideal para**: Startups y proyectos con base de datos MySQL

- ✅ **Ventajas**: 
  - Despliegue automático desde Git
  - CDN global incluido
  - Base de datos MySQL serverless
  - Escalabilidad automática
- ⚡ **Stack**: React + Vercel + PlanetScale + MySQL
- 🎯 **Uso recomendado**: Desarrollo rápido, MVPs, aplicaciones web públicas

### 🚂 [02 - Railway + PostgreSQL](./02-railway-postgresql.md)
**Ideal para**: Proyectos con PostgreSQL y desarrollo ágil

- ✅ **Ventajas**: 
  - PostgreSQL gestionado automáticamente
  - Variables de entorno simplificadas
  - Deploy en 30 segundos
  - Monitoreo integrado
- ⚡ **Stack**: React + Railway + PostgreSQL + Prisma
- 🎯 **Uso recomendado**: Desarrollo ágil, APIs REST, proyectos con PostgreSQL

### ☁️ [03 - AWS Lambda + RDS](./03-aws-lambda-rds.md)
**Ideal para**: Aplicaciones enterprise con alta escala

- ✅ **Ventajas**: 
  - Serverless computing con AWS Lambda
  - RDS PostgreSQL gestionado
  - Arquitectura escalable y segura
  - Servicios AWS integrados
- ⚡ **Stack**: React + Lambda + API Gateway + RDS + CloudFront
- 🎯 **Uso recomendado**: Empresas, aplicaciones de alta carga, arquitecturas distribuidas

### 🐳 [04 - Docker + PostgreSQL Local](./04-docker-postgresql-local.md)
**Ideal para**: Desarrollo local y entornos staging

- ✅ **Ventajas**: 
  - Entorno de desarrollo idéntico a producción
  - Sin dependencias externas
  - Control total del stack
  - Ideal para testing
- ⚡ **Stack**: React + Docker + PostgreSQL + Docker Compose
- 🎯 **Uso recomendado**: Desarrollo local, testing, staging,CI/CD pipelines

## 🎯 Matriz de Decisión

| Criterio | Vercel + PlanetScale | Railway + PostgreSQL | AWS Lambda + RDS | Docker Local |
|----------|---------------------|---------------------|------------------|--------------|
| **Facilidad de Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Costo** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Escalabilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Control** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Tiempo de Deploy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Base de Datos** | MySQL | PostgreSQL | PostgreSQL | PostgreSQL |
| **TypeScript Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🏗️ Arquitectura por Plataforma

### Vercel + PlanetScale
```
┌─────────────────┐    ┌──────────────────┐
│   Vercel CDN    │    │   PlanetScale    │
│   (Frontend)    │    │    MySQL         │
│                 │    │                  │
│ ┌─────────────┐ │    │ ┌─────────────┐  │
│ │ Static Site │ │◄──►│ │ MySQL DB    │  │
│ └─────────────┘ │    │ └─────────────┘  │
└─────────────────┘    └──────────────────┘
```

### Railway + PostgreSQL
```
┌─────────────────┐    ┌──────────────────┐
│   Railway App   │    │   PostgreSQL     │
│   (Frontend)    │    │   (Managed)      │
│                 │    │                  │
│ ┌─────────────┐ │    │ ┌─────────────┐  │
│ │ React App   │ │◄──►│ │ PostgreSQL  │  │
│ └─────────────┘ │    │ └─────────────┘  │
└─────────────────┘    └──────────────────┘
```

### AWS Lambda + RDS
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  CloudFront CDN │    │   API Gateway    │    │      RDS        │
│   (Frontend)    │    │   + Lambda       │    │   PostgreSQL    │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ S3 Static   │ │◄──►│ │ Lambda       │ │◄──►│ │ PostgreSQL  │ │
│ │ Site        │ │    │ │ Functions    │ │    │ │ Database    │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Docker Local
```
┌─────────────────┐    ┌──────────────────┐
│  Frontend       │    │   PostgreSQL     │
│  (Vite Dev)     │    │   (Container)    │
│                 │    │                  │
│ ┌─────────────┐ │    │ ┌─────────────┐  │
│ │ React App   │ │◄──►│ │ PostgreSQL  │  │
│ │ Port: 3000  │ │    │ │ Port: 5432  │  │
│ └─────────────┘ │    │ └─────────────┘  │
└─────────────────┘    └──────────────────┘
```

## 🛠️ Stack Tecnológico Común

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6+
- **UI Components**: Radix UI + Tailwind CSS
- **Routing**: React Router 6
- **State Management**: React Context + Hooks

### Backend
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL 15 / MySQL 8
- **ORM**: Prisma / Kysely
- **Authentication**: JWT + bcryptjs
- **API**: REST APIs

### Herramientas de Desarrollo
- **Package Manager**: pnpm / npm
- **Linting**: ESLint + TypeScript
- **Testing**: Jest + React Testing Library
- **Containerization**: Docker + Docker Compose

## 📋 Requisitos Previos

### Para todas las plataformas:
- Node.js 18+ instalado
- Git configurado
- Conocimientos básicos de TypeScript y React

### Específicos por plataforma:

**Vercel + PlanetScale**:
```bash
# Vercel CLI
npm install -g vercel
# PlanetScale CLI  
npm install -g pscale
```

**Railway + PostgreSQL**:
```bash
# Railway CLI
npm install -g @railway/cli
```

**AWS Lambda + RDS**:
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
# AWS SAM CLI
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
```

**Docker + PostgreSQL Local**:
```bash
# Docker Engine
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin
# o Docker Desktop para macOS/Windows
```

## 🚀 Inicio Rápido

### 1. Clonar y Configurar
```bash
git clone <tu-repositorio>
cd minimarket-system
npm install
```

### 2. Configurar Variables de Entorno
```bash
# Copiar template
cp .env.example .env.local

# Editar según la plataforma elegida
nano .env.local
```

### 3. Elegir Plataforma y Seguir Guía

#### Para Desarrollo Rápido (Recomendado)
👉 **[Docker + PostgreSQL Local](./04-docker-postgresql-local.md)**

#### Para Producción Simple
👉 **[Railway + PostgreSQL](./02-railway-postgresql.md)**

#### Para Máximo Performance
👉 **[Vercel + PlanetScale](./01-vercel-planetscale-mysql.md)**

#### Para Enterprise
👉 **[AWS Lambda + RDS](./03-aws-lambda-rds.md)**

## 🔧 Comandos Comunes

### Desarrollo Local
```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev

# Build para producción
pnpm build

# Ejecutar tests
pnpm test

# Linting
pnpm lint
```

### Con Docker
```bash
# Iniciar servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Limpiar todo
docker system prune -a
```

## 📊 Monitoreo y Logs

### Health Checks
```bash
# Verificar servicios
curl http://localhost:3000/health
curl http://localhost:3001/health

# Verificar base de datos
docker compose exec postgres pg_isready -U postgres
```

### Logs
```bash
# Vercel
vercel logs

# Railway
railway logs

# Docker
docker compose logs -f [servicio]
```

## 🐛 Troubleshooting Común

### Problemas de Build
```bash
# Limpiar caché
rm -rf node_modules .vite
pnpm install

# Verificar versiones
node --version
npm --version
```

### Problemas de Base de Datos
```bash
# Verificar variables de entorno
echo $DATABASE_URL

# Test de conectividad
node -e "require('./src/lib/database').connectToDatabase()"
```

### Problemas de Permisos (Linux/Mac)
```bash
# Verificar propietario
ls -la

# Cambiar propietario si es necesario
sudo chown -R $USER:$USER .

# Verificar grupo docker
groups $USER
sudo usermod -aG docker $USER
```

## 🔐 Seguridad

### Variables de Entorno
- ✅ Usar variables de entorno para secrets
- ✅ Nunca commitear passwords en Git
- ✅ Usar diferentes credenciales por entorno

### Base de Datos
- ✅ Conexiones SSL en producción
- ✅ Pooling de conexiones configurado
- ✅ Backups automáticos programados

### Autenticación
- ✅ JWT con expiración razonable
- ✅ Passwords hasheados con bcrypt
- ✅ Rate limiting implementado

## 📈 Optimización

### Performance Frontend
```typescript
// Configuración optimizada en vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
});
```

### Performance Base de Datos
```sql
-- Índices importantes
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_usuarios_email ON usuarios(email);
```

## 🤝 Contribuir

### Estructura de Directorios
```
docs/
├── 01-vercel-planetscale-mysql.md    # Vercel + MySQL
├── 02-railway-postgresql.md          # Railway + PostgreSQL
├── 03-aws-lambda-rds.md              # AWS Lambda + RDS
├── 04-docker-postgresql-local.md     # Docker Local
└── README.md                         # Este archivo
```

### Actualizar Guías
1. Editar la guía específica
2. Actualizar matriz de decisión si hay cambios
3. Verificar que todos los comandos funcionen
4. Probar en entorno limpio si es posible

## 📞 Soporte

### Recursos Adicionales
- [Documentación Vercel](https://vercel.com/docs)
- [Documentación Railway](https://docs.railway.app)
- [Documentación AWS](https://docs.aws.amazon.com)
- [Documentación Docker](https://docs.docker.com)

### Issues Comunes
| Issue | Plataforma | Solución |
|-------|------------|----------|
| Build falla | Todas | Verificar variables de entorno |
| DB no conecta | Todas | Verificar DATABASE_URL |
| CORS errors | Todas | Configurar CORS correctamente |
| Puerto en uso | Local/Docker | Cambiar puertos o kill procesos |

---

**Última actualización**: 2025-10-31  
**Versión**: 1.0  
**Mantenido por**: Mini Market Team

¿Tienes preguntas? Abre un issue en el repositorio o consulta la documentación específica de cada plataforma.
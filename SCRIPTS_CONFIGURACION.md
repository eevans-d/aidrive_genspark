# Scripts de Configuración - Mini Market Backend

Este directorio contiene un conjunto completo de scripts automatizados para configurar, probar y deployar el backend del Mini Market.

## 📁 Archivos Incluidos

### Scripts Principales

- **`setup.sh`** - Configuración inicial del entorno
- **`migrate.sh`** - Gestión de migraciones de base de datos
- **`test.sh`** - Ejecución de suites de testing
- **`deploy.sh`** - Deployment automatizado
- **`.env.example`** - Plantilla de variables de entorno

### Configuración

- **`package.json`** - Scripts npm integrados

## 🚀 Inicio Rápido

### 1. Configuración Inicial

```bash
# Configuración básica
bash setup.sh

# Configuración para desarrollo
bash setup.sh dev

# Configuración para producción
bash setup.sh prod
```

### 2. Configurar Variables de Entorno

1. Copiar el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. Editar `.env` con tus configuraciones:
   ```bash
   nano .env
   ```

### 3. Ejecutar Migraciones

```bash
# Ejecutar migraciones
bash migrate.sh up

# Verificar estado
bash migrate.sh status

# Poblar con datos iniciales
bash migrate.sh seed
```

### 4. Ejecutar Tests

```bash
# Tests completos
bash test.sh

# Solo tests unitarios
bash test.sh unit

# Tests con cobertura
bash test.sh all true
```

### 5. Deploy

```bash
# Deploy a staging (default)
bash deploy.sh

# Deploy a producción
bash deploy.sh production

# Simular deploy (dry-run)
bash deploy.sh staging true
```

## 📋 Scripts Detallados

### Setup Script (`setup.sh`)

Configura el entorno de desarrollo automáticamente.

**Uso:**
```bash
bash setup.sh [opciones]
```

**Opciones:**
- `dev` - Instalación para desarrollo
- `prod` - Instalación para producción

**Funciones:**
- Verifica dependencias (Node.js, npm/pnpm, Git)
- Configura variables de entorno
- Instala dependencias
- Configura hooks de Git
- Verifica configuración de Supabase
- Crea directorios de trabajo

**Salida:**
```
[✓] Node.js v18.x.x encontrado
[✓] pnpm 8.x.x encontrado
[✓] Git encontrado
[✓] Archivo .env creado desde .env.example
[✓] Dependencias de desarrollo instaladas
[✓] Pre-commit hook configurado
[✓] Supabase CLI encontrado
[✓] Scripts adicionales creados
```

### Migrate Script (`migrate.sh`)

Gestiona migraciones de base de datos Supabase/PostgreSQL.

**Uso:**
```bash
bash migrate.sh [comando] [ambiente]
```

**Comandos:**
- `up` - Ejecutar migraciones hacia adelante
- `down` - Revertir última migración
- `status` - Ver estado de migraciones
- `seed` - Poblar base de datos con datos iniciales
- `reset` - Reset completo de base de datos (⚠️ destructivo)
- `list` - Listar migraciones disponibles
- `backup` - Crear backup manual

**Ejemplos:**
```bash
# Migrar a la última versión
bash migrate.sh up

# Ver estado actual
bash migrate.sh status

# Poblar con datos de prueba
bash migrate.sh seed

# Backup antes de migración crítica
bash migrate.sh backup

# Reset completo (CUIDADO)
bash migrate.sh reset
```

### Test Script (`test.sh`)

Ejecuta suites completas de testing.

**Uso:**
```bash
bash test.sh [tipo] [cobertura] [verbose] [paralelo]
```

**Tipos de Test:**
- `unit` - Tests unitarios
- `integration` - Tests de integración
- `e2e` - Tests End-to-End
- `load` - Tests de carga
- `security` - Tests de seguridad
- `all` - Todos los tests

**Parámetros:**
- `cobertura` - true/false (generar reporte de cobertura)
- `verbose` - true/false (output detallado)
- `paralelo` - true/false (ejecución en paralelo)

**Ejemplos:**
```bash
# Tests unitarios básicos
bash test.sh unit

# Tests completos con cobertura
bash test.sh all true

# Tests de integración detallados
bash test.sh integration false true

# Solo tests de seguridad
bash test.sh security
```

**Reportes Generados:**
- `test-reports/test-summary.json` - Resumen consolidado
- `coverage/coverage-summary.json` - Métricas de cobertura
- `coverage/html/` - Reporte web de cobertura

### Deploy Script (`deploy.sh`)

Deployment automatizado a diferentes entornos.

**Uso:**
```bash
bash deploy.sh [entorno] [build_number] [commit_sha] [dry_run] [force]
```

**Entornos:**
- `dev` - Deployment a desarrollo
- `staging` - Deployment a staging (default)
- `production` - Deployment a producción

**Parámetros:**
- `build_number` - Número de build (timestamp por defecto)
- `commit_sha` - SHA del commit (git por defecto)
- `dry_run` - true/false (simular deployment)
- `force` - true/false (ignorar checks de seguridad)

**Ejemplos:**
```bash
# Deploy básico a staging
bash deploy.sh

# Deploy a producción
bash deploy.sh production

# Simular deployment
bash deploy.sh staging true

# Deploy forzado (ignora checks)
bash deploy.sh staging false false true
```

**Proceso de Deploy:**
1. Verifica precondiciones
2. Ejecuta pre-deployment checks
3. Crea backup
4. Construye aplicación
5. Deploy edge functions
6. Aplica migraciones
7. Configura entorno post-deployment
8. Ejecuta post-deployment tests
9. Notifica completion

## 🔧 Scripts npm Integrados

Los scripts están integrados en `package.json` para facilitar el uso:

### Configuración
```bash
npm run setup          # bash setup.sh
npm run setup:dev      # bash setup.sh dev
npm run setup:prod     # bash setup.sh prod
```

### Migraciones
```bash
npm run migrate        # bash migrate.sh
npm run migrate:up     # bash migrate.sh up
npm run migrate:down   # bash migrate.sh down
npm run migrate:status # bash migrate.sh status
npm run migrate:seed   # bash migrate.sh seed
npm run migrate:reset  # bash migrate.sh reset
npm run migrate:backup # bash migrate.sh backup
```

### Testing
```bash
npm run test           # bash test.sh
npm run test:unit      # bash test.sh unit
npm run test:integration # bash test.sh integration
npm run test:e2e       # bash test.sh e2e
npm run test:load      # bash test.sh load
npm run test:security  # bash test.sh security
npm run test:coverage  # bash test.sh all true
npm run test:verbose   # bash test.sh all false true
```

### Deployment
```bash
npm run deploy         # bash deploy.sh
npm run deploy:dev     # bash deploy.sh dev
npm run deploy:staging # bash deploy.sh staging
npm run deploy:prod    # bash deploy.sh production
npm run deploy:dry-run # bash deploy.sh staging true
```

### Utilidades
```bash
npm run health         # Verificar health check
npm run logs           # Ver logs en tiempo real
npm run backup         # Crear backup manual
```

### CI/CD
```bash
npm run ci:setup       # Setup completo para CI
npm run ci:deploy      # Deploy automatizado para CI
npm run ci:release     # Release a producción
```

### Dev Flow
```bash
npm run dev:full       # Setup completo + dev server
npm run prod:prepare   # Preparar para producción
npm run db:reset       # Reset base de datos
npm run db:seed        # Poblar base de datos
npm run db:status      # Estado de migraciones
```

## 🏗️ Estructura de Directorios

```
├── setup.sh                 # Script de instalación
├── migrate.sh              # Script de migraciones
├── test.sh                 # Script de testing
├── deploy.sh               # Script de deployment
├── .env.example            # Plantilla de variables
├── package.json            # Scripts npm
├── minimarket-system/      # Proyecto React
│   ├── src/
│   ├── supabase/
│   │   ├── functions/      # Edge functions
│   │   ├── migrations/     # Migraciones DB
│   │   └── cron_jobs/      # Trabajos programados
│   └── ...
├── logs/                   # Logs de aplicación
├── backups/               # Backups de DB
└── temp/                  # Archivos temporales
```

## 🔍 Ejemplos de Flujos Completos

### Desarrollo Local

```bash
# 1. Configurar entorno
npm run setup:dev

# 2. Configurar variables
cp .env.example .env
nano .env

# 3. Migrar y poblar
npm run migrate:up
npm run migrate:seed

# 4. Verificar funcionamiento
npm run test:unit

# 5. Iniciar desarrollo
npm run dev
```

### Deploy a Producción

```bash
# 1. Preparar entorno
npm run prod:prepare

# 2. Tests completos
npm run test:coverage

# 3. Deploy
npm run ci:release
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Environment
        run: npm run ci:setup
        
      - name: Run Tests
        run: npm run test:coverage
        
      - name: Deploy to Staging
        run: npm run ci:deploy
```

## 📊 Monitoreo y Logs

### Ver Logs
```bash
# Logs en tiempo real
npm run logs

# Logs específicos
tail -f logs/app.log

# Logs de deployment
ls logs/deployment-*.json
```

### Health Checks
```bash
# Verificar salud del sistema
npm run health

# Verificar estado de migraciones
npm run db:status
```

### Métricas
```bash
# Ver reportes de tests
cat test-reports/test-summary.json

# Ver cobertura
cat coverage/coverage-summary.json
```

## 🛠️ Personalización

### Variables de Entorno Adicionales

Añadir al `.env` según necesidades:

```bash
# Monitoreo
SENTRY_DSN=your_sentry_dsn
MONITORING_ENABLED=true

# Integraciones externas
STRIPE_SECRET_KEY=sk_test_...
WEBHOOK_SECRET=whsec_...

# Configuración específica del proyecto
CUSTOM_CONFIG=value
```

### Extender Scripts

Los scripts están diseñados para ser extendibles:

1. **setup.sh** - Añadir dependencias específicas
2. **migrate.sh** - Integrar con otras herramientas DB
3. **test.sh** - Añadir frameworks de testing adicionales
4. **deploy.sh** - Integrar con plataformas específicas

## 🆘 Solución de Problemas

### Errores Comunes

#### 1. Permisos de Scripts
```bash
# Si los scripts no son ejecutables
bash setup.sh        # Usar bash directamente
chmod +x *.sh        # Dar permisos de ejecución
```

#### 2. Variables de Entorno
```bash
# Verificar configuración
cat .env
source .env && env | grep SUPABASE
```

#### 3. Dependencias Faltantes
```bash
# Instalar Supabase CLI
npm install -g supabase

# Verificar versiones
node -v
npm -v
supabase -v
```

#### 4. Errores de Migración
```bash
# Verificar estado
npm run db:status

# Backup y reset
npm run backup
npm run db:reset
npm run migrate:seed
```

### Logs de Debug

```bash
# Ejecutar con debug
DEBUG=* bash setup.sh

# Logs detallados de deploy
bash deploy.sh staging false true
```

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Migraciones](https://supabase.com/docs/guides/database/migrations)
- [Testing Best Practices](https://jestjs.io/docs/tutorial-async)
- [Deployment Strategies](https://docs.github.com/en/actions/deployment)

## 🤝 Contribución

Para contribuir o reportar problemas:

1. Verificar que todos los tests pasen: `npm run test:coverage`
2. Ejecutar linting: `npm run lint`
3. Probar scripts localmente
4. Documentar cambios en este README

---

**¡Listo para usar!** 🚀

Estos scripts proporcionan una automatización completa para el ciclo de desarrollo, testing y deployment del Mini Market Backend.
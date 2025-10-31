# Guía de Despliegue: AWS Lambda + RDS

## 📋 Resumen
Esta guía explica cómo desplegar la aplicación React + TypeScript en AWS Lambda usando RDS PostgreSQL como base de datos. Incluye configuración de CloudFront para el frontend estático y Lambda para APIs serverless.

## 🛠️ Stack Tecnológico
- **Frontend**: React + TypeScript + Vite (CloudFront + S3)
- **Backend**: AWS Lambda + API Gateway
- **Base de Datos**: Amazon RDS PostgreSQL
- **Storage**: S3 para assets estáticos
- **CDN**: CloudFront
- **ORM**: Prisma con PostgreSQL

## 🏗️ Arquitectura AWS
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   API Gateway    │    │    RDS          │
│   (CDN)         │    │   (REST API)     │    │   PostgreSQL    │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ S3 (Frontend)│ │    │ │ Lambda       │ │    │ │ PostgreSQL  │ │
│ │ Static      │ │◄──►│ │ Functions    │ │◄──►│ │ Database    │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Configuración Previa

### 1. Instalar AWS CLI y SAM CLI
```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Instalar AWS SAM CLI
# Ubuntu/Debian
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip
sudo ./install

# Verificar instalación
aws --version
sam --version
```

### 2. Configurar AWS Credentials
```bash
# Configurar credenciales AWS
aws configure

# Ingresar:
# AWS Access Key ID: [tu-access-key]
# AWS Secret Access Key: [tu-secret-key]
# Default region name: us-east-1
# Default output format: json
```

### 3. Instalar Herramientas Adicionales
```bash
# Serverless Framework (alternativa a SAM)
npm install -g serverless

# CDK (opcional)
npm install -g aws-cdk

# Terraform (opcional)
# Descargar desde https://terraform.io
```

## 🗄️ Configuración de Amazon RDS PostgreSQL

### 1. Crear Instancia RDS PostgreSQL

#### Desde AWS Console
1. Ir a AWS RDS Console
2. Click "Create database"
3. Engine: PostgreSQL
4. Version: PostgreSQL 15.x (recomendado)
5. Template: Production (para producción)
6. DB instance identifier: `mini-market-db`
7. Master username: `postgres`
8. Master password: [generar password seguro]
9. DB instance size: `db.t3.micro` (para desarrollo)
10. Storage: 20 GB, Auto-scaling enabled
11. VPC: Crear o seleccionar VPC existente
12. Public access: No (para producción)
13. Security group: Crear nuevo
14. Database authentication: Password authentication
15. Monitoring: Enable Enhanced Monitoring
16. Click "Create database"

#### Con AWS CLI
```bash
# Crear Security Group
aws ec2 create-security-group \
    --group-name mini-market-rds-sg \
    --description "Security group for Mini Market RDS"

# Crear DB Subnet Group
aws rds create-db-subnet-group \
    --db-subnet-group-name mini-market-subnet-group \
    --db-subnet-group-description "Subnet group for Mini Market RDS" \
    --subnet-ids subnet-12345 subnet-67890

# Crear instancia RDS (versión simplificada)
aws rds create-db-instance \
    --db-instance-identifier mini-market-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username postgres \
    --master-user-password [your-secure-password] \
    --allocated-storage 20 \
    --storage-type gp2 \
    --db-subnet-group-name mini-market-subnet-group \
    --vpc-security-group-ids sg-12345 \
    --backup-retention-period 7 \
    --multi-az \
    --storage-encrypted
```

#### Variables de Conexión RDS
```env
# Guardar estos valores para configuración posterior
DB_HOST=mini-market-db.xxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[tu-password-seguro]
DB_SSL=true
```

### 2. Configurar Base de Datos PostgreSQL

#### Conectar a RDS
```bash
# Instalar psql
sudo apt-get install postgresql-client

# Conectar a la instancia
psql -h mini-market-db.xxxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d postgres \
     -p 5432

# Cuando solicite password, ingresar el master password
```

#### Script de Configuración de Tablas
```sql
-- Crear base de datos específica
CREATE DATABASE minimarket;

-- Conectar a la nueva base de datos
\c minimarket;

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Crear usuario de aplicación
CREATE USER app_user WITH PASSWORD 'app_user_secure_password';

-- Crear tablas principales
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

-- Índices para optimización
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

-- Otorgar permisos al usuario de aplicación
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Configurar permisos para futuro
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
```

## 🚀 Configuración del Backend (Lambda Functions)

### 1. Estructura del Proyecto Lambda
```
backend/
├── src/
│   ├── handlers/
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   └── categories.ts
│   ├── lib/
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── response.ts
│   └── types/
│       └── index.ts
├── package.json
├── tsconfig.json
├── samconfig.toml
└── template.yaml
```

### 2. Instalar Dependencias Lambda
```bash
# En el directorio backend
npm init -y
npm install @prisma/client pg bcryptjs jsonwebtoken
npm install -D prisma @types/pg @types/bcryptjs @types/jsonwebtoken
npm install -D @types/aws-lambda @types/node typescript
npm install -D serverless-webpack webpack webpack-node ExternalsPlugin
npm install -D esbuild
```

### 3. Configuración Prisma para Lambda
```prisma
// backend/prisma/schema.prisma
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

### 4. Configuración SAM (template.yaml)
```yaml
# backend/template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Mini Market Backend API

Globals:
  Function:
    Runtime: nodejs18.x
    Timeout: 30
    MemorySize: 512
    Environment:
      Variables:
        NODE_ENV: production
        DATABASE_URL: !Sub "postgresql://${AppUser}:${AppPassword}@${RDSEndpoint}:5432/minimarket"
        JWT_SECRET: !Ref JwtSecret
    Layers:
      - !Ref PrismaLayer

Parameters:
  JwtSecret:
    Type: String
    Description: JWT secret key for authentication
    MinLength: 32
  AppUser:
    Type: String
    Description: Database user
    Default: app_user
  AppPassword:
    Type: String
    Description: Database password
    NoEcho: true
  RDSEndpoint:
    Type: String
    Description: RDS instance endpoint

Resources:
  # Capa para Prisma y dependencias
  PrismaLayer:
    Type: AWS::Serverless::LayerVersion
    Properties:
      LayerName: prisma-layer
      Description: Prisma and database dependencies
      ContentUri: layers/prisma/
      CompatibleRuntimes:
        - nodejs18.x
      CompatibleArchitectures:
        - x86_64

  # API Gateway
  MiniMarketApi:
    Type: AWS::Serverless::Api
    Properties:
      Name: MiniMarketAPI
      StageName: prod
      TracingConfig:
        Mode: Active
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        AllowOrigin: "'*'"
      Auth:
        DefaultAuthorizer: LambdaTokenAuthorizer
        Authorizers:
          LambdaTokenAuthorizer:
            FunctionArn: !GetAtt AuthorizerFunction.Arn

  # Función de Autorización
  AuthorizerFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/handlers/
      Handler: auth.authorizer
      Environment:
        Variables:
          JWT_SECRET: !Ref JwtSecret

  # Función de Autenticación
  AuthFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/handlers/
      Handler: auth.handler
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - logs:CreateLogGroup
                - logs:CreateLogStream
                - logs:PutLogEvents
              Resource: 'arn:aws:logs:*:*:*'
      Events:
        Login:
          Type: Api
          Properties:
            RestApiId: !Ref MiniMarketApi
            Path: /auth/login
            Method: post
        Register:
          Type: Api
          Properties:
            RestApiId: !Ref MiniMarketApi
            Path: /auth/register
            Method: post

  # Función de Productos
  ProductsFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/handlers/
      Handler: products.handler
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - logs:CreateLogGroup
                - logs:CreateLogStream
                - logs:PutLogEvents
              Resource: 'arn:aws:logs:*:*:*'
      Events:
        GetProducts:
          Type: Api
          Properties:
            RestApiId: !Ref MiniMarketApi
            Path: /products
            Method: get
        GetProduct:
          Type: Api
          Properties:
            RestApiId: !Ref MiniMarketApi
            Path: /products/{id}
            Method: get
        CreateProduct:
          Type: Api
          Properties:
            RestApiId: !Ref MiniMarketApi
            Path: /products
            Method: post

  # Función de Categorías
  CategoriesFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/handlers/
      Handler: categories.handler
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - logs:CreateLogGroup
                - logs:CreateLogStream
                - logs:PutLogEvents
              Resource: 'arn:aws:logs:*:*:*'
      Events:
        GetCategories:
          Type: Api
          Properties:
            RestApiId: !Ref MiniMarketApi
            Path: /categories
            Method: get

Outputs:
  MiniMarketApiUrl:
    Description: "API Gateway endpoint URL for Prod stage"
    Value: !Sub "https://${MiniMarketApi}.execute-api.${AWS::Region}.amazonaws.com/prod/"
  ApiGatewayUrl:
    Description: "API Gateway URL"
    Value: !Ref MiniMarketApi
```

### 5. Implementación de Lambda Functions

#### Handler de Autenticación (src/handlers/auth.ts)
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createResponse } from '../lib/response';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path } = event;
    const body = event.body ? JSON.parse(event.body) : {};

    switch (httpMethod) {
      case 'POST':
        if (path.endsWith('/login')) {
          return await login(body);
        } else if (path.endsWith('/register')) {
          return await register(body);
        }
        break;
    }

    return createResponse(404, { message: 'Not Found' });
  } catch (error) {
    console.error('Auth handler error:', error);
    return createResponse(500, { message: 'Internal Server Error' });
  }
};

async function login(body: LoginRequest): Promise<APIGatewayProxyResult> {
  const { email, password } = body;

  if (!email || !password) {
    return createResponse(400, { message: 'Email and password are required' });
  }

  const user = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!user || !user.activo) {
    return createResponse(401, { message: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return createResponse(401, { message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      rol: user.rol 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return createResponse(200, {
    token,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    },
  });
}

async function register(body: RegisterRequest): Promise<APIGatewayProxyResult> {
  const { email, password, nombre } = body;

  if (!email || !password || !nombre) {
    return createResponse(400, { message: 'Email, password and nombre are required' });
  }

  const existingUser = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existingUser) {
    return createResponse(409, { message: 'User already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.usuario.create({
    data: {
      email,
      passwordHash,
      nombre,
      rol: 'usuario',
    },
  });

  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      rol: user.rol 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return createResponse(201, {
    token,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    },
  });
}

// Lambda Authorizer
export const authorizer = async (event: any): Promise<any> => {
  try {
    const token = event.authorizationToken?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    return {
      principalId: decoded.userId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn,
          },
        ],
      },
      context: {
        userId: decoded.userId,
        email: decoded.email,
        rol: decoded.rol,
      },
    };
  } catch (error) {
    console.error('Authorizer error:', error);
    throw new Error('Unauthorized');
  }
};
```

#### Handler de Productos (src/handlers/products.ts)
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { createResponse } from '../lib/response';

const prisma = new PrismaClient();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, pathParameters, path } = event;

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          return await getProduct(pathParameters.id);
        } else {
          return await getProducts();
        }
      case 'POST':
        if (!path.endsWith('/products')) {
          return createResponse(404, { message: 'Not Found' });
        }
        const body = event.body ? JSON.parse(event.body) : {};
        return await createProduct(body);
      default:
        return createResponse(405, { message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Products handler error:', error);
    return createResponse(500, { message: 'Internal Server Error' });
  }
};

async function getProducts(): Promise<APIGatewayProxyResult> {
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    include: {
      categoria: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return createResponse(200, { productos });
}

async function getProduct(id: string): Promise<APIGatewayProxyResult> {
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      categoria: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });

  if (!producto) {
    return createResponse(404, { message: 'Product not found' });
  }

  return createResponse(200, { producto });
}

async function createProduct(body: any): Promise<APIGatewayProxyResult> {
  const { nombre, descripcion, precio, stock, categoriaId } = body;

  if (!nombre || !precio) {
    return createResponse(400, { message: 'Nombre and precio are required' });
  }

  try {
    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        stock: stock ? parseInt(stock) : 0,
        categoriaId,
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return createResponse(201, { producto });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return createResponse(400, { message: 'Invalid categoria ID' });
    }
    throw error;
  }
}
```

#### Library de Response (src/lib/response.ts)
```typescript
export const createResponse = (statusCode: number, body: any): any => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  };
};

export const createCorsResponse = (): any => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify({ message: 'CORS preflight response' }),
  };
};
```

### 6. Configuración de Build (samconfig.toml)
```toml
version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "mini-market-backend"
region = "us-east-1"
confirm_changeset = true
capabilities = "CAPABILITY_IAM"
parameter_overrides = "JwtSecret=your-jwt-secret-min-32-chars"
```

### 7. Package.json para Backend
```json
{
  "name": "mini-market-backend",
  "version": "1.0.0",
  "description": "Mini Market Backend API",
  "main": "dist/handlers/index.js",
  "scripts": {
    "build": "sam build",
    "build:watch": "sam build --watch",
    "deploy": "sam deploy --guided",
    "test": "jest",
    "package": "sam package --s3-bucket deployment-bucket --output-template-file packaged.yaml",
    "local": "sam local start-api --port 3001",
    "generate": "prisma generate",
    "migrate": "prisma migrate deploy"
  },
  "dependencies": {
    "@prisma/client": "^5.7.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.126",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.5",
    "@types/pg": "^8.10.9",
    "prisma": "^5.7.1",
    "typescript": "^5.3.3",
    "jest": "^29.7.0"
  }
}
```

### 8. Despliegue del Backend
```bash
# En el directorio backend
cd backend

# Generar Prisma Client
npm run generate

# Build del proyecto
npm run build

# Desplegar (primera vez - modo guiado)
npm run deploy

# Parámetros requeridos:
# Stack Name: mini-market-backend
# Region: us-east-1
# JWT Secret: [tu-jwt-secret-de-minimo-32-caracteres]
# RDS Endpoint: [endpoint-de-tu-instancia-rds]
# App User: app_user
# App Password: [password-del-usuario-app]

# Despliegue subsiguiente
sam deploy --no-confirm-changeset
```

## 🌐 Configuración del Frontend (S3 + CloudFront)

### 1. Crear Bucket S3
```bash
# Crear bucket S3
aws s3 mb s3://mini-market-frontend-$(date +%s)

# Configurar bucket para hosting estático
aws s3 website s3://mini-market-frontend-123456 \
    --index-document index.html \
    --error-document index.html

# Política para lectura pública
aws s3api put-bucket-policy \
    --bucket mini-market-frontend-123456 \
    --policy '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "PublicReadGetObject",
          "Effect": "Allow",
          "Principal": "*",
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::mini-market-frontend-123456/*"
        }
      ]
    }'
```

### 2. Configurar CloudFront
```bash
# Crear distribución CloudFront
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

#### cloudfront-config.json
```json
{
  "CallerReference": "mini-market-frontend-2023",
  "Comment": "Mini Market Frontend Distribution",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-mini-market-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "Origins": [
    {
      "Id": "S3-mini-market-frontend",
      "DomainName": "mini-market-frontend-123456.s3.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      }
    }
  ],
  "Enabled": true,
  "PriceClass": "PriceClass_100",
  "DefaultRootObject": "index.html"
}
```

### 3. Build y Deploy del Frontend
```bash
# En el directorio del frontend
cd minimarket-system

# Configurar variables de entorno para producción
cat > .env.production << EOF
VITE_API_BASE_URL=https://tu-api-id.execute-api.us-east-1.amazonaws.com/prod
VITE_APP_ENV=production
EOF

# Build para producción
npm run build:prod

# Subir archivos a S3
aws s3 sync dist/ s3://mini-market-frontend-123456 --delete

# Invalidar caché de CloudFront
aws cloudfront create-invalidation \
    --distribution-id E1234567890ABC \
    --paths "/*"
```

### 4. Configuración del Frontend para AWS
```typescript
// src/config/api.ts
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isProduction ? 'https://tu-api-id.execute-api.us-east-1.amazonaws.com/prod' : 'http://localhost:3001');

export const config = {
  api: {
    baseURL: API_BASE_URL,
    timeout: 30000,
  },
  environment: import.meta.env.VITE_APP_ENV || 'development',
};
```

```typescript
// src/services/api.ts
import axios from 'axios';
import { config } from '../config/api';

const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 🔧 Configuración de Variables de Entorno

### Backend (Lambda)
```bash
# Variables en el deployment SAM
JWT_SECRET=your-jwt-secret-min-32-characters
NODE_ENV=production
DATABASE_URL=postgresql://app_user:password@db-endpoint:5432/minimarket

# Variables gestionadas automáticamente por AWS
AWS_REGION=us-east-1
AWS_LAMBDA_FUNCTION_NAME=mini-market-backend-xxxx
AWS_EXECUTION_ENV=AWS_Lambda_nodejs18.x
```

### Frontend (Build)
```env
# .env.production
VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
VITE_APP_ENV=production
VITE_CLOUDFRONT_DOMAIN=your-distribution.cloudfront.net
```

## 🧪 Testing del Despliegue

### 1. Test de Backend
```bash
# Test local de Lambda functions
sam local start-api --port 3001

# Test de endpoints
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test123"}'
```

### 2. Test de Frontend
```bash
# Verificar que S3 sirva los archivos
curl https://your-distribution.cloudfront.net

# Verificar que el build sirva correctamente
aws s3 ls s3://mini-market-frontend-123456
```

### 3. Test de Integración
```typescript
// src/test/integration.test.ts
import api from '../services/api';

describe('API Integration', () => {
  test('should login successfully', async () => {
    const response = await api.post('/auth/login', {
      email: 'admin@test.com',
      password: 'test123'
    });
    
    expect(response.status).toBe(200);
    expect(response.data.token).toBeDefined();
  });

  test('should fetch products', async () => {
    const response = await api.get('/products');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.productos)).toBe(true);
  });
});
```

## 🐛 Troubleshooting

### Problema: RDS Connection Timeout
```bash
# Verificar que el Security Group permita conexiones
aws ec2 describe-security-groups --group-ids sg-123456

# Verificar que Lambda y RDS estén en la misma VPC
# O configurar VPC peering
```

**Solución**: 
1. Verificar Security Group de RDS permite inbound desde Lambda
2. Configurar VPC correctamente
3. Verificar credenciales de base de datos

### Problema: Lambda Cold Start Lento
```typescript
// Optimizar inicialización de Prisma
const prisma = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Pool de conexiones para Lambda
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=1',
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
```

**Solución**: 
1. Aumentar MemorySize para Lambda
2. Usar Provisioned Concurrency
3. Optimizar inicialización de Prisma

### Problema: CloudFront Cache No Se Actualiza
```bash
# Invalidar caché manualmente
aws cloudfront create-invalidation \
    --distribution-id E1234567890ABC \
    --paths "/*"
```

**Solución**: 
1. Configurar invalidaciones automáticas en CI/CD
2. Usar versionado de archivos
3. Configurar TTL apropiado

### Problema: CORS en API Gateway
```yaml
# En template.yaml - configuración CORS ya incluida
# Verificar headers específicos
Cors:
  AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
  AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
  AllowOrigin: "'*'"
```

### Problema: JWT Token Expira Muy Rápido
```typescript
// En auth.ts - aumentar tiempo de expiración
const token = jwt.sign(
  { 
    userId: user.id, 
    email: user.email, 
    rol: user.rol 
  },
  JWT_SECRET,
  { expiresIn: '7d' } // Cambiar de 24h a 7d
);
```

## 📊 Monitoreo y Logs

### 1. Configurar CloudWatch Logs
```bash
# Los logs se crean automáticamente para Lambda
# Ver logs específicos
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/mini-market"

# Seguir logs en tiempo real
aws logs tail "/aws/lambda/mini-market-products" --follow
```

### 2. Configurar X-Ray Tracing
```yaml
# En template.yaml - ya incluido
TracingConfig:
  Mode: Active
```

### 3. Configurar Alarmas CloudWatch
```bash
# Crear alarma para errores Lambda
aws cloudwatch put-metric-alarm \
    --alarm-name "Lambda Errors" \
    --alarm-description "Alarm when Lambda function has errors" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2
```

### 4. Monitoreo RDS
```bash
# Ver métricas RDS
aws cloudwatch list-metrics \
    --namespace AWS/RDS \
    --dimensions Name=DBInstanceIdentifier,Value=mini-market-db
```

## 🔐 Seguridad

### 1. Configuración de VPC para Lambda
```yaml
# En template.yaml - agregar VPC configuration
Environment:
  Variables:
    NODE_ENV: production
  VpcConfig:
    SecurityGroupIds:
      - !Ref LambdaSecurityGroup
    SubnetIds:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
```

### 2. KMS Encryption para RDS
```bash
# RDS ya configurado con encryption
# Verificar en la consola AWS
```

### 3. API Gateway Rate Limiting
```yaml
# En template.yaml
Api:
  Type: AWS::Serverless::Api
  Properties:
    StageName: prod
    TracingConfig:
      Mode: Active
    ThrottleRateLimit: 100
    ThrottleBurstLimit: 200
```

### 4. Variables de Entorno Seguras
```bash
# Usar AWS Systems Manager Parameter Store
aws ssm put-parameter \
    --name "/mini-market/jwt-secret" \
    --value "your-jwt-secret" \
    --type SecureString

# Cargar en Lambda function
JWT_SECRET: !GetAtt JwtSecretParameter.Value
```

## 🎯 Checklist de Despliegue

### RDS
- [ ] ✅ Instancia RDS PostgreSQL creada
- [ ] ✅ Security Group configurado
- [ ] ✅ Base de datos y tablas creadas
- [ ] ✅ Usuario de aplicación configurado
- [ ] ✅ Conexión testada desde local

### Backend (Lambda)
- [ ] ✅ Prisma schema configurado
- [ ] ✅ Lambda functions implementadas
- [ ] ✅ API Gateway configurado
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Deployment SAM exitoso
- [ ] ✅ Endpoints funcionando

### Frontend (S3 + CloudFront)
- [ ] ✅ Bucket S3 creado para hosting
- [ ] ✅ CloudFront distribution configurada
- [ ] ✅ Build de producción exitoso
- [ ] ✅ Archivos subidos a S3
- [ ] ✅ Dominio personalizado configurado (opcional)
- [ ] ✅ SSL/HTTPS funcionando

### Integración
- [ ] ✅ Frontend conecta a API Gateway
- [ ] ✅ Autenticación JWT funcionando
- [ ] ✅ CRUD de productos funcionando
- [ ] ✅ CORS configurado correctamente
- [ ] ✅ Error handling implementado

### Monitoreo
- [ ] ✅ CloudWatch logs configurados
- [ ] ✅ X-Ray tracing habilitado
- [ ] ✅ Alarmas de error configuradas
- [ ] ✅ Métricas RDS monitoreando

## 🆘 Comandos Útiles

```bash
# RDS Management
aws rds describe-db-instances
aws rds describe-db-engine-versions --engine postgres
aws rds modify-db-instance --db-instance-identifier mini-market-db --apply-immediately

# Lambda Management
sam logs --name mini-market-backend
sam local invoke ProductsFunction --event '{"httpMethod":"GET","path":"/products"}'

# S3 Management
aws s3 ls s3://mini-market-frontend-123456
aws s3 sync ./dist s3://mini-market-frontend-123456 --delete

# CloudFront Management
aws cloudfront get-distribution --id E1234567890ABC
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"

# API Gateway Management
aws apigateway get-rest-apis
aws apigateway get-stages --rest-api-id your-api-id

# Deployment
sam build
sam deploy --no-confirm-changeset
sam delete --stack-name mini-market-backend
```

---

**Última actualización**: 2025-10-31  
**Versión**: 1.0  
**Stack**: React + TypeScript + Vite + Lambda + RDS PostgreSQL + CloudFront
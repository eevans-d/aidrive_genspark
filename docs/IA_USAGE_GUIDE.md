# 🤖 Guía de Uso de IA para Sistema Mini Market

**Versión:** 1.0.1  
**Fecha:** 2026-01-26  
**Basado en:** AGENTS.md y patrones reales del proyecto

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Estado del Proyecto](#estado-del-proyecto)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Patrones de Código](#patrones-de-código)
5. [Comandos Frecuentes](#comandos-frecuentes)
6. [Guía para Agentes IA](#guía-para-agentes-ia)
7. [Advertencias Importantes](#advertencias-importantes)
8. [Variables de Entorno](#variables-de-entorno)
9. [Testing](#testing)
10. [CI/CD](#cicd)

---

## Introducción

Esta guía está diseñada para **agentes de IA** (GitHub Copilot, ChatGPT, Claude, etc.) que trabajan en el proyecto Sistema Mini Market. Proporciona contexto esencial, patrones de código, y mejores prácticas para asistir efectivamente a desarrolladores.

### Alcance del Sistema
- **Tipo:** Sistema de gestión para mini markets
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions en Deno)
- **Testing:** Vitest + Playwright
- **CI/CD:** GitHub Actions

---

## Estado del Proyecto

### Estado Actual (fuente de verdad)
Ver `docs/ESTADO_ACTUAL.md` para métricas, entorno y pendientes actualizados.  
Plan vigente y checklist único: `docs/HOJA_RUTA_MADRE_2026-01-31.md`.  
Plan operativo específico (WARN residual Advisor): `docs/PLAN_MITIGACION_WARN_STAGING_2026-01-31.md`.

### Contexto Importante
- Proyecto en fase de **cierre avanzado** (RLS + Advisor mitigado en PROD)
- RLS audit **completada y revalidada** (2026-01-31)
- Security Advisor mitigado (ERROR=0, WARN=2, INFO=15; pendiente leaked password protection)
- Integration/E2E tests **gated** en CI (pendiente secrets en GitHub)
- Documentación técnica **completa y actualizada**

---

## Estructura del Proyecto

```
aidrive_genspark/
├── minimarket-system/              # Frontend React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/                  # 9 páginas (data via React Query)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Deposito.tsx
│   │   │   ├── Stock.tsx
│   │   │   ├── Productos.tsx
│   │   │   ├── Proveedores.tsx
│   │   │   ├── Kardex.tsx
│   │   │   ├── Tareas.tsx
│   │   │   └── Rentabilidad.tsx
│   │   ├── hooks/
│   │   │   └── queries/            # 8 custom hooks React Query
│   │   │       ├── useDashboardStats.ts
│   │   │       ├── useDeposito.ts
│   │   │       ├── useKardex.ts
│   │   │       ├── useProductos.ts
│   │   │       ├── useProveedores.ts
│   │   │       ├── useStock.ts
│   │   │       ├── useTareas.ts
│   │   │       └── useRentabilidad.ts
│   │   ├── components/             # 3 componentes compartidos
│   │   │   ├── Layout.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx     # ⚠️ CRÍTICO - Autenticación
│   │   ├── lib/
│   │   │   ├── supabase.ts         # Cliente Supabase
│   │   │   └── apiClient.ts        # Cliente para Gateway
│   │   └── types/
│   │       └── database.ts         # Tipos TypeScript de BD
│   ├── package.json                # Scripts y dependencias (pnpm)
│   └── vite.config.ts
│
├── supabase/
│   ├── functions/                  # Edge Functions (Deno)
│   │   ├── _shared/                # ⚠️ Módulos compartidos (USAR SIEMPRE)
│   │   │   ├── logger.ts           # ✅ Logging estructurado (NO console.log)
│   │   │   ├── response.ts         # ✅ respondOk, respondFail
│   │   │   ├── cors.ts             # ✅ Headers CORS unificados
│   │   │   ├── errors.ts           # ✅ AppError, HttpError
│   │   │   ├── rate-limit.ts       # ✅ Rate limiting
│   │   │   └── circuit-breaker.ts  # ✅ Circuit breaker pattern
│   │   │
│   │   ├── api-minimarket/         # ⚠️ CRÍTICO - Gateway principal
│   │   │   ├── index.ts            # 29 endpoints, 1357 líneas
│   │   │   └── helpers/            # Helpers modularizados
│   │   │       ├── auth.ts         # JWT validation, roles
│   │   │       ├── validation.ts   # UUID, dates, required fields
│   │   │       ├── pagination.ts   # Pagination logic
│   │   │       └── supabase.ts     # DB client operations
│   │   │
│   │   ├── api-proveedor/          # API modular (9 endpoints)
│   │   │   ├── index.ts            # Router
│   │   │   ├── handlers/           # Request handlers
│   │   │   ├── schemas/            # Validation schemas
│   │   │   └── utils/              # Cache, metrics, auth
│   │   │
│   │   ├── scraper-maxiconsumo/    # Scraper modular (9 módulos)
│   │   │   ├── index.ts            # Orquestador
│   │   │   ├── types.ts
│   │   │   ├── config.ts
│   │   │   ├── cache.ts
│   │   │   ├── anti-detection.ts
│   │   │   ├── parsing.ts
│   │   │   ├── matching.ts
│   │   │   ├── alertas.ts
│   │   │   ├── storage.ts
│   │   │   └── scraping.ts
│   │   │
│   │   ├── cron-jobs-maxiconsumo/  # Orquestador de cron jobs
│   │   │   ├── orchestrator.ts
│   │   │   └── jobs/
│   │   │       ├── daily-price-update.ts
│   │   │       ├── realtime-alerts.ts
│   │   │       ├── weekly-analysis.ts
│   │   │       └── maintenance.ts
│   │   │
│   │   └── [otras funciones]/      # alertas-stock, reportes, etc.
│   │
│   └── migrations/                 # Migraciones SQL versionadas
│       ├── 20260110100000_fix_rls_security_definer.sql
│       └── ...
│
├── tests/
│   ├── unit/                       # Tests unitarios (ver docs/ESTADO_ACTUAL.md)
│   │   ├── api-proveedor-routing.test.ts
│   │   ├── scraper-parsing.test.ts
│   │   ├── scraper-matching.test.ts
│   │   ├── cron-jobs.test.ts
│   │   └── api-minimarket-gateway.test.ts
│   ├── integration/                # 31 tests (gated - requiere DB local)
│   ├── e2e/                        # 4 smoke tests (manual)
│   ├── security/                   # 14 tests + 1 skipped
│   └── performance/                # Baseline
│
├── docs/                           # 22 archivos de documentación
│   ├── ESTADO_ACTUAL.md            # ⭐ FUENTE DE VERDAD - Estado y avance
│   ├── HOJA_RUTA_MADRE_2026-01-31.md # Checklist único vigente
│   ├── ROADMAP.md                  # Plan rolling 90 días
│   ├── ARCHITECTURE_DOCUMENTATION.md # Arquitectura técnica
│   ├── API_README.md               # Documentación de endpoints
│   ├── CHECKLIST_CIERRE.md         # Estado de cierre
│   ├── DECISION_LOG.md             # Decisiones técnicas
│   └── closure/                    # Documentos de cierre
│       ├── BUILD_VERIFICATION.md
│       ├── PROJECT_CLOSURE_REPORT.md
│       └── SECURITY_RECOMMENDATIONS.md
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml                  # Pipeline: lint → test → build → typecheck
│   ├── dependabot.yml              # Actualizaciones de dependencias
│   └── CODEOWNERS                  # Owners por path
│
├── package.json                    # Scripts de test (raíz)
├── vitest.config.ts                # Config principal de Vitest
├── SECURITY.md                     # Política de seguridad
├── LICENSE                         # Licencia del proyecto
└── IA_USAGE_GUIDE.md              # Este archivo
```

---

## Patrones de Código

### Frontend - React Query Hook (Lectura)

**Patrón estándar para queries:**

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useProductos() {
  return useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre')
      
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}
```

**Uso en componente:**

```typescript
import { useProductos } from '../hooks/queries/useProductos'

export function ProductosPage() {
  const { data: productos, isLoading, error } = useProductos()
  
  if (isLoading) return <div>Cargando...</div>
  if (error) return <ErrorMessage error={error} />
  
  return (
    <div>
      {productos?.map(p => <div key={p.id}>{p.nombre}</div>)}
    </div>
  )
}
```

---

### Frontend - Mutación via Gateway (Escritura)

**⚠️ IMPORTANTE:** Las escrituras **SIEMPRE** deben ir via Gateway (`api-minimarket`)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productosApi } from '../lib/apiClient'

export function useCreateProducto() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { nombre: string, precio: number }) => 
      productosApi.create(data),
    onSuccess: () => {
      // Invalidar cache para refrescar lista
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    }
  })
}
```

**Uso en componente:**

```typescript
const createProducto = useCreateProducto()

const handleSubmit = async (data) => {
  try {
    await createProducto.mutateAsync(data)
    toast.success('Producto creado')
  } catch (error) {
    toast.error('Error al crear producto')
  }
}
```

---

### Backend - Nuevo Endpoint en Gateway

**Archivo:** `supabase/functions/api-minimarket/index.ts`

```typescript
// ⚠️ SIEMPRE importar de _shared/
import { respondOk, respondFail } from '../_shared/response.ts'
import { createLogger } from '../_shared/logger.ts'
import { checkRole, extractBearerToken } from './helpers/auth.ts'
import { parseJsonBody } from './helpers/validation.ts'
import { insertTable } from './helpers/supabase.ts'
import { logAudit } from './helpers/audit.ts'

const logger = createLogger('api-minimarket')

// Agregar al router existente
if (path === '/productos' && method === 'POST') {
  // 1. Verificar autenticación y roles
  checkRole(['admin', 'supervisor'])
  
  // 2. Parsear y validar body
  const body = await parseJsonBody<{ nombre: string, precio: number }>()
  if (body instanceof Response) return body // Error de parsing
  
  // 3. Validar campos requeridos
  if (!body.nombre || !body.precio) {
    return respondFail('VALIDATION_ERROR', 'nombre y precio requeridos', 400)
  }
  
  // 4. Insertar en BD
  const result = await insertTable(
    supabaseUrl!,
    'productos',
    body,
    requestHeaders()
  )
  
  if (!result.success) {
    logger.error('Error al insertar producto', { error: result.error })
    return respondFail('INSERT_ERROR', result.error, 500)
  }
  
  // 5. Log de auditoría
  await logAudit('PRODUCTO_CREATED', 'productos', result.data?.id, {
    nombre: body.nombre,
    precio: body.precio
  })
  
  // 6. Responder con éxito
  logger.info('Producto creado exitosamente', { id: result.data?.id })
  return respondOk(result.data, 201)
}
```

---

### Backend - Logging Estructurado

**❌ NUNCA hacer esto:**
```typescript
console.log('Usuario autenticado:', user.id)  // ❌ MAL
console.error('Error:', error)                 // ❌ MAL
```

**✅ SIEMPRE hacer esto:**
```typescript
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('mi-funcion')

logger.info('Usuario autenticado', { userId: user.id })
logger.error('Error al procesar', { error: error.message, userId: user.id })
logger.warn('Stock bajo', { productoId: id, cantidad: stock })
```

**Beneficios:**
- Logs estructurados en JSON
- Contexto automático (timestamp, requestId)
- Niveles de log (debug, info, warn, error)
- Fácil búsqueda y análisis

---

### Backend - Edge Function Template

**Archivo:** `supabase/functions/nueva-funcion/index.ts`

```typescript
import { createLogger } from '../_shared/logger.ts'
import { respondOk, respondFail } from '../_shared/response.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

const logger = createLogger('nueva-funcion')

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin)
    })
  }
  
  try {
    // 2. Verificar método
    if (req.method !== 'POST') {
      return respondFail('METHOD_NOT_ALLOWED', 'Solo POST permitido', 405)
    }
    
    // 3. Parsear body
    const body = await req.json()
    
    // 4. Lógica de negocio
    const result = await procesarAlgo(body)
    
    // 5. Responder
    logger.info('Procesamiento exitoso', { result })
    return respondOk(result, 200)
    
  } catch (error) {
    logger.error('Error en función', { error: error.message })
    return respondFail('INTERNAL_ERROR', error.message, 500)
  }
})
```

---

### Testing - Unit Test Pattern

**Archivo:** `tests/unit/mi-modulo.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { miModulo } from '../../supabase/functions/mi-funcion/modulo.ts'

describe('miModulo', () => {
  beforeEach(() => {
    // Setup si es necesario
  })
  
  it('debe procesar datos correctamente', () => {
    const input = { campo: 'valor' }
    const result = miModulo.procesar(input)
    
    expect(result).toBeDefined()
    expect(result.campo).toBe('VALOR')
  })
  
  it('debe manejar errores de validación', () => {
    const invalid = { campo: null }
    
    expect(() => miModulo.procesar(invalid))
      .toThrow('campo es requerido')
  })
})
```

---

## Comandos Frecuentes

### Frontend (minimarket-system/)

```bash
# Desarrollo
cd minimarket-system
pnpm install --frozen-lockfile
pnpm dev                    # http://localhost:5173

# Build
pnpm build                  # Build normal
pnpm build:prod             # Build producción

# Linting y Typing
pnpm lint                   # ESLint
npx tsc --noEmit           # Type check

# Testing
pnpm test:components        # Component tests
pnpm test:e2e:frontend      # E2E con Playwright (mocks)
```

### Tests (raíz del proyecto)

```bash
# Unit tests
npm ci                      # Install dependencies
npm run test:unit           # Run unit tests
npm run test:coverage       # Con coverage

# Suites específicas
npm run test:integration    # Integration (requiere DB local)
npm run test:e2e            # E2E (requiere credenciales)
npm run test:security       # Security tests
npm run test:performance    # Performance baseline
```

### Edge Functions

```bash
# Verificar sintaxis
deno check --no-lock supabase/functions/**/index.ts

# Desarrollo local (requiere Supabase CLI)
supabase start
supabase functions serve api-minimarket --env-file .env
```

### Git

```bash
# Workflow típico
git status
git add -A
git commit -m "feat: nueva funcionalidad"
git push origin main

# Antes de commit
pnpm lint                   # En minimarket-system/
npm run test:unit           # En raíz
```

---

## Guía para Agentes IA

### Principios Fundamentales

1. **SIEMPRE leer documentación existente primero**
   - `docs/ESTADO_ACTUAL.md` - Estado del proyecto (fuente de verdad)
   - `docs/HOJA_RUTA_MADRE_2026-01-31.md` - Plan vigente y checklist único
   - `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` - Evidencia RLS + Advisor
   - `docs/ARCHITECTURE_DOCUMENTATION.md` - Arquitectura
   - `docs/API_README.md` - Endpoints disponibles

2. **NUNCA crear archivos duplicados**
   - Verificar si ya existe antes de crear
   - Usar `grep`, `find`, o buscar en estructura

3. **SIEMPRE seguir patrones existentes**
   - Ver código similar antes de escribir nuevo código
   - Mantener consistencia con estilo del proyecto

4. **NUNCA usar console.log/console.error**
   - Usar `createLogger()` de `_shared/logger.ts`
   - Ver ejemplos en edge functions existentes

5. **Writes SIEMPRE via Gateway**
   - Frontend NO escribe directo a Supabase
   - Todas las mutaciones via `api-minimarket`

---

### Flujo de Trabajo Recomendado

#### Para Nuevas Features

1. **Entender el contexto**
   ```
   - Leer docs/ESTADO_ACTUAL.md
   - Revisar docs/HOJA_RUTA_MADRE_2026-01-31.md
   - Verificar docs/DECISION_LOG.md y docs/CHECKLIST_CIERRE.md
   ```

2. **Buscar código similar**
   ```bash
   # Ejemplo: buscar hooks similares
   grep -r "useQuery" minimarket-system/src/hooks/
   
   # Ejemplo: buscar endpoints similares
   grep -r "if (path ===" supabase/functions/api-minimarket/
   ```

3. **Escribir código siguiendo patrones**
   - Copiar estructura de archivos similares
   - Adaptar lógica manteniendo estilo
   - Usar helpers de `_shared/`

4. **Escribir tests**
   - Ver `tests/unit/` para ejemplos
   - Mantener >80% coverage

5. **Verificar build y tests**
   ```bash
   pnpm lint && pnpm build
   npm run test:unit
   ```

6. **Documentar decisiones importantes**
   - Actualizar `docs/DECISION_LOG.md` si aplica

> **Nota sobre skills:** si el entorno soporta skills, usarlas solo cuando la tarea lo requiera. Si no, seguir el plan y documentos base.

---

#### Para Bug Fixes

1. **Reproducir el bug**
   - Entender el escenario exacto
   - Verificar si hay tests que lo cubran

2. **Localizar el código**
   ```bash
   # Buscar por error message
   grep -r "ERROR_MESSAGE" .
   
   # Buscar por función
   grep -r "nombreFuncion" .
   ```

3. **Hacer fix mínimo**
   - Cambiar solo lo necesario
   - No refactorizar código no relacionado

4. **Agregar test de regresión**
   ```typescript
   it('should not fail when X happens', () => {
     // Test que reproduce el bug
     // Debe pasar después del fix
   })
   ```

5. **Verificar que no se rompe nada**
   ```bash
   npm run test:unit
   pnpm build
   ```

---

### Preguntas Frecuentes para IA

**Q: ¿Dónde pongo código compartido entre Edge Functions?**  
A: En `supabase/functions/_shared/`. Ver archivos existentes como ejemplo.

**Q: ¿Cómo agrego un nuevo endpoint al Gateway?**  
A: Editar `supabase/functions/api-minimarket/index.ts`, seguir patrón de endpoints existentes.

**Q: ¿Dónde están los tipos TypeScript de la BD?**  
A: `minimarket-system/src/types/database.ts` (generado por Supabase CLI).

**Q: ¿Cómo hago logging en Edge Functions?**  
A: `import { createLogger } from '../_shared/logger.ts'` y usar `logger.info()`, `logger.error()`, etc.

**Q: ¿Puedo usar console.log para debugging?**  
A: NO. Usa `logger.debug()` que puede deshabilitarse en producción.

**Q: ¿Dónde van los tests unitarios?**  
A: `tests/unit/`. Nombrar archivo como `mi-modulo.test.ts`.

**Q: ¿El frontend puede escribir directo a Supabase?**  
A: NO. Las escrituras DEBEN ir via Gateway (`api-minimarket`).

**Q: ¿Cómo sé qué está pendiente?**  
A: Ver `docs/ROADMAP.md` y `docs/CHECKLIST_CIERRE.md`.

**Q: ¿Hay alguna decisión técnica que deba conocer?**  
A: Revisar `docs/DECISION_LOG.md` antes de proponer cambios arquitectónicos.

---

## Advertencias Importantes

### ⚠️ Críticas (NO HACER)

1. **NO crear archivos duplicados**
   - Siempre buscar primero con `grep` o `find`
   - Si existe, editar el existente

2. **NO usar console.log/console.error**
   - Usar `createLogger()` de `_shared/logger.ts`
   - Único lugar donde está permitido: `_shared/logger.ts` internamente

3. **NO escribir directo a Supabase desde frontend**
   - Writes SIEMPRE via Gateway
   - Solo lecturas directas están permitidas (por ahora)

4. **NO exponer secretos**
   - Nunca hardcodear API keys, passwords, tokens
   - Usar variables de entorno

5. **NO modificar código sin tests**
   - Si cambias lógica, actualiza/agrega tests
   - Mantener coverage alto

---

### ⚠️ Importantes (TENER CUIDADO)

1. **Verificar build después de cambios**
   - `pnpm build` en frontend
   - `npm run test:unit` en raíz
   - `deno check` en edge functions

2. **Documentar decisiones técnicas**
   - Actualizar `docs/DECISION_LOG.md`
   - Explicar "por qué" no solo "qué"

3. **Seguir convenciones de nombres**
   - Componentes: PascalCase (`UserProfile.tsx`)
   - Funciones: camelCase (`fetchUserData`)
   - Constantes: UPPER_SNAKE_CASE (`MAX_RETRIES`)
   - Archivos: kebab-case (`user-profile.tsx`)

4. **Mantener modularidad**
   - Archivos <300 líneas (ideal)
   - Funciones <50 líneas (ideal)
   - Single Responsibility Principle

---

## Variables de Entorno

### Frontend (minimarket-system/)

```bash
# .env.local (NO commitear)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_GATEWAY_URL=/api-minimarket  # Opcional, default es este
```

### Edge Functions

```bash
# .env (NO commitear, usar Supabase Secrets)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
API_PROVEEDOR_SECRET=secret-here
SCRAPER_READ_MODE=false
API_PROVEEDOR_READ_MODE=false
```

### Tests

```bash
# .env.test (NO commitear)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
API_PROVEEDOR_SECRET=test-secret
```

**⚠️ NUNCA commitear archivos con secretos reales.**  
Ver `.env.example` y `.env.test.example` para templates.

---

## Testing

### Estrategia de Testing

| Tipo | Herramienta | Alcance | Cuándo Corre |
|------|-------------|---------|--------------|
| **Unit** | Vitest | Funciones puras, lógica | Siempre en CI |
| **Integration** | Vitest | Edge Functions + DB local | Gated en CI |
| **E2E Backend** | Vitest | API endpoints reales | Manual |
| **E2E Frontend** | Playwright | UI flows con mocks | Opcional en CI |
| **Security** | Vitest | Validación de seguridad | Siempre en CI |
| **Performance** | Vitest + k6 | Baselines y load | Manual |

### Ejecutar Tests

```bash
# Unit tests (siempre)
npm run test:unit

# Con coverage
npm run test:coverage

# Integration (requiere Supabase local)
npm run test:integration

# E2E (requiere credenciales)
npm run test:e2e

# Security
npm run test:security

# Todos (excepto gated)
npm test
```

### Escribir Tests

**Ubicación:** `tests/unit/nombre-descriptivo.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { miFuncion } from '../../supabase/functions/mi-funcion/modulo.ts'

describe('miFuncion', () => {
  it('debe retornar resultado esperado', () => {
    const result = miFuncion({ input: 'test' })
    expect(result).toEqual({ output: 'TEST' })
  })
  
  it('debe lanzar error si input inválido', () => {
    expect(() => miFuncion({ input: null }))
      .toThrow('input es requerido')
  })
})
```

---

## CI/CD

### Pipeline de GitHub Actions

**Archivo:** `.github/workflows/ci.yml`

#### Jobs Obligatorios (siempre corren)
1. **lint** - ESLint en frontend
2. **test** - Unit tests (646 tests)
3. **build** - Build de producción
4. **typecheck** - TypeScript check
5. **edge-functions-check** - Deno syntax check

#### Jobs Opcionales (gated)
1. **integration** - Integration tests (requiere secrets)
2. **e2e** - E2E tests (requiere secrets + manual trigger)
3. **e2e-frontend** - Playwright tests (con mocks)

### Workflow Típico

```
Push a main → CI starts
  ├─ lint ✅
  ├─ test ✅ (646 tests)
  ├─ build ✅
  ├─ typecheck ✅
  └─ edge-functions-check ✅

Manual dispatch con secrets:
  ├─ integration ✅ (31 tests)
  └─ e2e ✅ (4 tests)
```

### Configurar Secrets

En **GitHub Settings → Secrets and variables → Actions**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `API_PROVEEDOR_SECRET`

---

## Recursos Adicionales

### Documentación Técnica Esencial

1. **ESTADO_ACTUAL.md** - ⭐ Estado del proyecto, métricas, pendientes
2. **HOJA_RUTA_MADRE_2026-01-31.md** - Checklist único vigente (plan maestro)
3. **PROMPT_CONTEXT_NUEVA_VENTANA_IA.md** - Prompt base para nueva ventana IA
4. **ARCHITECTURE_DOCUMENTATION.md** - Arquitectura técnica completa
5. **API_README.md** - Todos los endpoints disponibles
6. **CHECKLIST_CIERRE.md** - Estado de tareas de cierre
7. **DECISION_LOG.md** - Decisiones técnicas registradas
8. **ROADMAP.md** - Plan rolling 90 días

### APIs y Esquemas

- **OpenAPI:** `docs/api-openapi-3.1.yaml`
- **OpenAPI Proveedor:** `docs/api-proveedor-openapi-3.1.yaml`
- **Postman Collection:** `docs/postman-collection.json`
- **DB Schema:** `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`

### Guides

- **Deployment:** `docs/DEPLOYMENT_GUIDE.md`
- **Operations:** `docs/OPERATIONS_RUNBOOK.md`
- **Security Audit:** `docs/SECURITY_AUDIT_REPORT.md`
- **RLS Audit:** `docs/AUDITORIA_RLS_CHECKLIST.md`

---

## Contacto y Soporte

### Owner del Repositorio
- **GitHub:** @eevans-d
- **Responsable de:** Code reviews, merges, decisiones arquitectónicas

### CODEOWNERS
Según `.github/CODEOWNERS`:
- Default: @eevans-d
- `/supabase/functions/`: @eevans-d
- `/minimarket-system/src/`: @eevans-d
- `/.github/`: @eevans-d

### Reportar Issues
https://github.com/eevans-d/aidrive_genspark/issues

---

## Changelog

- **1.0.0** (2026-01-23): Versión inicial basada en AGENTS.md y estado actual del proyecto

---

**Generado:** 2026-01-23  
**Próxima revisión:** Actualizar cuando cambien patrones fundamentales o estructura del proyecto

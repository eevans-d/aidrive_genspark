# 📋 PLAN DEFINITIVO - Pendientes Finales

**Fecha:** 2026-01-23  
**Estado:** ✅ COMPLETADO 2026-01-23  
**Responsable:** Agente IA  
**Proyecto:** minimarket-system (dqaygmjpzoqjjrywdsxi)

---

> **Nota:** este plan esta cerrado; la planificación modular vigente esta en `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`.

---

## 🎯 RESUMEN EJECUTIVO

Plan definitivo para completar 3 pendientes críticos en secuencia óptima:

| # | Tarea | Duración | Estado |
|---|-------|----------|--------|
| 1 | Auditoría RLS | 30 min | ✅ COMPLETADO |
| 2 | Usuarios de Prueba (Staging) | 45 min | ✅ COMPLETADO |
| 3 | E2E con Auth Real | 60 min | ✅ COMPLETADO |

**Tiempo total estimado:** 2h 15min

---

## 📌 DECISIONES CONFIRMADAS

1. **Runner E2E:** Supabase CLI (no Docker Compose)
   - Razón: Ya vinculado al proyecto real `dqaygmjpzoqjjrywdsxi`
   - Beneficio: Mayor fidelidad con producción

2. **Entorno usuarios:** Staging únicamente
   - Razón: Evitar riesgo operativo en producción
   - Usuarios solo para testing, nunca datos reales

3. **Orden ejecución:** RLS primero
   - Razón: Riesgo de exposición de datos sensibles si hay gaps

---

## 🔐 CREDENCIALES DISPONIBLES

```bash
SUPABASE_URL=https://dqaygmjpzoqjjrywdsxi.supabase.co
SUPABASE_ANON_KEY=<REDACTED>
SUPABASE_SERVICE_ROLE_KEY=<REDACTED>
```

---

## PASO 1: AUDITORÍA RLS ✅ COMPLETADO

> **Ejecutado:** 2026-01-23  
> **Resultado:** TODAS las tablas P0 tienen RLS activo

### Objetivo
Verificar que las tablas P0 tienen RLS habilitado y políticas correctas.

### Tablas P0 a Auditar
| Tabla | Riesgo sin RLS | Política Esperada |
|-------|----------------|-------------------|
| `productos` | Precios expuestos | SELECT authenticated |
| `stock_deposito` | Inventario expuesto | SELECT authenticated |
| `movimientos_deposito` | Historial operaciones | SELECT authenticated, INSERT authenticated |
| `precios_historicos` | Historial precios | SELECT authenticated |
| `proveedores` | Datos comerciales | SELECT authenticated |
| `personal` | Datos personales (GDPR) | SELECT authenticated con filtro user_id |
| `categorias` | Clasificación | SELECT authenticated |

### Prerequisitos
- [x] Credenciales Supabase disponibles
- [x] Script `scripts/rls_audit.sql` preparado (137 líneas, 7 secciones)
- [x] Acceso a Dashboard Supabase o psql

### Comandos a Ejecutar

```bash
# Opción A: Via Supabase Dashboard SQL Editor
# 1. Ir a https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi/sql
# 2. Pegar contenido de scripts/rls_audit.sql
# 3. Ejecutar y capturar output

# Opción B: Via psql (requiere DATABASE_URL)
# Obtener DATABASE_URL del Dashboard > Settings > Database > Connection string
psql "postgresql://postgres:[PASSWORD]@db.dqaygmjpzoqjjrywdsxi.supabase.co:5432/postgres" \
  -f scripts/rls_audit.sql > rls_audit_output.txt 2>&1
```

### Output Esperado
El script retorna 7 secciones:
1. **RLS STATUS:** Lista de tablas con ✅ ENABLED / ❌ DISABLED
2. **POLÍTICAS:** Detalle de cada política por tabla
3. **⚠️ TABLAS SIN RLS:** Lista de tablas expuestas (debe estar vacía para P0)
4. **⚠️ TABLAS BLOQUEADAS:** RLS activo pero sin políticas (solo service_role)
5. **FUNCIONES SECURITY DEFINER:** Funciones con permisos elevados
6. **PERMISOS POR ROL:** Grants para anon/authenticated/service_role
7. **VERIFICACIÓN P0:** Estado específico de tablas críticas

### Criterio de Éxito
- [x] Todas las tablas P0 tienen `rls_enabled = true`
- [x] Tablas de UI (`productos`, `stock_deposito`, etc.) tienen políticas para `authenticated`
- [x] Tablas internas (cron, scraping) tienen RLS sin políticas (service_role bypass)
- [x] No hay funciones SECURITY DEFINER sin `search_path` configurado

### Acción si hay Gaps
Si se detectan tablas P0 sin RLS o políticas faltantes:

```bash
# Crear migración correctiva
touch supabase/migrations/20260123_fix_rls_gaps.sql

# Aplicar con
supabase db push
```

### Documentación a Actualizar
- `docs/AUDITORIA_RLS_CHECKLIST.md` - Marcar ❓ como ✅ o ❌
- `docs/CHECKLIST_CIERRE.md` - Marcar WS7.1 como completado

---

## PASO 2: USUARIOS DE PRUEBA (45 min)

### Objetivo
Crear 3 usuarios de prueba en Supabase Auth vinculados a la tabla `personal`.

### Usuarios a Crear
| Email | Rol | Uso |
|-------|-----|-----|
| admin@staging.minimarket.test | admin | Acceso completo, gestión |
| deposito@staging.minimarket.test | deposito | Movimientos de inventario |
| ventas@staging.minimarket.test | ventas | Operaciones de venta |

### Esquema de tabla `personal` (Referencia)
```sql
-- Campos relevantes para vincular usuario
id              UUID PRIMARY KEY
user_auth_id    UUID REFERENCES auth.users(id) UNIQUE
nombre_completo VARCHAR(255)
rol             VARCHAR(50)  -- 'admin', 'deposito', 'ventas'
activo          BOOLEAN DEFAULT true
```

### Script de Seed a Crear

```sql
-- Archivo: supabase/seed/test-users.sql
-- Ejecutar en SQL Editor del Dashboard

-- ============================================================================
-- USUARIOS DE PRUEBA PARA STAGING
-- Contraseña para todos: <definido_en_env_test>
-- ============================================================================

-- 1. Crear usuarios en auth.users (Supabase Auth)
-- NOTA: Esto se hace desde el Dashboard > Authentication > Users > Add User
-- O via API Admin

-- 2. Una vez creados los auth users, vincular a personal:

-- Usuario Admin
INSERT INTO personal (id, user_auth_id, nombre_completo, dni, telefono, email, rol, fecha_ingreso, activo)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'admin@staging.minimarket.test'),
  'Admin Staging',
  '00000001',
  '+54 11 0000 0001',
  'admin@staging.minimarket.test',
  'admin',
  CURRENT_DATE,
  true
);

-- Usuario Deposito
INSERT INTO personal (id, user_auth_id, nombre_completo, dni, telefono, email, rol, fecha_ingreso, activo)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'deposito@staging.minimarket.test'),
  'Deposito Staging',
  '00000002',
  '+54 11 0000 0002',
  'deposito@staging.minimarket.test',
  'deposito',
  CURRENT_DATE,
  true
);

-- Usuario Ventas
INSERT INTO personal (id, user_auth_id, nombre_completo, dni, telefono, email, rol, fecha_ingreso, activo)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'ventas@staging.minimarket.test'),
  'Ventas Staging',
  '00000003',
  '+54 11 0000 0003',
  'ventas@staging.minimarket.test',
  'ventas',
  CURRENT_DATE,
  true
);
```

### Pasos de Ejecución

1. **Crear usuarios en Auth (Dashboard)**
   ```
   URL: https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi/auth/users
   Acción: Add User → Create New User
   - Email: admin@staging.minimarket.test
  - Password: <definido_en_env_test>
   - (Repetir para deposito@ y ventas@)
   ```

2. **Ejecutar seed SQL**
   ```
   URL: https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi/sql
   Acción: Pegar script y ejecutar
   ```

3. **Verificar vinculación**
   ```sql
   SELECT p.nombre_completo, p.rol, p.email, u.email as auth_email
   FROM personal p
JOIN auth.users u ON p.user_auth_id = u.id
   WHERE p.email LIKE '%staging%';
   ```

### Criterio de Éxito
- [x] 3 usuarios creados en Supabase Auth
- [x] 3 registros en tabla `personal` con `user_auth_id` correcto
- [x] Login validado en frontend (E2E auth real)
- [x] Rol visible correctamente en sesión

### Documentación a Actualizar
- `docs/E2E_SETUP.md` - Agregar sección de credenciales de prueba
- `docs/CHECKLIST_CIERRE.md` - Marcar "Crear usuarios de prueba"

---

## PASO 3: E2E CON AUTH REAL (60 min)

### Objetivo
Migrar tests E2E de mocks a autenticación real con los usuarios creados.

### Estado Actual
- Frontend E2E: Playwright con `VITE_USE_MOCKS=true` (8 tests)
- Backend E2E: Vitest con Supabase CLI (4 tests)
- Archivo: `minimarket-system/playwright.config.ts`

### Cambios Requeridos

#### 3.1 Crear archivo .env.test

```bash
# Archivo: .env.test (raíz del proyecto)
SUPABASE_URL=https://dqaygmjpzoqjjrywdsxi.supabase.co
SUPABASE_ANON_KEY=<REDACTED>
SUPABASE_SERVICE_ROLE_KEY=<REDACTED>

# Usuarios de prueba
TEST_USER_ADMIN=admin@staging.minimarket.test
TEST_USER_DEPOSITO=deposito@staging.minimarket.test
TEST_USER_VENTAS=ventas@staging.minimarket.test
TEST_PASSWORD=<definido_en_env_test>
```

#### 3.2 Modificar playwright.config.ts

```typescript
// minimarket-system/playwright.config.ts
import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Cargar .env.test desde raíz
dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'pnpm dev -- --host',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    env: {
      // Usar Supabase real, no mocks
      VITE_SUPABASE_URL: process.env.SUPABASE_URL!,
      VITE_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!
    }
  }
})
```

#### 3.3 Crear helper de login

```typescript
// minimarket-system/e2e/helpers/auth.ts
import { Page } from '@playwright/test'

export async function loginAs(page: Page, role: 'admin' | 'deposito' | 'ventas') {
  const emails = {
    admin: process.env.TEST_USER_ADMIN,
    deposito: process.env.TEST_USER_DEPOSITO,
    ventas: process.env.TEST_USER_VENTAS
  }
  
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(emails[role]!)
  await page.getByPlaceholder('Contraseña').fill(process.env.TEST_PASSWORD!)
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  
  // Esperar redirección a dashboard
  await page.waitForURL('/')
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /cerrar sesión|logout/i }).click()
  await page.waitForURL('/login')
}
```

#### 3.4 Actualizar tests E2E

```typescript
// minimarket-system/e2e/app.smoke.spec.ts (modificado)
import { expect, test } from '@playwright/test'
import { loginAs } from './helpers/auth'

test.describe('Dashboard con auth real', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
  })

  test('dashboard carga con datos reales', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Total Productos')).toBeVisible()
  })
})

test.describe('Stock con rol deposito', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'deposito')
  })

  test('deposito puede ver stock', async ({ page }) => {
    await page.goto('/stock')
    await expect(page.getByRole('heading', { name: 'Control de Stock' })).toBeVisible()
  })
})
```

### Comandos de Ejecución

```bash
# Desde minimarket-system/
cd minimarket-system

# Instalar dotenv si no existe
pnpm add -D dotenv

# Ejecutar E2E con auth real
VITE_USE_MOCKS=false pnpm exec playwright test auth.real

# O con UI para debug
VITE_USE_MOCKS=false pnpm exec playwright test --ui
```

### Criterio de Éxito
- [x] `VITE_USE_MOCKS` controla el modo (mocks por defecto; real con `VITE_USE_MOCKS=false`)
- [x] Helper de login creado y funcional
- [x] Tests de auth real pasan
- [x] Cada rol puede acceder a sus rutas permitidas
- [x] Tests fallan correctamente si credenciales incorrectas

### Documentación a Actualizar
- `docs/E2E_SETUP.md` - Actualizar con nuevo flujo
- `minimarket-system/e2e/README.md` - Crear si no existe

---

## 📊 CHECKLIST DE EJECUCIÓN

### Pre-ejecución
- [x] Credenciales Supabase disponibles
- [x] Proyecto vinculado (dqaygmjpzoqjjrywdsxi)
- [x] Edge Functions desplegadas
- [x] Migraciones aplicadas

### Paso 1: RLS
- [x] Validación RLS via REST (anon key) o `scripts/rls_audit.sql`
- [x] Evidencia documentada en `docs/AUDITORIA_RLS_CHECKLIST.md`
- [x] Analizar gaps en tablas P0
- [x] Sin gaps detectados (no se requiere migración)
- [x] Actualizar `docs/AUDITORIA_RLS_CHECKLIST.md`
- [x] Marcar WS7.1 en CHECKLIST_CIERRE.md

### Paso 2: Usuarios
- [x] Crear 3 usuarios en Supabase Auth Dashboard
- [x] Ejecutar seed SQL para tabla `personal`
- [x] Verificar vinculación user_auth_id
- [x] Login validado via E2E auth real
- [x] Documentar en E2E_SETUP.md

### Paso 3: E2E Real
- [x] Crear `.env.test` con credenciales
- [x] Modificar `playwright.config.ts`
- [x] Crear `e2e/helpers/auth.ts`
- [x] Actualizar tests de smoke
- [x] Ejecutar suite de auth real
- [x] Documentar resultados

### Post-ejecución
- [ ] Commit todos los cambios
- [ ] Push a main
- [x] Actualizar ESTADO_ACTUAL.md
- [x] Actualizar CHECKLIST_CIERRE.md (todos los items)

---

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| RLS gaps en tablas P0 | Media | Alto | Migración correctiva inmediata |
| Fallo creación usuarios | Baja | Medio | Usar Dashboard UI en vez de API |
| Tests E2E inestables | Media | Bajo | Aumentar timeouts, agregar retries |
| Credenciales incorrectas | Baja | Alto | Verificar en docs/OBTENER_SECRETOS.md |

---

## 📁 ARCHIVOS A CREAR/MODIFICAR

### Crear
- `supabase/seed/test-users.sql`
- `.env.test`
- `minimarket-system/e2e/helpers/auth.ts`

### Modificar
- `docs/AUDITORIA_RLS_CHECKLIST.md` - Marcar resultados
- `docs/E2E_SETUP.md` - Nuevo flujo con auth real
- `docs/CHECKLIST_CIERRE.md` - Marcar completados
- `docs/ESTADO_ACTUAL.md` - Actualizar estado
- `minimarket-system/playwright.config.ts` - Quitar mocks
- `minimarket-system/e2e/app.smoke.spec.ts` - Agregar login

---

**Última actualización:** 2026-01-23 05:00 UTC-3  
**Aprobado por:** Usuario (confirmado)

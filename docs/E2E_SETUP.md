# Setup E2E Testing

**Última actualización:** 2026-01-23  
**Estado:** ✅ Configurado para auth real  
**Plan detallado:** ver `docs/PLAN_PENDIENTES_DEFINITIVO.md`

---

## Runner Oficial: Supabase CLI

> **Decisión confirmada:** Usamos Supabase CLI en lugar de Docker Compose para mayor fidelidad con producción.

## Credenciales de Staging

```bash
# Archivo: .env.test (raíz del proyecto)
SUPABASE_URL=https://dqaygmjpzoqjjrywdsxi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxYXlnbWpwem9xampyeXdkc3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzE2MzcsImV4cCI6MjA4NDcwNzYzN30.Ddbr5RoVks5CTQYVRq1zIRNkondxyTD1UH_JceOG1Wg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxYXlnbWpwem9xampyeXdkc3hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEzMTYzNywiZXhwIjoyMDg0NzA3NjM3fQ.03JkWLjzw40kaJUW3cBLWPrjNrfzuyymWOyekV26qck

# Usuarios de prueba (crear según PLAN_PENDIENTES_DEFINITIVO.md)
TEST_USER_ADMIN=admin@staging.minimarket.test
TEST_USER_DEPOSITO=deposito@staging.minimarket.test
TEST_USER_VENTAS=ventas@staging.minimarket.test
TEST_PASSWORD=Staging2026!
```

## Usuarios de Prueba

| Email | Rol | Contraseña |
|-------|-----|------------|
| admin@staging.minimarket.test | admin | Staging2026! |
| deposito@staging.minimarket.test | deposito | Staging2026! |
| ventas@staging.minimarket.test | ventas | Staging2026! |

> **IMPORTANTE:** Crear usuarios en Dashboard > Authentication > Users antes de ejecutar tests.

---

## Ejecutar Tests E2E

### Backend (API)
```bash
# Desde raíz del proyecto
./scripts/run-e2e-tests.sh
```

### Frontend (UI con Playwright)
```bash
# Desde minimarket-system/
cd minimarket-system

# Con mocks (por defecto)
pnpm exec playwright test

# Con auth real (contra Supabase staging)
VITE_USE_MOCKS=false pnpm exec playwright test auth.real

# Con UI para debug
pnpm exec playwright test --ui

# Solo tests de auth real
VITE_USE_MOCKS=false pnpm exec playwright test e2e/auth.real.spec.ts
```

### Archivos de Test

| Archivo | Descripción | Auth |
|---------|-------------|------|
| `e2e/app.smoke.spec.ts` | Tests smoke con mocks | Mock |
| `e2e/auth.real.spec.ts` | Tests de autenticación real | Supabase |

---

## Setup Alternativo: Docker (Legacy)

> Solo para desarrollo local aislado. No recomendado para tests de integración.

### Requisitos
- Docker y Docker Compose instalados
- Puerto 54322 disponible (PostgreSQL)

### Instrucciones

```bash
# 1. Iniciar DB Local
docker-compose -f docker-compose.e2e.yml up -d

# 2. Verificar que DB está corriendo
docker ps | grep minimarket-db

# 3. Ejecutar tests E2E
npx vitest run --config vitest.e2e.config.ts

# 4. Parar DB
docker-compose -f docker-compose.e2e.yml down
```

## Notas
- Las migraciones se aplican automáticamente desde `supabase/migrations/`
- Los tests E2E backend están en `tests/e2e/`
- Los tests E2E frontend están en `minimarket-system/e2e/`
- El config usa Supabase real en staging (no mocks)

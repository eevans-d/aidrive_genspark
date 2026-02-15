> [DEPRECADO: 2026-02-13] Documento historico. No usar como fuente primaria. Fuente vigente: `docs/ESTADO_ACTUAL.md`, `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md`, `docs/closure/OPEN_ISSUES.md`.

# Setup E2E Testing

**Última actualización:** 2026-02-01  
**Estado:** ✅ Revalidado (última ejecución 2026-01-27: 7/7 PASS, 22.7s; spec actual 10 tests, 2 skip)  
**Plan detallado:** ver `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md` (histórico: `docs/HOJA_RUTA_MADRE_2026-01-31.md`)

---

## Runner Oficial: Supabase CLI

> **Decisión confirmada:** Usamos Supabase CLI en lugar de Docker Compose para mayor fidelidad con producción.

## Credenciales de Staging

```bash
# Archivo: .env.test (raíz del proyecto)
SUPABASE_URL=https://dqaygmjpzoqjjrywdsxi.supabase.co
SUPABASE_ANON_KEY=<REDACTED>
SUPABASE_SERVICE_ROLE_KEY=<REDACTED>

# Usuarios de prueba (ver `docs/ESTADO_ACTUAL.md` + `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`)
TEST_USER_ADMIN=admin@staging.minimarket.test
TEST_USER_DEPOSITO=deposito@staging.minimarket.test
TEST_USER_VENTAS=ventas@staging.minimarket.test
TEST_PASSWORD=<definido_en_env_test>
```

## Usuarios de Prueba

| Email | Rol | Contraseña |
|-------|-----|------------|
| admin@staging.minimarket.test | admin | <definido_en_env_test> |
| deposito@staging.minimarket.test | deposito | <definido_en_env_test> |
| ventas@staging.minimarket.test | ventas | <definido_en_env_test> |

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

> Nota: El runner inicia su propio servidor con el modo indicado por `VITE_USE_MOCKS`. Evitar reutilizar un servidor previo con otro modo para no mezclar mocks con Supabase real.

### Archivos de Test

| Archivo | Descripción | Auth |
|---------|-------------|------|
| `e2e/app.smoke.spec.ts` | Tests smoke con mocks | Mock |
| `e2e/auth.real.spec.ts` | Tests de autenticación real | Supabase |

> `app.smoke` omite (skip) pruebas de depósito que dependen del gateway real. Para habilitarlas: `E2E_GATEWAY=true pnpm exec playwright test app.smoke`.

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

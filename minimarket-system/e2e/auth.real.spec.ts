/**
 * E2E Tests con autenticación real contra Supabase staging
 *
 * REQUISITO: Los usuarios de prueba deben existir en Supabase Auth:
 * - admin@staging.minimarket.test (rol: admin)
 * - deposito@staging.minimarket.test (rol: deposito)
 * - ventas@staging.minimarket.test (rol: ventas)
 *
 * Password para todos: Staging2026!
 *
 * Para ejecutar solo estos tests:
 *   VITE_USE_MOCKS=false pnpm exec playwright test auth.real
 */
import { expect, test } from '@playwright/test'
import { loginAs, logout, expectRole } from './helpers/auth'

// Saltar si estamos en modo mocks
const isRealAuth = process.env.VITE_USE_MOCKS !== 'true' && !!process.env.SUPABASE_URL
test.skip(!isRealAuth, 'Skipping - requires real Supabase auth (set VITE_USE_MOCKS=false)')

test.describe('Autenticación Real - Supabase', () => {
  test.describe.configure({ mode: 'serial' })

  test('login con admin y acceso a dashboard', async ({ page }) => {
    await loginAs(page, 'admin')

    // Verificar acceso a dashboard
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
      timeout: 10000
    })

    // Verificar que muestra datos reales (no mocks)
    await expect(page.getByText('Total Productos')).toBeVisible()

    await logout(page)
  })

  test('login con deposito y acceso limitado', async ({ page }) => {
    await loginAs(page, 'deposito')

    // Verificar acceso a gestión de depósito
    await page.goto('/deposito')
    await expect(page.getByRole('heading', { name: 'Gestión de Depósito' })).toBeVisible({
      timeout: 10000
    })

    await logout(page)
  })

  test('login con ventas y acceso a productos', async ({ page }) => {
    await loginAs(page, 'ventas')

    // Verificar acceso a productos
    await page.goto('/productos')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Gestión de Productos y Precios' })
    ).toBeVisible({ timeout: 10000 })

    await logout(page)
  })

  test('usuario no autenticado redirige a login', async ({ page }) => {
    // Sin login, ir directo a dashboard debería redirigir
    await page.goto('/')

    // Debería ver login o ser redirigido
    await expect(
      page.getByRole('button', { name: /iniciar sesión|login/i }).or(
        page.getByRole('heading', { name: /iniciar sesión|login/i })
      )
    ).toBeVisible({ timeout: 10000 })
  })

  test('credenciales inválidas muestra error', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email|correo/i).fill('invalid@test.com')
    await page.getByLabel(/password|contraseña/i).fill('wrongpassword')
    await page.getByRole('button', { name: /iniciar sesión|login/i }).click()

    // Debe mostrar mensaje de error
    await expect(
      page.getByText(/error|invalid|inválido|incorrecto/i)
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Permisos por Rol - RLS', () => {
  test.skip(!isRealAuth, 'Skipping - requires real Supabase auth')

  test('admin puede ver todos los productos', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/productos')

    // Admin debería ver la tabla de productos
    await expect(page.locator('table tbody tr').first()).toBeVisible({
      timeout: 10000
    })

    // Verificar que hay productos (al menos uno)
    const rowCount = await page.locator('table tbody tr').count()
    expect(rowCount).toBeGreaterThan(0)

    await logout(page)
  })

  test('deposito puede registrar movimientos', async ({ page }) => {
    await loginAs(page, 'deposito')
    await page.goto('/deposito')

    // Deposito debería poder ver el formulario de movimientos
    await expect(
      page.getByPlaceholder(/producto|código/i)
    ).toBeVisible({ timeout: 10000 })

    await logout(page)
  })
})

/**
 * Helper de autenticación para tests E2E
 * Proyecto: Mini Market System
 * Fecha: 2026-01-23
 */

import { Page, expect } from '@playwright/test'

type UserRole = 'admin' | 'deposito' | 'ventas'

const TEST_USERS: Record<UserRole, string> = {
  admin: process.env.TEST_USER_ADMIN || 'admin@staging.minimarket.test',
  deposito: process.env.TEST_USER_DEPOSITO || 'deposito@staging.minimarket.test',
  ventas: process.env.TEST_USER_VENTAS || 'ventas@staging.minimarket.test',
}

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Staging2026!'

/**
 * Realiza login con un usuario de prueba
 */
export async function loginAs(page: Page, role: UserRole): Promise<void> {
  const email = TEST_USERS[role]

  // Ir a la página de login
  await page.goto('/login')

  // Esperar que el formulario esté visible (buscar el título de la app)
  await expect(
    page.getByRole('heading', { name: 'Mini Market System' })
  ).toBeVisible({ timeout: 10000 })

  // Llenar credenciales usando los labels exactos
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(TEST_PASSWORD)

  // Click en botón de login
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click()

  // Esperar redirección al dashboard
  await page.waitForURL('/', { timeout: 15000 })

  // Verificar que estamos logueados
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 5000 })
}

/**
 * Realiza logout
 */
export async function logout(page: Page): Promise<void> {
  // Buscar botón de logout (puede estar en menú o header)
  const logoutButton = page.getByRole('button', { name: /cerrar sesión|logout|salir/i })

  if (await logoutButton.isVisible()) {
    await logoutButton.click()
  } else {
    // Intentar abrir menú de usuario primero
    const userMenu = page.getByRole('button', { name: /usuario|perfil|menu/i })
    if (await userMenu.isVisible()) {
      await userMenu.click()
      await page.getByRole('menuitem', { name: /cerrar sesión|logout/i }).click()
    }
  }

  // Esperar redirección a login
  await page.waitForURL('/login', { timeout: 5000 })
}

/**
 * Verifica que el usuario tiene el rol esperado
 */
export async function expectRole(page: Page, expectedRole: UserRole): Promise<void> {
  // Esto depende de cómo se muestra el rol en la UI
  // Puede ser en el header, sidebar, o perfil
  const roleIndicator = page.getByText(new RegExp(expectedRole, 'i'))
  await expect(roleIndicator).toBeVisible()
}

/**
 * Helper para tests que requieren autenticación previa
 */
export function withAuth(role: UserRole) {
  return async ({ page }: { page: Page }, use: () => Promise<void>) => {
    await loginAs(page, role)
    await use()
    // Opcional: logout después del test
    // await logout(page)
  }
}

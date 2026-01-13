import { expect, test } from '@playwright/test'

const nuevaTarea = () => `Tarea E2E ${Date.now()}`

test('tareas permite crear y completar una tarea con mocks', async ({ page }) => {
  const titulo = nuevaTarea()

  await page.goto('/tareas')
  await expect(page.getByRole('heading', { name: 'Gestión de Tareas' })).toBeVisible()

  await page.getByRole('button', { name: 'Nueva Tarea' }).click()
  await page.getByLabel('Título').fill(titulo)
  await page.getByLabel('Descripción').fill('Generada automáticamente en E2E')
  await page.getByLabel('Asignada a').fill('Operador QA')
  await page.getByLabel('Prioridad').selectOption('urgente')
  await page.getByRole('button', { name: 'Crear Tarea' }).click()

  const tareaCard = page.locator('div').filter({ has: page.getByRole('heading', { name: titulo }) }).first()
  await expect(tareaCard).toBeVisible()

  await tareaCard.getByTitle('Completar').first().click()

  await expect(page.getByRole('heading', { name: /Tareas Completadas/ })).toBeVisible()
  await expect(page.locator('div').filter({ hasText: titulo }).first()).toBeVisible()
})

test('proveedores muestra listado y detalle con datos mock', async ({ page }) => {
  await page.goto('/proveedores')

  await expect(page.getByRole('heading', { name: 'Gestión de Proveedores' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Proveedores' })).toBeVisible()
  await expect(page.getByText('Distribuidora Norte')).toBeVisible()

  await page.getByText('Mayorista Centro').click()

  const detalleProveedor = page
    .getByRole('heading', { name: 'Detalle del Proveedor' })
    .locator('..')
    .locator('..')

  await expect(detalleProveedor.getByRole('heading', { name: 'Mayorista Centro' })).toBeVisible()
  await expect(detalleProveedor.getByText('ventas@mayoristacentro.com')).toBeVisible()
  await expect(detalleProveedor.getByText('011-4444-2000')).toBeVisible()
  const categorias = detalleProveedor.getByRole('heading', { name: 'Categorías que Ofrece' }).locator('..')
  await expect(categorias).toBeVisible()
  await expect(categorias.getByText('Limpieza').first()).toBeVisible()
  await expect(categorias.getByText('Perfumeria').first()).toBeVisible()
  await expect(detalleProveedor.getByRole('heading', { name: /Productos \(/ })).toBeVisible()
})

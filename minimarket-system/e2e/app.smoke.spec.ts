import { expect, test } from '@playwright/test'

test('dashboard carga con mocks', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('Total Productos')).toBeVisible()
})

test('productos muestra detalle al seleccionar', async ({ page }) => {
  await page.goto('/productos')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Gestión de Productos y Precios' })
  ).toBeVisible()

  await page.getByText('Arroz 1kg').click()
  await expect(page.getByText('Precio Actual')).toBeVisible()
  await expect(page.getByText('Precio Costo')).toBeVisible()
})

test('stock muestra filtros y datos base', async ({ page }) => {
  await page.goto('/stock')
  await expect(page.getByRole('heading', { name: 'Control de Stock' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Todos/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Stock Bajo/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Crítico/ })).toBeVisible()
  await expect(page.getByText('Arroz 1kg')).toBeVisible()
})

test('stock filtra y actualiza conteos', async ({ page }) => {
  await page.goto('/stock')
  await expect(page.getByRole('heading', { name: 'Control de Stock' })).toBeVisible()

  const rows = page.locator('tbody tr')

  const getCountFromButton = async (label: RegExp) => {
    const text = await page.getByRole('button', { name: label }).textContent()
    const match = text?.match(/\((\d+)\)/)
    if (!match) {
      throw new Error(`No se encontro conteo en el boton ${label}`)
    }
    return Number(match[1])
  }

  const todosCount = await getCountFromButton(/Todos/)
  await expect(rows).toHaveCount(todosCount)
  await expect(page.getByText('Arroz 1kg')).toBeVisible()

  const bajoCount = await getCountFromButton(/Stock Bajo/)
  await page.getByRole('button', { name: /Stock Bajo/ }).click()
  await expect(rows).toHaveCount(bajoCount)
  await expect(page.getByText('Aceite 900ml')).toBeVisible()
  await expect(page.locator('tbody tr', { hasText: 'Arroz 1kg' })).toHaveCount(0)

  const criticoCount = await getCountFromButton(/Crítico/)
  await page.getByRole('button', { name: /Crítico/ }).click()
  await expect(rows).toHaveCount(criticoCount)
  await expect(page.getByText('Yerba 1kg')).toBeVisible()
  await expect(page.locator('tbody tr', { hasText: 'Aceite 900ml' })).toHaveCount(0)
})

test('deposito registra movimiento de entrada', async ({ page }) => {
  await page.goto('/deposito')
  await expect(page.getByRole('heading', { name: 'Gestión de Depósito' })).toBeVisible()

  await page
    .getByPlaceholder('Escriba el nombre o código del producto...')
    .fill('Arroz')
  await expect(page.getByRole('button', { name: 'Arroz 1kg' })).toBeVisible()
  await page.getByRole('button', { name: 'Arroz 1kg' }).click()

  await page.getByPlaceholder('Ingrese la cantidad').fill('2')
  await page.getByRole('button', { name: 'REGISTRAR MOVIMIENTO' }).click()

  await expect(page.getByText('Movimiento registrado correctamente')).toBeVisible()
})

test('deposito valida stock insuficiente en salida', async ({ page }) => {
  await page.goto('/deposito')
  await expect(page.getByRole('heading', { name: 'Gestión de Depósito' })).toBeVisible()

  await page.getByRole('button', { name: 'SALIDA' }).click()

  await page
    .getByPlaceholder('Escriba el nombre o código del producto...')
    .fill('Yerba')
  await expect(page.getByRole('button', { name: 'Yerba 1kg' })).toBeVisible()
  await page.getByRole('button', { name: 'Yerba 1kg' }).click()

  await page.getByPlaceholder('Ingrese la cantidad').fill('1')
  await page.getByRole('button', { name: 'REGISTRAR MOVIMIENTO' }).click()

  await expect(page.getByText('Stock insuficiente para registrar la salida')).toBeVisible()
})

import { expect, test } from '@playwright/test'

/**
 * POS E2E Test - Gate 3
 *
 * Full POS flow: login → load products → add items to cart → select payment →
 * submit sale → verify success toast and cart reset.
 *
 * Uses Playwright route interception to mock gateway API responses so the test
 * is reproducible without a live backend.
 */

// Seed dataset: deterministic products for POS testing
const SEED_PRODUCTS = [
  {
    id: 'pos-prod-1',
    nombre: 'Arroz 1kg',
    sku: 'ARR-001',
    codigo_barras: '779000000001',
    precio_actual: 1200,
  },
  {
    id: 'pos-prod-2',
    nombre: 'Aceite 900ml',
    sku: 'ACE-001',
    codigo_barras: '779000000002',
    precio_actual: 2200,
  },
  {
    id: 'pos-prod-3',
    nombre: 'Leche Entera 1L',
    sku: 'LEC-001',
    codigo_barras: '779000000003',
    precio_actual: 1300,
  },
]

function setupGatewayMocks(page: import('@playwright/test').Page) {
  // Mock products dropdown endpoint
  page.route('**/api-minimarket/productos/dropdown**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: SEED_PRODUCTS,
      }),
    })
  })

  // Mock search endpoint (for barcode/sku scan)
  page.route('**/api-minimarket/search**', async (route) => {
    const url = new URL(route.request().url())
    const q = url.searchParams.get('q') || ''
    const matches = SEED_PRODUCTS.filter(
      (p) =>
        p.codigo_barras === q ||
        p.sku === q ||
        p.id === q ||
        p.nombre.toLowerCase().includes(q.toLowerCase()),
    )
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { productos: matches },
      }),
    })
  })

  // Mock ventas endpoint (POST sale)
  page.route('**/api-minimarket/ventas', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      const total = body.items.reduce(
        (acc: number, it: { producto_id: string; cantidad: number }) => {
          const prod = SEED_PRODUCTS.find((p) => p.id === it.producto_id)
          return acc + (prod?.precio_actual ?? 0) * it.cantidad
        },
        0,
      )

      const response = {
        id: `venta-e2e-${Date.now()}`,
        idempotency_key: '00000000-0000-0000-0000-000000000001',
        metodo_pago: body.metodo_pago,
        cliente_id: null,
        monto_total: Math.round(total * 100) / 100,
        created_at: new Date().toISOString(),
        status: 'created',
        items: body.items.map(
          (
            it: { producto_id: string; cantidad: number },
            idx: number,
          ) => {
            const prod = SEED_PRODUCTS.find((p) => p.id === it.producto_id)
            return {
              id: `item-${idx + 1}`,
              producto_id: it.producto_id,
              producto_nombre: prod?.nombre ?? 'Unknown',
              producto_sku: prod?.sku ?? null,
              cantidad: it.cantidad,
              precio_unitario: prod?.precio_actual ?? 0,
              subtotal: (prod?.precio_actual ?? 0) * it.cantidad,
            }
          },
        ),
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: response }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock clientes endpoint
  page.route('**/api-minimarket/clientes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    })
  })
}

test.describe('POS E2E - Flujo completo de venta', () => {
  test.beforeEach(async ({ page }) => {
    setupGatewayMocks(page)
  })

  test('carga pagina POS con productos', async ({ page }) => {
    await page.goto('/pos')
    // Verify POS header is visible
    await expect(page.getByText('POS')).toBeVisible()
    // Verify scan input is present
    await expect(
      page.getByPlaceholder(/escanear|escribir código/i),
    ).toBeVisible()
    // Verify payment buttons are visible
    await expect(page.getByRole('button', { name: /efectivo/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /tarjeta/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /fiado/i })).toBeVisible()
    // Verify empty cart message
    await expect(page.getByText(/escanea un producto/i)).toBeVisible()
  })

  test('agregar producto por codigo de barras y verificar total', async ({
    page,
  }) => {
    await page.goto('/pos')
    await expect(
      page.getByPlaceholder(/escanear|escribir código/i),
    ).toBeVisible()

    const input = page.getByPlaceholder(/escanear|escribir código/i)

    // Scan first product by barcode
    await input.fill('779000000001')
    await input.press('Enter')

    // Wait for product to appear in cart
    await expect(page.getByText('Arroz 1kg')).toBeVisible({ timeout: 5000 })

    // Add second product
    await input.fill('779000000002')
    await input.press('Enter')

    // Wait for second product
    await expect(page.getByText('Aceite 900ml')).toBeVisible({ timeout: 5000 })

    // Verify total (1200 + 2200 = 3400) - use the total display (text-3xl)
    const totalDisplay = page.locator('.text-3xl')
    await expect(totalDisplay).toContainText('3.400')
  })

  test('flujo completo: agregar items, cobrar, verificar venta exitosa', async ({
    page,
  }) => {
    await page.goto('/pos')
    await expect(
      page.getByPlaceholder(/escanear|escribir código/i),
    ).toBeVisible()

    const input = page.getByPlaceholder(/escanear|escribir código/i)

    // Step 1: Add Arroz 1kg (barcode scan)
    await input.fill('779000000001')
    await input.press('Enter')
    await expect(page.getByText('Arroz 1kg')).toBeVisible({ timeout: 5000 })

    // Step 2: Add Aceite 900ml (barcode scan)
    await input.fill('779000000002')
    await input.press('Enter')
    await expect(page.getByText('Aceite 900ml')).toBeVisible({ timeout: 5000 })

    // Step 3: Verify both items are in cart
    await expect(page.getByText('Arroz 1kg')).toBeVisible()
    await expect(page.getByText('Aceite 900ml')).toBeVisible()

    // Step 4: Verify total
    const totalDisplay = page.locator('.text-3xl')
    await expect(totalDisplay).toContainText('3.400')

    // Step 5: Payment method is "efectivo" by default
    const efectivoButton = page.getByRole('button', { name: /efectivo/i })
    await expect(efectivoButton).toBeVisible()

    // Step 6: Click "Cobrar"
    const cobrarButton = page.getByRole('button', { name: /cobrar/i })
    await expect(cobrarButton).toBeEnabled()
    await cobrarButton.click()

    // Step 7: Verify success toast - matches "Venta registrada: $X"
    await expect(
      page.getByText(/venta/i).filter({ hasText: /registrada|idempotente/i }),
    ).toBeVisible({ timeout: 5000 })

    // Step 8: Verify cart is reset after successful sale
    await expect(page.getByText(/escanea un producto/i)).toBeVisible({
      timeout: 5000,
    })
  })

  test('incrementar cantidad de producto existente en carrito', async ({
    page,
  }) => {
    await page.goto('/pos')
    await expect(
      page.getByPlaceholder(/escanear|escribir código/i),
    ).toBeVisible()

    const input = page.getByPlaceholder(/escanear|escribir código/i)

    // Add same product twice
    await input.fill('779000000001')
    await input.press('Enter')
    await expect(page.getByText('Arroz 1kg')).toBeVisible({ timeout: 5000 })

    await input.fill('779000000001')
    await input.press('Enter')

    // Verify quantity is 2
    await expect(page.locator('.w-10.text-center').getByText('2')).toBeVisible({
      timeout: 3000,
    })

    // Verify total = 2 x 1200 = 2400 (use total display)
    const totalDisplay = page.locator('.text-3xl')
    await expect(totalDisplay).toContainText('2.400')
  })

  test('eliminar producto del carrito', async ({ page }) => {
    await page.goto('/pos')
    await expect(
      page.getByPlaceholder(/escanear|escribir código/i),
    ).toBeVisible()

    const input = page.getByPlaceholder(/escanear|escribir código/i)

    // Add product
    await input.fill('779000000001')
    await input.press('Enter')
    await expect(page.getByText('Arroz 1kg')).toBeVisible({ timeout: 5000 })

    // Click remove button (Trash icon)
    await page.getByTitle('Quitar').click()

    // Verify cart is empty
    await expect(page.getByText(/escanea un producto/i)).toBeVisible()
  })

  test('boton cobrar deshabilitado con carrito vacio', async ({ page }) => {
    await page.goto('/pos')
    await expect(
      page.getByPlaceholder(/escanear|escribir código/i),
    ).toBeVisible()

    // Cobrar button should be disabled when cart is empty
    const cobrarButton = page.getByRole('button', { name: /cobrar/i })
    await expect(cobrarButton).toBeDisabled()
  })

  test('limpiar carrito con boton Limpiar', async ({ page }) => {
    await page.goto('/pos')
    await expect(
      page.getByPlaceholder(/escanear|escribir código/i),
    ).toBeVisible()

    const input = page.getByPlaceholder(/escanear|escribir código/i)

    // Add product
    await input.fill('779000000001')
    await input.press('Enter')
    await expect(page.getByText('Arroz 1kg')).toBeVisible({ timeout: 5000 })

    // Click "Limpiar" button
    await page.getByTitle(/limpiar/i).click()

    // Verify cart is empty
    await expect(page.getByText(/escanea un producto/i)).toBeVisible()
  })

  test('seleccionar metodo de pago tarjeta y cobrar', async ({ page }) => {
    await page.goto('/pos')
    await expect(
      page.getByPlaceholder(/escanear|escribir código/i),
    ).toBeVisible()

    const input = page.getByPlaceholder(/escanear|escribir código/i)

    // Add product
    await input.fill('779000000003')
    await input.press('Enter')
    await expect(page.getByText('Leche Entera 1L')).toBeVisible({
      timeout: 5000,
    })

    // Switch to "Tarjeta" payment
    await page.getByRole('button', { name: /tarjeta/i }).click()

    // Click "Cobrar"
    await page.getByRole('button', { name: /cobrar/i }).click()

    // Verify success toast
    await expect(
      page.getByText(/venta/i).filter({ hasText: /registrada|idempotente/i }),
    ).toBeVisible({ timeout: 5000 })

    // Verify cart is reset
    await expect(page.getByText(/escanea un producto/i)).toBeVisible({
      timeout: 5000,
    })
  })
})

import { test, expect } from '@playwright/test'

test.describe('Comunicaciones', () => {
  test('page loads with tabs', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.getByRole('main').getByTestId('comunicaciones-page')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('main').getByTestId('tab-plantillas')).toBeVisible()
    await expect(page.getByRole('main').getByTestId('tab-envios')).toBeVisible()
  })

  test('plantillas tab shows 18 seed rows', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.getByRole('main').getByTestId('panel-plantillas')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="plantillas-row"]')).toHaveCount(18, { timeout: 10000 })
  })

  test('envios tab is accessible', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await page.getByRole('main').getByTestId('tab-envios').click()
    await expect(page.getByRole('main').getByTestId('panel-envios')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('main').getByTestId('envios-section')).toBeVisible()
  })

  test('crear plantilla nueva', async ({ page }) => {
    const ts = Date.now()
    await page.goto('/admin/comunicaciones/plantillas/nueva')
    await expect(page.getByTestId('plantilla-editor')).toBeVisible({ timeout: 15000 })

    await page.getByTestId('input-nombre').fill(`Test E2E ${ts}`)
    await page.getByTestId('input-cuerpo').fill(`Hola {{nombre}}, evento {{evento}} a las {{hora}}.`)

    await page.getByTestId('btn-guardar').click()
    await expect(page.getByRole('main').getByTestId('comunicaciones-page')).toBeVisible({ timeout: 15000 })

    // Verify the new plantilla appears in the list
    await expect(page.getByText(`Test E2E ${ts}`)).toBeVisible({ timeout: 10000 })
  })

  test('editar plantilla existente', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.locator('[data-testid="plantillas-row"]').first()).toBeVisible({ timeout: 10000 })

    // Click edit on first row
    await page.locator('[data-testid="plantillas-row"]').first().getByRole('button').click()
    await page.getByRole('menuitem', { name: /editar/i }).click()
    await expect(page.getByTestId('plantilla-editor')).toBeVisible({ timeout: 10000 })

    // System plantilla should show badge
    await expect(page.getByTestId('badge-sistema')).toBeVisible()

    // Slug should be disabled for existing
    await expect(page.getByTestId('input-slug')).toBeDisabled()
  })

  test('proteccion plantilla sistema: no eliminar', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.locator('[data-testid="plantillas-row"]').first()).toBeVisible({ timeout: 10000 })

    // Click on first sistema plantilla
    await page.locator('[data-testid="plantillas-row"]').first().getByRole('button').click()
    await page.getByRole('menuitem', { name: /editar/i }).click()
    await expect(page.getByTestId('plantilla-editor')).toBeVisible({ timeout: 10000 })

    // Eliminar button should be disabled for sistema
    await expect(page.getByTestId('btn-eliminar')).toBeDisabled()
  })

  test('soft-delete plantilla user-created', async ({ page }) => {
    // Create a plantilla to delete
    const ts = Date.now()
    await page.goto('/admin/comunicaciones/plantillas/nueva')
    await expect(page.getByTestId('plantilla-editor')).toBeVisible({ timeout: 15000 })

    await page.getByTestId('input-nombre').fill(`Borrable ${ts}`)
    await page.getByTestId('input-cuerpo').fill('Contenido temporal.')
    await page.getByTestId('btn-guardar').click()
    await expect(page.getByRole('main').getByTestId('comunicaciones-page')).toBeVisible({ timeout: 15000 })

    // Count rows before delete
    const countBefore = await page.locator('[data-testid="plantillas-row"]').count()

    // Find the new plantilla row and open its dropdown
    const row = page.locator('[data-testid="plantillas-row"]', { hasText: `Borrable ${ts}` })
    await expect(row).toBeVisible({ timeout: 10000 })
    await row.getByRole('button').click()
    await page.getByRole('menuitem', { name: /eliminar/i }).click()

    // Wait for deletion and verify count decreased
    await expect(page.locator('[data-testid="plantillas-row"]')).toHaveCount(countBefore - 1, { timeout: 10000 })
  })
})

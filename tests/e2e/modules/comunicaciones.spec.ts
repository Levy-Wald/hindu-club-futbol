import { test, expect } from '@playwright/test'

test.describe('Comunicaciones', () => {
  test('page loads with tabs', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.getByRole('main').getByTestId('comunicaciones-page')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('main').getByTestId('tab-plantillas')).toBeVisible()
    await expect(page.getByRole('main').getByTestId('tab-envios')).toBeVisible()
    await expect(page.getByRole('main').getByTestId('tab-envios-masivos')).toBeVisible()
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

  // === Envíos masivos (FASE 2.3) ===

  test('wizard envio masivo carga correctamente', async ({ page }) => {
    await page.goto('/admin/comunicaciones/envios-masivos/nuevo')
    await expect(page.getByTestId('envio-masivo-wizard')).toBeVisible({ timeout: 15000 })

    // Verify all sections exist
    await expect(page.getByTestId('select-plantilla-trigger')).toBeVisible()
    await expect(page.getByTestId('select-segmento')).toBeVisible()

    // Default segmento is "todos_activos", preview should load
    await expect(page.getByTestId('preview-conteo')).toContainText(/\d+ destinatarios/, { timeout: 15000 })
  })

  test('envio masivo a equipo muestra preview', async ({ page }) => {
    await page.goto('/admin/comunicaciones/envios-masivos/nuevo')
    await expect(page.getByTestId('envio-masivo-wizard')).toBeVisible({ timeout: 15000 })

    // Switch to equipo
    await page.getByTestId('select-segmento').click()
    await page.getByRole('option', { name: /equipo/i }).click()

    // Should show equipo selector
    await expect(page.getByTestId('select-equipo')).toBeVisible()

    // Select first equipo
    await page.getByTestId('select-equipo').click()
    await page.getByRole('option').first().click()

    // Preview should load
    await expect(page.getByTestId('preview-conteo')).toContainText(/\d+ destinatarios/, { timeout: 15000 })
  })

  test('envio masivo ejecuta y redirige a detalle', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/admin/comunicaciones/envios-masivos/nuevo')
    await expect(page.getByTestId('envio-masivo-wizard')).toBeVisible({ timeout: 15000 })

    // Select plantilla (first one)
    await page.getByTestId('select-plantilla-trigger').click()
    await page.getByRole('option').first().click()

    // Switch segmento to equipo (smaller set, faster)
    await page.getByTestId('select-segmento').click()
    await page.getByRole('option', { name: /equipo/i }).click()
    await page.getByTestId('select-equipo').click()
    await page.getByRole('option').first().click()

    // Wait for preview
    await expect(page.getByTestId('preview-conteo')).toContainText(/\d+ destinatarios/, { timeout: 15000 })

    // Click enviar
    await page.getByTestId('btn-enviar-masivo').click()

    // Confirm dialog
    await page.getByTestId('btn-confirmar-envio').click()

    // Should redirect to lote detail
    await expect(page).toHaveURL(/\/envios-masivos\/[0-9a-f-]{36}/, { timeout: 30000 })
    await expect(page.getByTestId('lote-detalle')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('envio-row').first()).toBeVisible({ timeout: 10000 })
  })

  test('tab envios masivos muestra historial', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await page.getByRole('main').getByTestId('tab-envios-masivos').click()
    await expect(page.getByRole('main').getByTestId('panel-envios-masivos')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('lotes-section')).toBeVisible()

    // Should have at least 1 lote from previous test
    await expect(page.getByTestId('lote-row').first()).toBeVisible({ timeout: 10000 })
  })
})

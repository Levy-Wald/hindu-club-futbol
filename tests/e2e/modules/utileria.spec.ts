import { test, expect } from '@playwright/test'

test.describe('Utileria', () => {
  test('dashboard utileria accesible', async ({ page }) => {
    await page.goto('/admin/utileria')
    await expect(page.locator('text=/utilería|utileria|inventario/i').first()).toBeVisible({ timeout: 5000 })
  })

  test.skip('inventario page loads', async ({ page }) => {
    // TODO: requiere atributo staff_utileria — el user E2E tiene staff basico
    await page.goto('/admin/utileria/inventario')
    await expect(page).toHaveURL(/\/admin\/utileria\/inventario/)
  })
})

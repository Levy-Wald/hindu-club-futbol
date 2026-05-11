import { test, expect } from '@playwright/test'

test.describe('Utileria', () => {
  test('dashboard utileria accesible', async ({ page }) => {
    await page.goto('/admin/utileria')
    await expect(page.locator('text=/utilería|utileria|inventario/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('inventario page loads', async ({ page }) => {
    await page.goto('/admin/utileria/inventario')
    await expect(page).toHaveURL(/\/admin\/utileria\/inventario/)
  })
})

import { test, expect } from '@playwright/test'

test.describe('Salud', () => {
  test('vista salud accesible', async ({ page }) => {
    await page.goto('/admin/salud')
    // Should load without DB error
    await expect(page.locator('text=/salud|alertas|médic/i').first()).toBeVisible({ timeout: 5000 })
  })
})

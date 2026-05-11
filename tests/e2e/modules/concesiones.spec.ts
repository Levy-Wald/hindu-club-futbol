import { test, expect } from '@playwright/test'

test.describe('Concesiones', () => {
  test('lista concesionarios', async ({ page }) => {
    await page.goto('/admin/concesiones')
    await expect(page.locator('text=/concesi/i').first()).toBeVisible({ timeout: 5000 })
  })
})

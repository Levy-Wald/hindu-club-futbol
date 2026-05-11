import { test, expect } from '@playwright/test'

test.describe('Notificaciones', () => {
  test('page loads without error', async ({ page }) => {
    await page.goto('/admin/notificaciones')
    await expect(page.locator('text=/notificaci/i').first()).toBeVisible({ timeout: 5000 })
  })
})

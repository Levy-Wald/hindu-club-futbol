import { test, expect } from '@playwright/test'

test.describe('Comunicaciones', () => {
  test('page loads', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.locator('text=/comunicaci/i').first()).toBeVisible({ timeout: 5000 })
  })
})

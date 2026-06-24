import { test, expect } from '@playwright/test'

test.describe('Consolidador de padrones (F6.7)', () => {
  test('vista consolidada accesible con KPIs', async ({ page }) => {
    await page.goto('/admin/padrones/consolidado')
    await expect(page.getByRole('heading', { name: /consolidador de padrones/i })).toBeVisible()
    await expect(page.locator('text=/personas únicas/i').first()).toBeVisible({ timeout: 5000 })
  })
})

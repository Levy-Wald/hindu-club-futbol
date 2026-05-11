import { test, expect } from '@playwright/test'

test.describe('Pre-inscripciones', () => {
  test('page loads without DB error', async ({ page }) => {
    await page.goto('/admin/pre-inscripciones')
    // Should not show DB error
    await expect(page.locator('text=/error.*column|42703/i')).not.toBeVisible({ timeout: 5000 })
  })
})

import { test, expect } from '@playwright/test'

test.describe('Federaciones (F6.9)', () => {
  test('directorio de federaciones accesible', async ({ page }) => {
    await page.goto('/admin/federaciones')
    await expect(page.getByRole('heading', { name: /federaciones/i })).toBeVisible()
  })
})

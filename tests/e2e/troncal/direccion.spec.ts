import { test, expect } from '@playwright/test'

test.describe('BI Ejecutivo (F6.5)', () => {
  test('dashboard de dirección accesible con KPIs', async ({ page }) => {
    await page.goto('/admin/direccion')
    await expect(page.getByRole('heading', { name: /direcci[óo]n/i })).toBeVisible()
    await expect(page.locator('text=/socios activos/i').first()).toBeVisible({ timeout: 5000 })
  })
})

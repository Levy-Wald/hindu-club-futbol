import { test, expect } from '@playwright/test'

test.describe('Rendición de gastos (F6.6)', () => {
  test('listado de rendiciones accesible', async ({ page }) => {
    await page.goto('/admin/finanzas/rendiciones')
    await expect(page.getByRole('heading', { name: /rendici[óo]n de gastos/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /nueva rendici[óo]n/i })).toBeVisible({ timeout: 5000 })
  })
})

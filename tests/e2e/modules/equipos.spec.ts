import { test, expect } from '@playwright/test'

test.describe('Equipos', () => {
  test('lista equipos visible', async ({ page }) => {
    await page.goto('/admin/equipos')
    await expect(page.getByRole('heading', { name: /equipos/i })).toBeVisible()

    // Table should have equipo rows
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 })
  })

  test('capitanes page loads', async ({ page }) => {
    await page.goto('/admin/equipos/capitanes')
    await expect(page.getByRole('heading', { name: /capitanes/i })).toBeVisible()
  })
})

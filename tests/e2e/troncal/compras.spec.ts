import { test, expect } from '@playwright/test'

test.describe('Compras (F1.14)', () => {
  test('listado de compras accesible', async ({ page }) => {
    await page.goto('/admin/compras')
    await expect(page.getByRole('heading', { name: /compras/i })).toBeVisible()
  })

  test('tabs órdenes y solicitudes presentes', async ({ page }) => {
    await page.goto('/admin/compras')
    await expect(page.getByRole('tab', { name: /órdenes de compra/i })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('tab', { name: /solicitudes/i })).toBeVisible()
  })
})

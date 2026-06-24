import { test, expect } from '@playwright/test'

test.describe('Proveedores (F1.13)', () => {
  test('listado de proveedores accesible', async ({ page }) => {
    await page.goto('/admin/proveedores')
    await expect(page.getByRole('heading', { name: /proveedores/i })).toBeVisible()
  })

  test('botón de nuevo proveedor presente', async ({ page }) => {
    await page.goto('/admin/proveedores')
    await expect(page.getByRole('button', { name: /nuevo proveedor/i })).toBeVisible({ timeout: 5000 })
  })
})

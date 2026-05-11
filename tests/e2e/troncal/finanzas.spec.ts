import { test, expect } from '@playwright/test'

test.describe('Finanzas', () => {
  test('dashboard finanzas accesible', async ({ page }) => {
    await page.goto('/admin/finanzas')
    await expect(page.getByRole('heading', { name: /finanzas/i })).toBeVisible()
  })

  test('suscripciones listado', async ({ page }) => {
    await page.goto('/admin/finanzas/suscripciones')
    await expect(page).toHaveURL(/\/admin\/finanzas\/suscripciones/)
    // Page should load without errors
    await expect(page.locator('text=/suscripci/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('cuotas listado', async ({ page }) => {
    await page.goto('/admin/finanzas/cuotas')
    await expect(page).toHaveURL(/\/admin\/finanzas\/cuotas/)
    await expect(page.locator('text=/cuota/i').first()).toBeVisible({ timeout: 5000 })
  })
})

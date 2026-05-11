import { test, expect } from '@playwright/test'

test.describe('RRHH', () => {
  test('dashboard rrhh accesible', async ({ page }) => {
    await page.goto('/admin/rrhh')
    await expect(page.locator('text=/rrhh|recursos|empleados|contratos/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('contratos page loads', async ({ page }) => {
    await page.goto('/admin/rrhh/contratos')
    await expect(page).toHaveURL(/\/admin\/rrhh\/contratos/)
  })
})

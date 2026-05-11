import { test, expect } from '@playwright/test'

test.describe('Comunicaciones', () => {
  test('page loads with tabs', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.getByTestId('comunicaciones-page')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('tab-plantillas')).toBeVisible()
    await expect(page.getByTestId('tab-envios')).toBeVisible()
  })

  test('plantillas tab shows 18 seed rows', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.getByTestId('panel-plantillas')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="plantillas-row"]')).toHaveCount(18, { timeout: 10000 })
  })

  test('envios tab is accessible', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await page.getByTestId('tab-envios').click()
    await expect(page.getByTestId('panel-envios')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('envios-section')).toBeVisible()
  })
})

import { test, expect } from '@playwright/test'

test.describe('Comunicaciones', () => {
  test('page loads with tabs', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.getByRole('main').getByTestId('comunicaciones-page')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('main').getByTestId('tab-plantillas')).toBeVisible()
    await expect(page.getByRole('main').getByTestId('tab-envios')).toBeVisible()
  })

  test('plantillas tab shows 18 seed rows', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.getByRole('main').getByTestId('panel-plantillas')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="plantillas-row"]')).toHaveCount(18, { timeout: 10000 })
  })

  test('envios tab is accessible', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await page.getByRole('main').getByTestId('tab-envios').click()
    await expect(page.getByRole('main').getByTestId('panel-envios')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('main').getByTestId('envios-section')).toBeVisible()
  })
})

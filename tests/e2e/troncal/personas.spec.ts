import { test, expect } from '@playwright/test'

test.describe('Personas', () => {
  test('lista personas visible', async ({ page }) => {
    await page.goto('/admin/personas')
    await expect(page.getByRole('heading', { name: /personas/i })).toBeVisible()

    // Wait for personas data to load — links should be in the DOM
    const firstLink = page.locator('a[href*="/admin/personas/"]').first()
    await expect(firstLink).toBeAttached({ timeout: 10000 })
  })

  test('ficha persona accesible', async ({ page }) => {
    await page.goto('/admin/personas')

    // Get href of first persona link and navigate directly
    const firstLink = page.locator('a[href*="/admin/personas/"]').first()
    await expect(firstLink).toBeAttached({ timeout: 10000 })
    const href = await firstLink.getAttribute('href')

    await page.goto(href!)
    await expect(page).toHaveURL(/\/admin\/personas\//, { timeout: 10000 })
  })
})

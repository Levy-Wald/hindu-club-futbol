import { test, expect } from '@playwright/test'

test.describe('Equipos', () => {
  test('lista equipos y accede a ficha', async ({ page }) => {
    await page.goto('/admin/equipos')
    await expect(page.getByRole('heading', { name: /equipos/i })).toBeVisible()

    // Should have at least one equipo
    const links = page.locator('a[href*="/admin/equipos/"]')
    await expect(links.first()).toBeVisible({ timeout: 10000 })

    // Click first equipo
    await links.first().click()
    await expect(page).toHaveURL(/\/admin\/equipos\//)

    // Should show equipo tabs
    await expect(page.locator('text=/Info|Jugadores|Plantel/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('capitanes page loads', async ({ page }) => {
    await page.goto('/admin/equipos/capitanes')
    await expect(page.getByRole('heading', { name: /capitanes/i })).toBeVisible()
  })
})

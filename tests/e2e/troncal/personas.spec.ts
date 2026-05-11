import { test, expect } from '@playwright/test'

test.describe('Personas', () => {
  test('lista personas y accede a ficha', async ({ page }) => {
    await page.goto('/admin/personas')
    await expect(page.getByRole('heading', { name: /personas/i })).toBeVisible()

    // Table should have at least one row
    const rows = page.locator('table tbody tr, [class*="rounded-lg border p-3"]')
    await expect(rows.first()).toBeVisible({ timeout: 10000 })

    // Click first persona link
    const firstLink = page.locator('a[href*="/admin/personas/"]').first()
    await firstLink.click()

    // Should show persona detail
    await expect(page).toHaveURL(/\/admin\/personas\//)
    await expect(page.locator('text=/Datos|Info|Perfil/i').first()).toBeVisible({ timeout: 5000 })
  })
})

import { test, expect } from '@playwright/test'

// F3 — Portal Cliente. Cualquier usuario autenticado puede entrar a /portal y ver
// su propio dashboard (datos filtrados por persona propia).
test.describe('Portal Cliente (F3)', () => {
  test('/portal redirige al portal del tenant y muestra el dashboard', async ({ page }) => {
    await page.goto('/portal')
    await expect(page).toHaveURL(/\/portal\/[0-9a-f-]+/, { timeout: 5000 })
    // Accesos rápidos del dashboard del socio
    await expect(page.locator('text=/accesos r[áa]pidos/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('bottom-nav del portal con sus tabs', async ({ page }) => {
    await page.goto('/portal')
    await expect(page.locator('nav').getByText('Mi cuenta')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('nav').getByText('Agenda')).toBeVisible()
    await expect(page.locator('nav').getByText('Perfil')).toBeVisible()
  })

  test('navegación a las sub-páginas del portal', async ({ page }) => {
    await page.goto('/portal')
    await page.locator('nav').getByText('Mi cuenta').click()
    await expect(page.getByRole('heading', { name: /mi cuenta/i })).toBeVisible({ timeout: 5000 })

    await page.locator('nav').getByText('Agenda').click()
    await expect(page.getByRole('heading', { name: /mi agenda/i })).toBeVisible({ timeout: 5000 })

    await page.locator('nav').getByText('Perfil').click()
    await expect(page.getByRole('heading', { name: /mi perfil/i })).toBeVisible({ timeout: 5000 })
  })
})

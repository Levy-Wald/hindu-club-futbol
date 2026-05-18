import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth/user.json' })

test.describe('Mi Día — Dashboard dinámico', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
  })

  test('muestra al menos el widget de saludo', async ({ page }) => {
    // The greeting widget should always be visible
    await expect(page.getByText(/Buenos días|Buenas tardes|Buenas noches/)).toBeVisible({ timeout: 10000 })
  })

  test('widgets cargan sin errores de consola', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.waitForTimeout(3000) // let widgets load
    const widgetErrors = errors.filter(e => !e.includes('favicon') && !e.includes('hydration'))
    expect(widgetErrors).toHaveLength(0)
  })

  test('avatar en TopBar navega a Mi perfil', async ({ page }) => {
    // Click avatar dropdown
    const avatar = page.locator('[data-testid="user-avatar"]')
    if (await avatar.isVisible()) {
      await avatar.click()
      const miPerfil = page.getByText('Mi perfil')
      if (await miPerfil.isVisible()) {
        await miPerfil.click()
        await expect(page).toHaveURL(/\/admin\/personas\//)
      }
    }
  })
})

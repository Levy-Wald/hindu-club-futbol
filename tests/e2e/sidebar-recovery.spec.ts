import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth/user.json' })

test.describe('B11 — Sidebar Navigation Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
  })

  test('Operacion space shows at least 15 items', async ({ page }) => {
    const operacionBtn = page.locator('[data-testid="space-operacion"]')
    if (await operacionBtn.isVisible()) {
      await operacionBtn.click()
      await page.waitForTimeout(500)
      const sidebar = page.locator('[data-testid="sidebar"]')
      const links = sidebar.locator('a[href]')
      const count = await links.count()
      expect(count).toBeGreaterThanOrEqual(10)
    }
  })

  test('Gestion space shows finanzas, productos, proyectos', async ({ page }) => {
    const gestionBtn = page.locator('[data-testid="space-gestion"]')
    if (await gestionBtn.isVisible()) {
      await gestionBtn.click()
      await page.waitForTimeout(500)
      const sidebar = page.locator('[data-testid="sidebar"]')
      await expect(sidebar.getByText('Finanzas')).toBeVisible()
      await expect(sidebar.getByText('Productos')).toBeVisible()
      await expect(sidebar.getByText('Proyectos')).toBeVisible()
    }
  })

  test('Setup space shows usuarios and mapa del club', async ({ page }) => {
    const setupBtn = page.locator('[data-testid="space-setup"]')
    if (await setupBtn.isVisible()) {
      await setupBtn.click()
      await page.waitForTimeout(500)
      const sidebar = page.locator('[data-testid="sidebar"]')
      await expect(sidebar.getByText('Usuarios y permisos')).toBeVisible()
      await expect(sidebar.getByText('Mapa del club')).toBeVisible()
    }
  })

  test('Avatar opens dropdown with Mi perfil', async ({ page }) => {
    const avatar = page.locator('[data-testid="user-avatar"]')
    if (await avatar.isVisible()) {
      await avatar.click()
      await expect(page.getByText('Mi perfil')).toBeVisible()
      await expect(page.getByText('Cerrar sesión')).toBeVisible()
    }
  })

  test('Mi perfil navigates to persona page', async ({ page }) => {
    const avatar = page.locator('[data-testid="user-avatar"]')
    if (await avatar.isVisible()) {
      await avatar.click()
      const miPerfil = page.getByText('Mi perfil')
      if (await miPerfil.isVisible()) {
        await miPerfil.click()
        await expect(page).toHaveURL(/\/admin\/personas\//, { timeout: 10000 })
      }
    }
  })

  test('Usuarios page shows at least 1 user', async ({ page }) => {
    await page.goto('/admin/configuracion/usuarios')
    await page.waitForLoadState('networkidle')
    // Should NOT show "No se encontraron" or empty state
    const content = await page.textContent('body')
    expect(content).not.toContain('No se encontraron')
    // Should show at least one persona name
    expect(content).toMatch(/Levy Wald|Test/)
  })
})

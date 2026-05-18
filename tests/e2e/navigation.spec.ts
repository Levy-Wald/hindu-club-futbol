import { test, expect } from '@playwright/test'

test.use({ storageState: 'tests/e2e/.auth/user.json' })

test.describe('Navigation — 3 niveles + 4 espacios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible({ timeout: 15000 })
  })

  test('TopBar muestra espacios y sidebar se actualiza al cambiar', async ({ page }) => {
    // Should see at least Mi Día and one other space
    await expect(page.locator('[data-testid="space-mi-dia"]')).toBeVisible()

    // Click Operación space (if visible — depends on user capabilities)
    const operacionBtn = page.locator('[data-testid="space-operacion"]')
    if (await operacionBtn.isVisible()) {
      await operacionBtn.click()
      // Sidebar should show operation items
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    }

    // Click Gestión space (if visible)
    const gestionBtn = page.locator('[data-testid="space-gestion"]')
    if (await gestionBtn.isVisible()) {
      await gestionBtn.click()
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    }

    // Click Setup space (if visible)
    const setupBtn = page.locator('[data-testid="space-setup"]')
    if (await setupBtn.isVisible()) {
      await setupBtn.click()
      // Should see usuarios item for admin users
      await expect(
        page.locator('[data-testid="sidebar-item-usuarios"]')
      ).toBeVisible({ timeout: 5000 })
    }
  })

  test('Sidebar filtra items por espacio activo', async ({ page }) => {
    // Switch to Operación
    const operacionBtn = page.locator('[data-testid="space-operacion"]')
    if (await operacionBtn.isVisible()) {
      await operacionBtn.click()

      // Should see personas in Operación
      await expect(
        page.locator('[data-testid="sidebar-item-personas"]')
      ).toBeVisible({ timeout: 5000 })

      // Switch to Gestión — personas should NOT be visible
      const gestionBtn = page.locator('[data-testid="space-gestion"]')
      if (await gestionBtn.isVisible()) {
        await gestionBtn.click()
        await expect(
          page.locator('[data-testid="sidebar-item-personas"]')
        ).not.toBeVisible({ timeout: 3000 })

        // Should see finanzas in Gestión
        await expect(
          page.locator('[data-testid="sidebar-item-finanzas"]')
        ).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('Cmd+K abre command palette y permite buscar', async ({ page }) => {
    // Click the search trigger
    await page.locator('[data-testid="cmd-k-trigger"]').click()

    // Command palette should be visible
    const input = page.locator('[data-slot="command-input"]')
    await expect(input).toBeVisible({ timeout: 5000 })

    // Type "persona" — should suggest Personas
    await input.fill('Persona')
    const personasItem = page.locator('[data-slot="command-item"]').filter({ hasText: 'Personas' })
    await expect(personasItem).toBeVisible({ timeout: 3000 })
  })
})

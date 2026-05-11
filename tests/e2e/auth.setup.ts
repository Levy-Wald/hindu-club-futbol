import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL || 'yair@hindu.org.ar'
  const password = process.env.E2E_USER_PASSWORD

  if (!password) {
    throw new Error(
      'E2E_USER_PASSWORD env var is required.\n' +
      'Set it in .env.local or run: E2E_USER_PASSWORD=xxx npm run test:e2e'
    )
  }

  await page.goto('/login')
  await expect(page.getByLabel('Email')).toBeVisible({ timeout: 15000 })

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  // Wait for redirect to admin dashboard
  await page.waitForURL('/admin**', { timeout: 15000 })
  await expect(page).toHaveURL(/\/admin/)

  // Save signed-in state
  await page.context().storageState({ path: authFile })
})

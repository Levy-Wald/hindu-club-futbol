import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL || 'e2e-test@levywald.com'
  const password = process.env.E2E_USER_PASSWORD

  if (!password) {
    throw new Error(
      'E2E_USER_PASSWORD env var is required.\n' +
      'Set it in .env.local or run:\n' +
      '  E2E_USER_PASSWORD=xxx npm run test:e2e'
    )
  }

  // Log network errors for debugging auth issues
  page.on('response', async (response) => {
    if (response.url().includes('auth') && response.status() >= 400) {
      const body = await response.text().catch(() => '(no body)')
      console.error(`Auth error ${response.status()}: ${body}`)
    }
  })

  await page.goto('/login')
  await expect(page.getByLabel('Email')).toBeVisible({ timeout: 15000 })

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)

  // Click login and wait for redirect
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()

  // Wait for navigation to admin
  await page.waitForURL('**/admin**', { timeout: 30000 })

  // Save signed-in state
  await page.context().storageState({ path: authFile })
})

import { test, expect } from '@playwright/test'

test.describe('Planificador de partido (F6.8)', () => {
  test('listado de partidos para convocatoria accesible', async ({ page }) => {
    await page.goto('/admin/convocatorias')
    await expect(page.getByRole('heading', { name: /planificador de partido/i })).toBeVisible()
  })
})

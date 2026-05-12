import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const TENANT = '11111111-1111-1111-1111-111111111111'

function serviceRole() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

test.describe('Entrenamientos', () => {
  test.describe.configure({ mode: 'serial' })

  let eventoId: string | null = null
  let equipoId: string | null = null
  let planId: string | null = null

  test.afterAll(async () => {
    const supabase = serviceRole()
    if (planId) {
      await supabase.from('entrenamiento_plan_bloques').delete().eq('plan_id', planId)
      await supabase.from('entrenamiento_planes').delete().eq('id', planId)
    }
    if (eventoId) await supabase.from('eventos').delete().eq('id', eventoId)
    if (equipoId) {
      await supabase.from('personas_equipos').delete().eq('equipo_id', equipoId)
      await supabase.from('equipos').delete().eq('id', equipoId)
    }
  })

  test('crear plan de entrenamiento desde evento', async ({ page }) => {
    const supabase = serviceRole()

    // Fixture: equipo + evento tipo entrenamiento
    const { data: equipo } = await supabase
      .from('equipos')
      .insert({
        tenant_id: TENANT,
        nombre: 'E2E Entrenamientos Team',
        disciplina_slug: 'futbol',
        activo: true,
      })
      .select('id')
      .single()
    equipoId = equipo!.id

    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    const { data: evento } = await supabase
      .from('eventos')
      .insert({
        tenant_id: TENANT,
        equipo_id: equipoId,
        tipo_evento_slug: 'entrenamiento',
        titulo: 'E2E - Plan de Entrenamiento',
        fecha: tomorrow,
        hora_inicio: '18:00:00',
        hora_fin: '20:00:00',
        activo: true,
        modulo_origen: 'entrenamientos',
      })
      .select('id')
      .single()
    eventoId = evento!.id

    await page.goto(`/admin/operaciones/eventos/${eventoId}/plan`)
    await page.waitForLoadState('networkidle')

    // Should see "Crear plan" button
    await expect(page.getByTestId('btn-crear-plan')).toBeVisible({ timeout: 15000 })

    // Click to create plan
    await page.getByTestId('btn-crear-plan').click()

    // Fill objective
    await page.locator('input[placeholder*="Mejorar"]').fill('E2E objetivo test')

    // Save plan
    await page.getByTestId('btn-guardar-plan').click()
    await page.waitForLoadState('networkidle')

    // Verify plan was created - duration should be visible
    await expect(page.getByTestId('plan-duracion-total')).toBeVisible({ timeout: 10000 })

    // Store planId for cleanup
    const { data: plan } = await supabase
      .from('entrenamiento_planes')
      .select('id')
      .eq('evento_id', eventoId)
      .single()
    planId = plan?.id ?? null
  })

  test('agregar bloque del catalogo', async ({ page }) => {
    await page.goto(`/admin/operaciones/eventos/${eventoId}/plan`)
    await page.waitForLoadState('networkidle')

    // Click "Agregar bloque"
    await expect(page.getByTestId('btn-agregar-bloque')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('btn-agregar-bloque').click()

    // Modal should appear
    await expect(page.getByTestId('modal-agregar-bloque')).toBeVisible()

    // Search for an exercise
    await page.getByTestId('select-ejercicio').fill('trote')
    await page.waitForTimeout(300)

    // Click the first result
    const resultado = page.locator('[data-testid="modal-agregar-bloque"] button', { hasText: 'Trote' })
    await expect(resultado.first()).toBeVisible({ timeout: 5000 })
    await resultado.first().click()

    // Submit
    await page.getByTestId('btn-confirmar-bloque').click()

    // Verify bloque appears in list
    await expect(page.getByTestId('lista-bloques')).toContainText('Trote', { timeout: 5000 })
  })

  test('agregar bloque libre', async ({ page }) => {
    await page.goto(`/admin/operaciones/eventos/${eventoId}/plan`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('btn-agregar-bloque')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('btn-agregar-bloque').click()

    await expect(page.getByTestId('modal-agregar-bloque')).toBeVisible()

    // Switch to libre mode
    await page.getByTestId('btn-modo-libre').click()

    // Type custom name
    await page.getByTestId('input-nombre-libre').fill('Partido reducido 5v5')

    // Submit
    await page.getByTestId('btn-confirmar-bloque').click()

    // Verify bloque appears
    await expect(page.getByTestId('lista-bloques')).toContainText('Partido reducido 5v5', { timeout: 5000 })
  })

  test('eliminar bloque', async ({ page }) => {
    await page.goto(`/admin/operaciones/eventos/${eventoId}/plan`)
    await page.waitForLoadState('networkidle')

    // Wait for bloques to load
    await expect(page.getByTestId('lista-bloques')).toContainText('Partido reducido 5v5', { timeout: 15000 })

    // Find the libre bloque's delete button
    const supabase = serviceRole()
    const { data: bloques } = await supabase
      .from('entrenamiento_plan_bloques')
      .select('id, nombre_personalizado')
      .eq('plan_id', planId!)
      .eq('nombre_personalizado', 'Partido reducido 5v5')
      .single()

    const bloqueId = bloques!.id
    await page.getByTestId(`btn-eliminar-bloque-${bloqueId}`).click()

    // Verify bloque was removed
    await expect(page.getByTestId('lista-bloques')).not.toContainText('Partido reducido 5v5', { timeout: 5000 })
  })
})

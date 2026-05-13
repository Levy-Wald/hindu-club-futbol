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

test.describe('Amistosos', () => {
  test.describe.configure({ mode: 'serial' })

  let eventoId: string | null = null
  let equipoId: string | null = null

  test.afterAll(async () => {
    const supabase = serviceRole()
    // Clean up nominas
    if (eventoId) {
      await supabase.from('nomina_externa_items').delete().in(
        'nomina_externa_id',
        (await supabase.from('nominas_externas').select('id').eq('evento_id', eventoId)).data?.map(n => n.id) ?? []
      )
      await supabase.from('nominas_externas').delete().eq('evento_id', eventoId)
      await supabase.from('eventos').delete().eq('id', eventoId)
    }
    if (equipoId) {
      await supabase.from('personas_equipos').delete().eq('equipo_id', equipoId)
      await supabase.from('equipos').delete().eq('id', equipoId)
    }
  })

  test('admin ve pantalla amistoso con header y secciones', async ({ page }) => {
    const supabase = serviceRole()

    // Fixture: equipo + evento tipo amistoso
    const { data: equipo } = await supabase
      .from('equipos')
      .insert({
        tenant_id: TENANT,
        nombre: 'E2E Amistosos Team',
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
        tipo_evento_slug: 'amistoso',
        titulo: 'E2E - Amistoso vs Rival',
        fecha: tomorrow,
        hora_inicio: '16:00:00',
        hora_fin: '18:00:00',
        activo: true,
        modulo_origen: 'amistosos',
      })
      .select('id')
      .single()
    eventoId = evento!.id

    await page.goto(`/admin/operaciones/eventos/${eventoId}/amistoso`)
    await page.waitForLoadState('networkidle')

    // Verify main sections visible
    await expect(page.getByTestId('pantalla-amistoso')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('header-amistoso')).toBeVisible()
    await expect(page.getByTestId('seccion-logistica')).toBeVisible()
    await expect(page.getByTestId('seccion-nomina-rival')).toBeVisible()
    await expect(page.getByTestId('seccion-plantel-propio')).toBeVisible()

    // Header shows event info
    await expect(page.getByTestId('header-amistoso')).toContainText('E2E - Amistoso vs Rival')
    await expect(page.getByTestId('header-amistoso')).toContainText('E2E Amistosos Team')
  })

  test('completar logística persiste en metadata', async ({ page }) => {
    await page.goto(`/admin/operaciones/eventos/${eventoId}/amistoso`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('seccion-logistica')).toBeVisible({ timeout: 15000 })

    // Fill logística form
    await page.getByTestId('input-club-rival').fill('Club Visitante E2E')
    await page.getByTestId('input-color-camiseta-home').fill('Blanco')
    await page.getByTestId('input-contacto-rival-telefono').fill('+541112345678')
    await page.getByTestId('textarea-observaciones').fill('Llevar pelotas extra')

    // Save
    await page.getByTestId('btn-guardar-logistica').click()

    // Wait for save confirmation
    await expect(page.getByText('Guardado')).toBeVisible({ timeout: 10000 })

    // Verify in DB
    const supabase = serviceRole()
    const { data: evento } = await supabase
      .from('eventos')
      .select('metadata')
      .eq('id', eventoId!)
      .single()

    const logistica = (evento?.metadata as Record<string, unknown>)?.logistica_amistoso as Record<string, unknown>
    expect(logistica.club_rival_nombre).toBe('Club Visitante E2E')
    expect(logistica.color_camiseta_home).toBe('Blanco')
    expect(logistica.contacto_rival_telefono).toBe('+541112345678')
    expect(logistica.observaciones).toBe('Llevar pelotas extra')
  })

  test('generar nómina del rival crea link válido', async ({ page }) => {
    await page.goto(`/admin/operaciones/eventos/${eventoId}/amistoso`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('seccion-nomina-rival')).toBeVisible({ timeout: 15000 })

    // Click generate
    await page.getByTestId('btn-generar-nomina-rival').click()

    // Wait for link to appear
    await expect(page.getByTestId('link-nomina-rival')).toBeVisible({ timeout: 15000 })

    // Verify nomina was created in DB
    const supabase = serviceRole()
    const { data: nominas } = await supabase
      .from('nominas_externas')
      .select('id, token, estado, evento_id')
      .eq('evento_id', eventoId!)
      .order('created_at', { ascending: false })
      .limit(1)

    expect(nominas).toHaveLength(1)
    expect(nominas![0].evento_id).toBe(eventoId)
    expect(nominas![0].estado).toBe('pendiente')

    // Navigate to the nomina link to verify it loads
    const nominaLink = page.getByTestId('link-nomina-rival')
    const href = await nominaLink.getAttribute('href')
    expect(href).toContain('/nomina/')

    // Open in same page to verify it loads the public form
    await page.goto(href!)
    await page.waitForLoadState('networkidle')

    // The public nomina form should load (it has the event title)
    await expect(page.locator('body')).toContainText('E2E - Amistoso vs Rival', { timeout: 10000 })
  })
})

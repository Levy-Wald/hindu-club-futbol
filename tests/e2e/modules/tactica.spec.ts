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

test.describe('Tactica', () => {
  test.describe.configure({ mode: 'serial' })

  let eventoId: string | null = null
  let equipoId: string | null = null
  let esquemaId: string | null = null

  test.afterAll(async () => {
    const supabase = serviceRole()
    if (esquemaId) {
      await supabase.from('esquema_posiciones').delete().eq('esquema_id', esquemaId)
      await supabase.from('esquemas_tacticos').delete().eq('id', esquemaId)
    }
    if (eventoId) {
      // Clean any esquemas created during test
      const { data: esquemas } = await supabase
        .from('esquemas_tacticos')
        .select('id')
        .eq('evento_id', eventoId)
      for (const e of esquemas ?? []) {
        await supabase.from('esquema_posiciones').delete().eq('esquema_id', e.id)
        await supabase.from('esquemas_tacticos').delete().eq('id', e.id)
      }
      await supabase.from('evento_invitados').delete().eq('evento_id', eventoId)
      await supabase.from('evento_asistencias').delete().eq('evento_id', eventoId)
      await supabase.from('eventos').delete().eq('id', eventoId)
    }
    if (equipoId) {
      await supabase.from('personas_equipos').delete().eq('equipo_id', equipoId)
      await supabase.from('equipos').delete().eq('id', equipoId)
    }
  })

  test('admin ve pantalla tactica con cancha y selector', async ({ page }) => {
    const supabase = serviceRole()

    // Fixture: equipo + evento tipo amistoso
    const { data: equipo } = await supabase
      .from('equipos')
      .insert({
        tenant_id: TENANT,
        nombre: 'E2E Tactica Team',
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
        titulo: 'E2E - Tactica Test Match',
        fecha: tomorrow,
        hora_inicio: '16:00:00',
        hora_fin: '18:00:00',
        activo: true,
        modulo_origen: 'tactica',
      })
      .select('id')
      .single()
    eventoId = evento!.id

    await page.goto(`/admin/operaciones/eventos/${eventoId}/tactica`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('pantalla-tactica')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('selector-formacion')).toBeVisible()
    await expect(page.getByTestId('cancha-visual')).toBeVisible()
    await expect(page.getByTestId('panel-plantel')).toBeVisible()
  })

  test('seleccionar formacion crea esquema tactico', async ({ page }) => {
    await page.goto(`/admin/operaciones/eventos/${eventoId}/tactica`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-tactica')).toBeVisible({ timeout: 15000 })

    // Change formation to 4-3-3
    await page.getByTestId('selector-formacion').click()
    await page.getByRole('option', { name: '4-3-3' }).click()

    // Wait for save
    await page.waitForTimeout(2000)

    // Verify esquema was created in DB
    const supabase = serviceRole()
    const { data: esquemas } = await supabase
      .from('esquemas_tacticos')
      .select('id, formacion')
      .eq('evento_id', eventoId!)
      .order('created_at', { ascending: false })
      .limit(1)

    expect(esquemas).toHaveLength(1)
    expect(esquemas![0].formacion).toBe('4-3-3')
    esquemaId = esquemas![0].id
  })

  test('asignar jugador a slot desde modal', async ({ page }) => {
    const supabase = serviceRole()

    // Fixture: add a player to the team
    const dniUnique = `E2E${Date.now()}`
    const { data: persona, error: errPersona } = await supabase
      .from('personas')
      .insert({
        tenant_id: TENANT,
        nombre: 'Jugador',
        apellido: 'TacticaE2E',
        tipo_documento: 'dni',
        numero_documento: dniUnique,
      })
      .select('id')
      .single()
    if (errPersona) throw new Error(`Persona insert failed: ${errPersona.message}`)

    await supabase.from('personas_equipos').insert({
      tenant_id: TENANT,
      persona_id: persona!.id,
      equipo_id: equipoId!,
      rol_equipo_slug: 'jugador',
      activo: true,
      numero_camiseta: '10',
    })

    await page.goto(`/admin/operaciones/eventos/${eventoId}/tactica`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-tactica')).toBeVisible({ timeout: 15000 })

    // Click on an empty slot (arquero)
    await page.getByTestId('slot-arquero').click()

    // Modal should appear
    await expect(page.getByTestId('modal-asignar')).toBeVisible({ timeout: 5000 })

    // Click the player to assign
    await page.getByTestId(`asignar-${persona!.id}`).click()

    // Modal should close, slot should show player
    await expect(page.getByTestId('modal-asignar')).not.toBeVisible({ timeout: 5000 })

    // Verify in DB
    const { data: posiciones } = await supabase
      .from('esquema_posiciones')
      .select('posicion, persona_id')
      .eq('esquema_id', esquemaId!)

    const arqueroPos = posiciones?.find(p => p.posicion === 'arquero')
    expect(arqueroPos).toBeTruthy()
    expect(arqueroPos!.persona_id).toBe(persona!.id)

    // Cleanup persona
    await supabase.from('personas_equipos').delete().eq('persona_id', persona!.id)
    await supabase.from('esquema_posiciones').delete().eq('persona_id', persona!.id)
    await supabase.from('personas').delete().eq('id', persona!.id)
  })
})

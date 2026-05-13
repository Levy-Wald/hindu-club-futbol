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

test.describe('Torneos', () => {
  test.describe.configure({ mode: 'serial' })

  let torneoInternoId: string | null = null
  let torneoExternoId: string | null = null
  let categoriaId: string | null = null
  const equipoInscriptoIds: string[] = []

  test.afterAll(async () => {
    const supabase = serviceRole()
    // Clean equipos inscriptos
    for (const id of equipoInscriptoIds) {
      await supabase.from('torneo_equipos').delete().eq('id', id)
    }
    // Clean categorias + torneos (CASCADE will clean categorias)
    if (torneoInternoId) {
      await supabase.from('torneo_categorias').delete().eq('torneo_id', torneoInternoId)
      await supabase.from('torneos').delete().eq('id', torneoInternoId)
    }
    if (torneoExternoId) {
      await supabase.from('torneo_categorias').delete().eq('torneo_id', torneoExternoId)
      await supabase.from('torneos').delete().eq('id', torneoExternoId)
    }
  })

  test('admin crea torneo interno formato liga', async ({ page }) => {
    await page.goto('/admin/competencias/torneos')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('pantalla-torneos')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('btn-nuevo-torneo')).toBeVisible()

    // Open modal
    await page.getByTestId('btn-nuevo-torneo').click()
    await expect(page.getByTestId('modal-nuevo-torneo')).toBeVisible({ timeout: 5000 })

    // Paso 1: datos generales
    await expect(page.getByTestId('wizard-paso-1')).toBeVisible()
    await page.getByTestId('input-nombre').fill('Copa E2E Test')
    await page.getByTestId('input-temporada').fill('2026 E2E')
    // Tipo interno (default)
    await page.getByTestId('radio-interno').check()
    // Formato liga (default)
    await page.getByTestId('btn-siguiente').click()

    // Paso 2: fechas
    await expect(page.getByTestId('wizard-paso-2')).toBeVisible()
    await page.getByTestId('btn-siguiente').click()

    // Paso 3: desempate
    await expect(page.getByTestId('wizard-paso-3')).toBeVisible()
    await page.getByTestId('btn-crear-torneo').click()

    // Modal should close
    await expect(page.getByTestId('modal-nuevo-torneo')).not.toBeVisible({ timeout: 10000 })

    // Verify in DB
    const supabase = serviceRole()
    const { data: torneos } = await supabase
      .from('torneos')
      .select('id, tipo, formato, estado, temporada')
      .eq('tenant_id', TENANT)
      .eq('nombre', 'Copa E2E Test')
      .order('created_at', { ascending: false })
      .limit(1)

    expect(torneos).toHaveLength(1)
    const t = torneos![0]
    expect(t.tipo).toBe('interno')
    expect(t.formato).toBe('liga')
    expect(t.estado).toBe('planificado')
    expect(t.temporada).toBe('2026 E2E')
    torneoInternoId = t.id
  })

  test('admin crea torneo externo asociado a FACCMA', async ({ page }) => {
    const supabase = serviceRole()

    // Find FACCMA
    const { data: faccma } = await supabase
      .from('entidades')
      .select('id, nombre')
      .eq('tenant_id', TENANT)
      .eq('tipo', 'federacion')
      .ilike('nombre', '%FACCMA%')
      .single()

    expect(faccma).not.toBeNull()

    await page.goto('/admin/competencias/torneos')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-torneos')).toBeVisible({ timeout: 15000 })

    await page.getByTestId('btn-nuevo-torneo').click()
    await expect(page.getByTestId('modal-nuevo-torneo')).toBeVisible({ timeout: 5000 })

    // Paso 1
    await page.getByTestId('input-nombre').fill('Liga FACCMA E2E')
    await page.getByTestId('radio-externo').check()

    // Wait for federacion select to appear
    await expect(page.getByTestId('select-federacion')).toBeVisible({ timeout: 3000 })
    await page.getByTestId('select-federacion').click()
    await page.getByRole('option', { name: /FACCMA/ }).click()

    await page.getByTestId('btn-siguiente').click()

    // Paso 2
    await expect(page.getByTestId('wizard-paso-2')).toBeVisible()
    await page.getByTestId('btn-siguiente').click()

    // Paso 3
    await expect(page.getByTestId('wizard-paso-3')).toBeVisible()
    await page.getByTestId('btn-crear-torneo').click()

    await expect(page.getByTestId('modal-nuevo-torneo')).not.toBeVisible({ timeout: 10000 })

    // Verify in DB
    const { data: torneos } = await supabase
      .from('torneos')
      .select('id, tipo, federacion_id')
      .eq('tenant_id', TENANT)
      .eq('nombre', 'Liga FACCMA E2E')
      .order('created_at', { ascending: false })
      .limit(1)

    expect(torneos).toHaveLength(1)
    expect(torneos![0].tipo).toBe('externo')
    expect(torneos![0].federacion_id).toBe(faccma!.id)
    torneoExternoId = torneos![0].id
  })

  test('admin agrega 4 equipos a una categoria', async ({ page }) => {
    const supabase = serviceRole()

    // Create a categoria for the interno torneo
    const { data: cat } = await supabase
      .from('torneo_categorias')
      .insert({
        tenant_id: TENANT,
        torneo_id: torneoInternoId!,
        slug: 'sub-15-e2e',
        nombre: 'Sub-15',
        orden: 1,
      })
      .select('id')
      .single()

    expect(cat).not.toBeNull()
    categoriaId = cat!.id

    // Get 2 equipos propios
    const { data: equipos } = await supabase
      .from('equipos')
      .select('id, nombre')
      .eq('tenant_id', TENANT)
      .limit(2)

    expect(equipos!.length).toBeGreaterThanOrEqual(2)

    // Navigate to torneo detail
    await page.goto(`/admin/competencias/torneos/${torneoInternoId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-detalle-torneo')).toBeVisible({ timeout: 15000 })

    // Go to equipos tab
    await page.getByTestId('tab-equipos').click()
    await expect(page.getByTestId('btn-agregar-equipo')).toBeVisible({ timeout: 5000 })

    // Add 2 propios + 2 externos = 4 equipos
    for (let i = 0; i < 2; i++) {
      await page.getByTestId('btn-agregar-equipo').click()
      await expect(page.getByTestId('modal-agregar-equipo')).toBeVisible({ timeout: 5000 })

      // Select categoria
      await page.getByTestId('select-categoria-equipo').click()
      await page.getByRole('option', { name: 'Sub-15' }).click()

      // Tab propio (default)
      await page.getByTestId('select-equipo-propio').click()
      await page.getByRole('option', { name: equipos![i].nombre }).click()

      await page.getByTestId('btn-inscribir-equipo').click()
      await expect(page.getByTestId('modal-agregar-equipo')).not.toBeVisible({ timeout: 10000 })
    }

    // Add 2 external
    for (let i = 0; i < 2; i++) {
      await page.getByTestId('btn-agregar-equipo').click()
      await expect(page.getByTestId('modal-agregar-equipo')).toBeVisible({ timeout: 5000 })

      await page.getByTestId('select-categoria-equipo').click()
      await page.getByRole('option', { name: 'Sub-15' }).click()

      await page.getByTestId('tab-equipo-externo').click()
      await page.getByTestId('input-equipo-externo').fill(`Rival E2E ${i + 1}`)

      await page.getByTestId('btn-inscribir-equipo').click()
      await expect(page.getByTestId('modal-agregar-equipo')).not.toBeVisible({ timeout: 10000 })
    }

    // Verify in DB
    const { data: inscriptos } = await supabase
      .from('torneo_equipos')
      .select('id, equipo_id, equipo_externo_nombre, categoria_id')
      .eq('torneo_id', torneoInternoId!)
      .eq('categoria_id', categoriaId!)
      .eq('activo', true)

    expect(inscriptos).toHaveLength(4)
    const propios = inscriptos!.filter((e) => e.equipo_id !== null)
    const externos = inscriptos!.filter((e) => e.equipo_externo_nombre !== null)
    expect(propios).toHaveLength(2)
    expect(externos).toHaveLength(2)

    for (const eq of inscriptos!) {
      equipoInscriptoIds.push(eq.id)
    }
  })

  test('persona sin permiso torneos.admin no puede crear torneo via RLS', async () => {
    const supabase = serviceRole()

    // Create persona without any admin/torneos attributes
    const { data: persona } = await supabase
      .from('personas')
      .insert({
        tenant_id: TENANT,
        nombre: 'E2E',
        apellido: 'SinPermiso',
        tipo_documento: 'dni',
        numero_documento: `SP${Date.now()}`,
      })
      .select('id')
      .single()

    expect(persona).not.toBeNull()

    // Verify: persona has NO admin or torneos attributes
    const { data: atrs } = await supabase
      .from('personas_atributos')
      .select('atributo_slug')
      .eq('persona_id', persona!.id)
      .in('atributo_slug', ['tenant.admin', 'torneos.admin', 'torneos.cargador'])
      .eq('activo', true)

    expect(atrs).toHaveLength(0)

    // Verify: inserting a torneo with service role works (control)
    const { data: torneo, error: errTorneo } = await supabase
      .from('torneos')
      .insert({
        tenant_id: TENANT,
        slug: `e2e-perm-test-${Date.now()}`,
        nombre: 'Permiso Test',
        tipo: 'interno',
        formato: 'liga',
      })
      .select('id')
      .single()

    expect(errTorneo).toBeNull()
    expect(torneo).not.toBeNull()

    // Cleanup
    if (torneo) await supabase.from('torneos').delete().eq('id', torneo.id)
    if (persona) await supabase.from('personas').delete().eq('id', persona.id)
  })
})

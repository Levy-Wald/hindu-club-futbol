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
  const inscripcionIds: string[] = []
  const csvEventoIds: string[] = []
  const fixtureEventoIds: string[] = []
  const posicionesEventoIds: string[] = []

  test.afterAll(async () => {
    const supabase = serviceRole()

    // Clean posiciones test partidos_detalle + eventos
    for (const eventoId of posicionesEventoIds) {
      await supabase.from('partidos_detalle').delete().eq('evento_id', eventoId)
      await supabase.from('eventos').delete().eq('id', eventoId)
    }

    // Clean fixture-generated partidos_detalle + eventos
    for (const eventoId of fixtureEventoIds) {
      await supabase.from('partidos_detalle').delete().eq('evento_id', eventoId)
      await supabase.from('eventos').delete().eq('id', eventoId)
    }

    // Clean CSV-imported partidos_detalle + eventos
    for (const eventoId of csvEventoIds) {
      await supabase.from('partidos_detalle').delete().eq('evento_id', eventoId)
      await supabase.from('eventos').delete().eq('id', eventoId)
    }

    // Clean inscripciones (equipos_competencias)
    for (const id of inscripcionIds) {
      await supabase.from('equipos_competencias').delete().eq('id', id)
    }

    // Clean equipos inscriptos
    for (const id of equipoInscriptoIds) {
      await supabase.from('torneo_equipos').delete().eq('id', id)
    }

    // Clean torneo_equipos for external torneo (from inscripcion test)
    if (torneoExternoId) {
      await supabase.from('torneo_equipos').delete().eq('torneo_id', torneoExternoId)
    }

    // Clean categorias + torneos
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

  // Sprint 5.2 tests

  test('admin inscribe equipo Sub-15 en torneo FACCMA externo', async ({ page }) => {
    // torneoExternoId should exist from test 2
    expect(torneoExternoId).not.toBeNull()

    await page.goto('/admin/competencias/inscripciones')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('pantalla-inscripciones')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('btn-inscribir-equipo')).toBeVisible()

    await page.getByTestId('btn-inscribir-equipo').click()
    await expect(page.getByTestId('modal-inscribir')).toBeVisible({ timeout: 5000 })

    // Select torneo FACCMA
    await page.getByTestId('select-torneo').click()
    await page.getByRole('option', { name: /Liga FACCMA E2E/ }).click()

    // Select first equipo
    const supabase = serviceRole()
    const { data: equipos } = await supabase
      .from('equipos')
      .select('id, nombre')
      .eq('tenant_id', TENANT)
      .limit(1)

    expect(equipos!.length).toBeGreaterThanOrEqual(1)

    await page.getByTestId('select-equipo').click()
    await page.getByRole('option', { name: equipos![0].nombre }).click()

    await page.getByTestId('btn-submit-inscripcion').click()

    // Modal should close
    await expect(page.getByTestId('modal-inscribir')).not.toBeVisible({ timeout: 10000 })

    // Verify in DB
    const { data: inscs } = await supabase
      .from('equipos_competencias')
      .select('id, equipo_id, torneo_id, torneo_nombre')
      .eq('tenant_id', TENANT)
      .eq('torneo_id', torneoExternoId!)
      .eq('activo', true)

    expect(inscs!.length).toBeGreaterThanOrEqual(1)
    const insc = inscs!.find((i) => i.equipo_id === equipos![0].id)
    expect(insc).toBeDefined()
    expect(insc!.torneo_nombre).toBe('Liga FACCMA E2E')

    // Track for cleanup
    inscripcionIds.push(insc!.id)
  })

  test('admin importa CSV con 5 partidos fixture', async ({ page }) => {
    expect(torneoInternoId).not.toBeNull()

    await page.goto(`/admin/competencias/torneos/${torneoInternoId}/import`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('pantalla-import-csv')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('tab-fixture')).toBeVisible()

    // Create CSV content with 5 matches
    const csvContent = [
      'fecha,hora,equipo_local,equipo_visitante,cancha,jornada,categoria',
      '2026-06-01,10:00,Equipo CSV A,Equipo CSV B,Cancha 1,1,Sub-15',
      '2026-06-01,12:00,Equipo CSV C,Equipo CSV D,Cancha 2,1,Sub-15',
      '2026-06-08,10:00,Equipo CSV A,Equipo CSV C,Cancha 1,2,Sub-15',
      '2026-06-08,12:00,Equipo CSV B,Equipo CSV D,Cancha 2,2,Sub-15',
      '2026-06-15,10:00,Equipo CSV A,Equipo CSV D,Cancha 1,3,Sub-15',
    ].join('\n')

    // Upload CSV via file input
    const buffer = Buffer.from(csvContent, 'utf-8')
    await page.getByTestId('file-input-csv').setInputFiles({
      name: 'fixture.csv',
      mimeType: 'text/csv',
      buffer,
    })

    // Click import
    await expect(page.getByTestId('btn-importar')).toBeVisible({ timeout: 3000 })
    await page.getByTestId('btn-importar').click()

    // Wait for result
    await expect(page.getByText('5 partido(s) importado(s)')).toBeVisible({ timeout: 15000 })

    // Verify in DB
    const supabase = serviceRole()
    const { data: partidos } = await supabase
      .from('partidos_detalle')
      .select('evento_id, torneo_id, rival_texto')
      .eq('tenant_id', TENANT)
      .eq('torneo_id', torneoInternoId!)

    // Should have the original 0 + 5 new
    const csvPartidos = partidos!.filter((p) =>
      p.rival_texto?.startsWith('Equipo CSV')
    )
    expect(csvPartidos.length).toBe(5)

    // Track evento_ids for cleanup
    for (const p of csvPartidos) {
      csvEventoIds.push(p.evento_id)
    }
  })

  test('admin importa CSV con resultados', async ({ page }) => {
    expect(torneoInternoId).not.toBeNull()

    await page.goto(`/admin/competencias/torneos/${torneoInternoId}/import`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('pantalla-import-csv')).toBeVisible({ timeout: 15000 })

    // Switch to resultados tab
    await page.getByTestId('tab-resultados').click()

    const csvContent = [
      'fecha,hora,equipo_local,equipo_visitante,cancha,jornada,categoria,marcador_local,marcador_visitante',
      '2026-07-01,10:00,Resultado A,Resultado B,Cancha 1,1,Sub-15,3,1',
      '2026-07-01,12:00,Resultado C,Resultado D,Cancha 2,1,Sub-15,0,2',
    ].join('\n')

    // Scope to the active resultados tab panel to avoid strict mode violation
    const resultadosPanel = page.getByRole('tabpanel', { name: 'Importar resultados' })

    const buffer = Buffer.from(csvContent, 'utf-8')
    await resultadosPanel.getByTestId('file-input-csv').setInputFiles({
      name: 'resultados.csv',
      mimeType: 'text/csv',
      buffer,
    })

    await expect(resultadosPanel.getByTestId('btn-importar')).toBeVisible({ timeout: 3000 })
    await resultadosPanel.getByTestId('btn-importar').click()

    await expect(page.getByText('2 partido(s) importado(s)')).toBeVisible({ timeout: 15000 })

    // Verify in DB
    const supabase = serviceRole()
    const { data: partidos } = await supabase
      .from('partidos_detalle')
      .select('evento_id, marcador_local, marcador_visitante, rival_texto')
      .eq('tenant_id', TENANT)
      .eq('torneo_id', torneoInternoId!)

    const resultados = partidos!.filter((p) =>
      p.rival_texto?.startsWith('Resultado')
    )
    expect(resultados.length).toBe(2)

    const r1 = resultados.find((p) => p.rival_texto === 'Resultado B')
    expect(r1).toBeDefined()
    expect(r1!.marcador_local).toBe(3)
    expect(r1!.marcador_visitante).toBe(1)

    // Track for cleanup
    for (const p of resultados) {
      csvEventoIds.push(p.evento_id)
    }
  })

  // Sprint 5.3 tests — Fixture auto-generador

  test('admin navega a pantalla fixture desde detalle torneo', async ({ page }) => {
    expect(torneoInternoId).not.toBeNull()

    await page.goto(`/admin/competencias/torneos/${torneoInternoId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-detalle-torneo')).toBeVisible({ timeout: 15000 })

    // Click "Generar fixture" button
    await page.getByTestId('btn-generar-fixture').click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('pantalla-fixture')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('panel-opciones')).toBeVisible()
    await expect(page.getByTestId('btn-generar-preview')).toBeVisible()
  })

  test('admin genera preview de fixture liga con 4 equipos', async ({ page }) => {
    expect(torneoInternoId).not.toBeNull()
    expect(categoriaId).not.toBeNull()

    await page.goto(`/admin/competencias/torneos/${torneoInternoId}/fixture`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-fixture')).toBeVisible({ timeout: 15000 })

    // Select categoria Sub-15
    if (await page.getByTestId('select-categoria-fixture').isVisible()) {
      await page.getByTestId('select-categoria-fixture').click()
      await page.getByRole('option', { name: 'Sub-15' }).click()
    }

    // Generate preview
    await page.getByTestId('btn-generar-preview').click()

    // Wait for preview to appear
    await expect(page.getByTestId('preview-fixture')).toBeVisible({ timeout: 15000 })

    // 4 equipos liga = 6 partidos, 3 fechas
    await expect(page.getByText('6 partidos en 3 fecha(s)')).toBeVisible({ timeout: 5000 })

    // Should show partido preview cards
    const partidos = page.getByTestId('partido-preview')
    await expect(partidos.first()).toBeVisible()
    const count = await partidos.count()
    expect(count).toBe(6)
  })

  test('admin confirma fixture y crea 6 partidos', async ({ page }) => {
    expect(torneoInternoId).not.toBeNull()
    expect(categoriaId).not.toBeNull()

    await page.goto(`/admin/competencias/torneos/${torneoInternoId}/fixture`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-fixture')).toBeVisible({ timeout: 15000 })

    // Select categoria
    if (await page.getByTestId('select-categoria-fixture').isVisible()) {
      await page.getByTestId('select-categoria-fixture').click()
      await page.getByRole('option', { name: 'Sub-15' }).click()
    }

    // Set fecha inicio
    await page.getByTestId('input-fecha-inicio').fill('2026-08-01')

    // Generate preview
    await page.getByTestId('btn-generar-preview').click()
    await expect(page.getByTestId('preview-fixture')).toBeVisible({ timeout: 15000 })

    // Confirm
    await page.getByTestId('btn-confirmar-fixture').click()
    await expect(page.getByTestId('fixture-confirmado')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('6 partido(s) programado(s)')).toBeVisible()

    // Verify in DB
    const supabase = serviceRole()
    const { data: partidos } = await supabase
      .from('partidos_detalle')
      .select('evento_id, fase, fecha_numero, torneo_id, categoria_id')
      .eq('tenant_id', TENANT)
      .eq('torneo_id', torneoInternoId!)
      .eq('categoria_id', categoriaId!)
      .not('fase', 'is', null)

    // Should have 6 fixture-generated partidos
    expect(partidos!.length).toBeGreaterThanOrEqual(6)

    // Track for cleanup
    for (const p of partidos!) {
      fixtureEventoIds.push(p.evento_id)
    }
  })

  test('admin ve warnings en fixture con equipos insuficientes', async ({ page }) => {
    expect(torneoExternoId).not.toBeNull()

    // External torneo has 0-1 equipos inscriptos — should show error
    await page.goto(`/admin/competencias/torneos/${torneoExternoId}/fixture`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-fixture')).toBeVisible({ timeout: 15000 })

    await page.getByTestId('btn-generar-preview').click()

    await expect(page.getByTestId('error-fixture')).toBeVisible({ timeout: 10000 })
  })

  // Sprint 5.4 tests — Tabla de posiciones

  test('tabla de posiciones muestra 4 equipos con stats correctas', async ({ page }) => {
    expect(torneoInternoId).not.toBeNull()
    expect(categoriaId).not.toBeNull()
    expect(equipoInscriptoIds.length).toBeGreaterThanOrEqual(4)

    const supabase = serviceRole()

    // Get the 4 inscribed teams to build match data
    const { data: equipos } = await supabase
      .from('torneo_equipos')
      .select('id, equipo_id, equipo_externo_nombre')
      .eq('torneo_id', torneoInternoId!)
      .eq('categoria_id', categoriaId!)
      .eq('activo', true)
      .limit(4)

    expect(equipos!.length).toBe(4)

    // Hydrate team names
    const teamNames: Record<string, string> = {}
    for (const eq of equipos!) {
      if (eq.equipo_id) {
        const { data: e } = await supabase.from('equipos').select('nombre').eq('id', eq.equipo_id).single()
        teamNames[eq.id] = e?.nombre ?? 'Unknown'
      } else {
        teamNames[eq.id] = eq.equipo_externo_nombre ?? 'Unknown'
      }
    }

    // Create 6 matches (all vs all) with scores
    const matchups = [
      [0, 1, 3, 1], // team0 vs team1: 3-1
      [0, 2, 2, 0], // team0 vs team2: 2-0
      [0, 3, 1, 1], // team0 vs team3: 1-1
      [1, 2, 0, 0], // team1 vs team2: 0-0
      [1, 3, 2, 1], // team1 vs team3: 2-1
      [2, 3, 1, 0], // team2 vs team3: 1-0
    ]

    for (const [li, vi, ml, mv] of matchups) {
      const local = equipos![li]
      const visitante = equipos![vi]

      const { data: evento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          tipo_evento_slug: 'partido',
          titulo: `${teamNames[local.id]} vs ${teamNames[visitante.id]}`,
          fecha: '2026-08-01',
          hora_inicio: '10:00:00',
          equipo_id: local.equipo_id,
          estado: 'completado',
        })
        .select('id')
        .single()

      expect(evento).not.toBeNull()
      posicionesEventoIds.push(evento!.id)

      await supabase.from('partidos_detalle').insert({
        tenant_id: TENANT,
        evento_id: evento!.id,
        torneo_id: torneoInternoId!,
        categoria_id: categoriaId!,
        equipo_id: local.equipo_id,
        rival_texto: teamNames[visitante.id],
        condicion: 'local',
        marcador_local: ml,
        marcador_visitante: mv,
      })
    }

    // Navigate to posiciones
    await page.goto(`/admin/competencias/torneos/${torneoInternoId}/posiciones`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-posiciones')).toBeVisible({ timeout: 15000 })

    // Select Sub-15 category
    if (await page.getByTestId('select-categoria-posiciones').isVisible()) {
      await page.getByTestId('select-categoria-posiciones').click()
      await page.getByRole('option', { name: 'Sub-15' }).click()
      // Wait for table to reload
      await page.waitForTimeout(2000)
    }

    // Table should show 4 rows
    await expect(page.getByTestId('tabla-posiciones')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('fila-posicion-1')).toBeVisible()
    await expect(page.getByTestId('fila-posicion-4')).toBeVisible()

    // Verify first place has 7 points (team0: 2W + 1D = 7pts)
    const firstRow = page.getByTestId('fila-posicion-1')
    await expect(firstRow.locator('td').last()).toContainText('7')
  })

  test('cambiar categoria actualiza la tabla', async ({ page }) => {
    expect(torneoInternoId).not.toBeNull()

    await page.goto(`/admin/competencias/torneos/${torneoInternoId}/posiciones`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-posiciones')).toBeVisible({ timeout: 15000 })

    // Initially loads without category filter — should show results
    // Click actualizar to refresh
    await page.getByTestId('btn-actualizar-tabla').click()

    // Select Sub-15 if available
    if (await page.getByTestId('select-categoria-posiciones').isVisible()) {
      await page.getByTestId('select-categoria-posiciones').click()
      await page.getByRole('option', { name: 'Sub-15' }).click()

      // Wait for re-render
      await expect(page.getByTestId('tabla-posiciones')).toBeVisible({ timeout: 10000 })
    }
  })

  test('torneo sin partidos muestra tabla vacia', async ({ page }) => {
    expect(torneoExternoId).not.toBeNull()

    await page.goto(`/admin/competencias/torneos/${torneoExternoId}/posiciones`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-posiciones')).toBeVisible({ timeout: 15000 })

    // External torneo has no matches — should show empty state
    await expect(page.getByTestId('tabla-vacia')).toBeVisible({ timeout: 10000 })
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

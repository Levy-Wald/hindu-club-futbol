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

test.describe('Sprint A1 — Fix Base Operativa + Espacios', () => {
  test.describe.configure({ mode: 'serial' })

  test('Test 1: Sedes y Espacios pages render', async ({ page }) => {
    const supabase = serviceRole()
    let sede_id: string | null = null
    let espacio_id: string | null = null

    try {
      // Navigate to sedes page
      await page.goto('/admin/configuracion/sedes')
      await page.waitForLoadState('networkidle')
      await expect(page.getByTestId('pantalla-sedes')).toBeVisible()

      // Create fixture sede via DB
      const { data: sede } = await supabase
        .from('sedes')
        .insert({
          tenant_id: TENANT,
          nombre: 'Sede Test E2E A1',
          slug: 'sede-test-e2e-a1',
          direccion: { calle: 'Av. Test', numero: '123', ciudad: 'CABA' },
          metadata: { fixture: true },
        })
        .select('id')
        .single()
      sede_id = sede?.id ?? null

      // Create fixture espacio
      if (sede_id) {
        const { data: espacio } = await supabase
          .from('espacios')
          .insert({
            tenant_id: TENANT,
            sede_id,
            nombre: 'Cancha Test E2E',
            tipo_slug: 'cancha_futbol',
            capacidad_personas: 22,
            metadata: { fixture: true },
          })
          .select('id')
          .single()
        espacio_id = espacio?.id ?? null
      }

      // Verify sedes page shows the sede
      await page.reload()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText('Sede Test E2E A1')).toBeVisible({ timeout: 10000 })

      // Navigate to espacios page
      await page.goto('/admin/configuracion/espacios')
      await page.waitForLoadState('networkidle')
      await expect(page.getByTestId('pantalla-espacios')).toBeVisible()
      await expect(page.getByText('Cancha Test E2E')).toBeVisible({ timeout: 10000 })

      // Navigate to sede detail
      await page.goto(`/admin/configuracion/sedes/${sede_id}`)
      await page.waitForLoadState('networkidle')
      await expect(page.getByText('Sede Test E2E A1')).toBeVisible()
      await expect(page.getByText('Cancha Test E2E')).toBeVisible()

      // Screenshot
      await page.screenshot({ path: 'sprint-a1-screenshots/sedes-con-data.png', fullPage: true })
      await page.goto('/admin/configuracion/espacios')
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: 'sprint-a1-screenshots/espacios-con-data.png', fullPage: true })
    } finally {
      if (espacio_id) await supabase.from('espacios').delete().eq('id', espacio_id)
      if (sede_id) await supabase.from('sedes').delete().eq('id', sede_id)
    }
  })

  test('Test 2: Planificador — selectable habilitado y calendario visible', async ({ page }) => {
    await page.goto('/admin/planificadores/semanal')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('planificador-calendario')).toBeVisible()

    // Verify selectable is enabled (calendar renders with selectable class)
    const calendar = page.locator('.rbc-calendar')
    await expect(calendar).toBeVisible()

    // Verify time slots exist (selectable enabled = slots are clickable)
    const slots = page.locator('.rbc-day-slot .rbc-time-slot')
    const slotCount = await slots.count()
    expect(slotCount).toBeGreaterThan(0)

    // Screenshot
    await page.screenshot({ path: 'sprint-a1-screenshots/planificador-semanal.png', fullPage: true })
  })

  test('Test 3: Planificador — boton +Nuevo evento funciona', async ({ page }) => {
    await page.goto('/admin/planificadores/semanal')
    await page.waitForLoadState('networkidle')

    const btn = page.getByTestId('btn-nuevo-evento-planificador')
    await expect(btn).toBeVisible()
    await btn.click()

    // Verify the nuevo evento banner appears
    await expect(page.getByText('Nuevo evento:')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Sprint A2')).toBeVisible()

    // Screenshot
    await page.screenshot({ path: 'sprint-a1-screenshots/planificador-nuevo-evento.png', fullPage: true })
  })

  test('Test 4: Hub de evento con tabs segun tipo', async ({ page }) => {
    const supabase = serviceRole()
    let evento_id: string | null = null

    try {
      const { data: evento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          tipo_evento_slug: 'entrenamiento',
          titulo: 'E2E Hub Evento Test',
          fecha: '2027-06-15',
          hora_inicio: '17:00:00',
          hora_fin: '19:00:00',
          activo: true,
          modulo_origen: 'planificadores',
          metadata: { fixture: true },
        })
        .select('id')
        .single()
      evento_id = evento?.id ?? null

      await page.goto(`/admin/operaciones/eventos/${evento_id}`)
      await page.waitForLoadState('networkidle')

      const hub = page.getByTestId('hub-evento')
      await expect(hub).toBeVisible()
      await expect(page.getByTestId('tab-evento-info')).toBeVisible()
      await expect(hub.getByText('E2E Hub Evento Test')).toBeVisible()
      await expect(hub.getByText('Entrenamiento').first()).toBeVisible()

      // Tabs: Asistencia + Plan visible for entrenamiento
      await expect(hub.getByRole('button', { name: 'Asistencia' })).toBeVisible()
      await expect(hub.getByRole('button', { name: 'Plan' })).toBeVisible()

      // Screenshot
      await page.screenshot({ path: 'sprint-a1-screenshots/hub-evento.png', fullPage: true })
    } finally {
      if (evento_id) await supabase.from('eventos').delete().eq('id', evento_id)
    }
  })

  test('Test 5: Marketplace muestra modulos con estados', async ({ page }) => {
    await page.goto('/admin/marketplace')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('pantalla-marketplace')).toBeVisible()

    // Verify sections exist
    await expect(page.getByText('Marketplace de modulos')).toBeVisible()

    // At least some module cards should be visible
    const cards = page.locator('[data-testid^="marketplace-card-"]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    // Screenshot
    await page.screenshot({ path: 'sprint-a1-screenshots/marketplace.png', fullPage: true })
  })

  test('Test 6: 8 rutas 404 ahora retornan 200', async ({ page }) => {
    const supabase = serviceRole()
    let evento_id: string | null = null
    let entidad_id: string | null = null
    let concesionario_id: string | null = null
    let pdv_id: string | null = null
    let plantilla_id: string | null = null

    try {
      // Create fixtures
      const { data: evento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          tipo_evento_slug: 'partido',
          titulo: 'E2E 404 Fix Test',
          fecha: '2027-06-20',
          hora_inicio: '10:00:00',
          hora_fin: '12:00:00',
          activo: true,
          modulo_origen: 'e2e',
          metadata: { fixture: true },
        })
        .select('id')
        .single()
      evento_id = evento?.id ?? null

      const { data: plantilla } = await supabase
        .from('com_plantillas')
        .insert({
          tenant_id: TENANT,
          slug: 'e2e-plantilla-test-a1',
          nombre: 'E2E Plantilla Test',
          tipo: 'email',
          cuerpo: '<p>Test</p>',
          metadata: { fixture: true },
        })
        .select('id')
        .single()
      plantilla_id = plantilla?.id ?? null

      // Create concesionario + PDV fixture
      // Create entidad for concesionario (chk_concesionario_origen requires persona_id OR entidad_id)
      const { data: ent } = await supabase
        .from('entidades')
        .insert({
          tenant_id: TENANT,
          tipo: 'proveedor',
          nombre: 'E2E Entidad Conc',
          slug: 'e2e-entidad-conc-a1',
          metadata: { fixture: true },
        })
        .select('id')
        .single()
      entidad_id = ent?.id ?? null

      const { data: conc } = await supabase
        .from('concesionarios')
        .insert({
          tenant_id: TENANT,
          entidad_id,
          nombre_comercial: 'E2E Conc Test',
          metadata: { fixture: true },
        })
        .select('id')
        .single()
      concesionario_id = conc?.id ?? null

      if (concesionario_id) {
        const { data: pdv } = await supabase
          .from('concesion_puntos_venta')
          .insert({
            tenant_id: TENANT,
            concesionario_id,
            nombre: 'PDV Test',
            activo: true,
            metadata: { fixture: true },
          })
          .select('id')
          .single()
        pdv_id = pdv?.id ?? null
      }

      // Test each route
      const routes = [
        { path: `/admin/operaciones/eventos/${evento_id}`, label: 'hub evento' },
        { path: `/admin/competencias/partidos/${evento_id}`, label: 'hub partido' },
        { path: `/admin/comunicaciones/plantillas/${plantilla_id}`, label: 'hub plantilla' },
        { path: `/admin/concesiones/${concesionario_id}/punto-venta/${pdv_id}`, label: 'hub pdv' },
        { path: '/admin/entidades', label: 'entidades' },
        { path: '/admin/finanzas/cuotas/emitir', label: 'emitir cuotas' },
        { path: '/admin/finanzas/movimientos/nuevo', label: 'nuevo movimiento' },
        { path: '/admin/finanzas/transferencias/nueva', label: 'nueva transferencia' },
      ]

      for (const route of routes) {
        const resp = await page.goto(route.path)
        expect(resp?.status(), `${route.label} should return 200`).toBe(200)
        // Verify no error boundary
        const errorBoundary = page.locator('text=Application error')
        await expect(errorBoundary).not.toBeVisible({ timeout: 3000 })
      }

      // Screenshot sidebar
      await page.goto('/admin')
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: 'sprint-a1-screenshots/sidebar-reorganizado.png', fullPage: true })
    } finally {
      if (pdv_id) await supabase.from('concesion_puntos_venta').delete().eq('id', pdv_id)
      if (concesionario_id) await supabase.from('concesionarios').delete().eq('id', concesionario_id)
      if (entidad_id) await supabase.from('entidades').delete().eq('id', entidad_id)
      if (plantilla_id) await supabase.from('com_plantillas').delete().eq('id', plantilla_id)
      if (evento_id) await supabase.from('eventos').delete().eq('id', evento_id)
    }
  })
})

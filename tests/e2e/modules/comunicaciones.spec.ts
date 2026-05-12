import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

function serviceRole() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

test.describe('Comunicaciones', () => {
  test('page loads with tabs', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.getByRole('main').getByTestId('comunicaciones-page')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('main').getByTestId('tab-plantillas')).toBeVisible()
    await expect(page.getByRole('main').getByTestId('tab-envios')).toBeVisible()
    await expect(page.getByRole('main').getByTestId('tab-envios-masivos')).toBeVisible()
  })

  test('plantillas tab shows seed rows', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.getByRole('main').getByTestId('panel-plantillas')).toBeVisible({ timeout: 10000 })
    // At least 18 seed rows (may be more if other tests created plantillas in parallel)
    const rows = page.locator('[data-testid="plantillas-row"]')
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(18)
  })

  test('envios tab is accessible', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await page.getByRole('main').getByTestId('tab-envios').click()
    await expect(page.getByRole('main').getByTestId('panel-envios')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('main').getByTestId('envios-section')).toBeVisible()
  })

  test('crear plantilla nueva', async ({ page }) => {
    const ts = Date.now()
    await page.goto('/admin/comunicaciones/plantillas/nueva')
    await expect(page.getByTestId('plantilla-editor')).toBeVisible({ timeout: 15000 })

    await page.getByTestId('input-nombre').fill(`Test E2E ${ts}`)
    await page.getByTestId('input-cuerpo').fill(`Hola {{nombre}}, evento {{evento}} a las {{hora}}.`)

    await page.getByTestId('btn-guardar').click()
    await expect(page.getByRole('main').getByTestId('comunicaciones-page')).toBeVisible({ timeout: 15000 })

    // Verify the new plantilla appears in the list
    await expect(page.getByText(`Test E2E ${ts}`)).toBeVisible({ timeout: 10000 })
  })

  test('editar plantilla existente', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.locator('[data-testid="plantillas-row"]').first()).toBeVisible({ timeout: 10000 })

    // Click edit on first row
    await page.locator('[data-testid="plantillas-row"]').first().getByRole('button').click()
    await page.getByRole('menuitem', { name: /editar/i }).click()
    await expect(page.getByTestId('plantilla-editor')).toBeVisible({ timeout: 10000 })

    // System plantilla should show badge
    await expect(page.getByTestId('badge-sistema')).toBeVisible()

    // Slug should be disabled for existing
    await expect(page.getByTestId('input-slug')).toBeDisabled()
  })

  test('proteccion plantilla sistema: no eliminar', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.locator('[data-testid="plantillas-row"]').first()).toBeVisible({ timeout: 10000 })

    // Click on first sistema plantilla
    await page.locator('[data-testid="plantillas-row"]').first().getByRole('button').click()
    await page.getByRole('menuitem', { name: /editar/i }).click()
    await expect(page.getByTestId('plantilla-editor')).toBeVisible({ timeout: 10000 })

    // Eliminar button should be disabled for sistema
    await expect(page.getByTestId('btn-eliminar')).toBeDisabled()
  })

  test('soft-delete plantilla user-created', async ({ page }) => {
    // Create a plantilla to delete
    const ts = Date.now()
    await page.goto('/admin/comunicaciones/plantillas/nueva')
    await expect(page.getByTestId('plantilla-editor')).toBeVisible({ timeout: 15000 })

    await page.getByTestId('input-nombre').fill(`Borrable ${ts}`)
    await page.getByTestId('input-cuerpo').fill('Contenido temporal.')
    await page.getByTestId('btn-guardar').click()
    await expect(page.getByRole('main').getByTestId('comunicaciones-page')).toBeVisible({ timeout: 15000 })

    // Count rows before delete
    const countBefore = await page.locator('[data-testid="plantillas-row"]').count()

    // Find the new plantilla row and open its dropdown
    const row = page.locator('[data-testid="plantillas-row"]', { hasText: `Borrable ${ts}` })
    await expect(row).toBeVisible({ timeout: 10000 })
    await row.getByRole('button').click()
    await page.getByRole('menuitem', { name: /eliminar/i }).click()

    // Wait for deletion and verify count decreased
    await expect(page.locator('[data-testid="plantillas-row"]')).toHaveCount(countBefore - 1, { timeout: 10000 })
  })

  // === Envíos masivos (FASE 2.3) ===

  test('wizard envio masivo carga correctamente', async ({ page }) => {
    await page.goto('/admin/comunicaciones/envios-masivos/nuevo')
    await expect(page.getByTestId('envio-masivo-wizard')).toBeVisible({ timeout: 15000 })

    // Verify all sections exist
    await expect(page.getByTestId('select-plantilla-trigger')).toBeVisible()
    await expect(page.getByTestId('select-segmento')).toBeVisible()

    // Default segmento is "todos_activos", preview should load
    await expect(page.getByTestId('preview-conteo')).toContainText(/\d+ destinatarios/, { timeout: 15000 })
  })

  test('envio masivo a equipo muestra preview', async ({ page }) => {
    await page.goto('/admin/comunicaciones/envios-masivos/nuevo')
    await expect(page.getByTestId('envio-masivo-wizard')).toBeVisible({ timeout: 15000 })

    // Switch to equipo
    await page.getByTestId('select-segmento').click()
    await page.getByRole('option', { name: /equipo/i }).click()

    // Should show equipo selector
    await expect(page.getByTestId('select-equipo')).toBeVisible()

    // Select first equipo
    await page.getByTestId('select-equipo').click()
    await page.getByRole('option').first().click()

    // Preview should load
    await expect(page.getByTestId('preview-conteo')).toContainText(/\d+ destinatarios/, { timeout: 15000 })
  })

  test('envio masivo ejecuta y redirige a detalle', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/admin/comunicaciones/envios-masivos/nuevo')
    await expect(page.getByTestId('envio-masivo-wizard')).toBeVisible({ timeout: 15000 })

    // Select plantilla (first one)
    await page.getByTestId('select-plantilla-trigger').click()
    await page.getByRole('option').first().click()

    // Switch segmento to equipo (smaller set, faster)
    await page.getByTestId('select-segmento').click()
    await page.getByRole('option', { name: /equipo/i }).click()
    await page.getByTestId('select-equipo').click()
    await page.getByRole('option').first().click()

    // Wait for preview
    await expect(page.getByTestId('preview-conteo')).toContainText(/\d+ destinatarios/, { timeout: 15000 })

    // Click enviar
    await page.getByTestId('btn-enviar-masivo').click()

    // Confirm dialog
    await page.getByTestId('btn-confirmar-envio').click()

    // Should redirect to lote detail
    await expect(page).toHaveURL(/\/envios-masivos\/[0-9a-f-]{36}/, { timeout: 30000 })
    await expect(page.getByTestId('lote-detalle')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('envio-row').first()).toBeVisible({ timeout: 10000 })
  })

  test('tab envios masivos es accesible', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await page.getByRole('main').getByTestId('tab-envios-masivos').click()
    await expect(page.getByRole('main').getByTestId('panel-envios-masivos')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('lotes-section')).toBeVisible()
    await expect(page.getByTestId('btn-nuevo-envio-masivo')).toBeVisible()
  })

  // === Automatizaciones (FASE 2.4) ===

  test('tab automatizaciones es accesible', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await page.getByRole('main').getByTestId('tab-automatizaciones').click()
    await expect(page.getByRole('main').getByTestId('panel-automatizaciones')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('jobs-log-section')).toBeVisible()
  })

  test('page loads with 4 tabs including automatizaciones', async ({ page }) => {
    await page.goto('/admin/comunicaciones')
    await expect(page.getByRole('main').getByTestId('comunicaciones-page')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('main').getByTestId('tab-plantillas')).toBeVisible()
    await expect(page.getByRole('main').getByTestId('tab-envios')).toBeVisible()
    await expect(page.getByRole('main').getByTestId('tab-envios-masivos')).toBeVisible()
    await expect(page.getByRole('main').getByTestId('tab-automatizaciones')).toBeVisible()
  })

  test('cron apto-vence-7d responde 401 sin auth', async ({ request }) => {
    const response = await request.get('/api/cron/apto-vence-7d')
    expect(response.status()).toBe(401)
  })

  test('cron cuota-vence-7d responde 401 sin auth', async ({ request }) => {
    const response = await request.get('/api/cron/cuota-vence-7d')
    expect(response.status()).toBe(401)
  })

  test('trigger apto_vence_7d end-to-end: fixture → ejecutar → job_log + envío correcto', async ({ page }) => {
    test.setTimeout(60000)
    const TENANT = '11111111-1111-1111-1111-111111111111'
    const PERSONA_E2E = '99999999-9999-9999-9999-999999999999'
    const supabase = serviceRole()

    let fixtureId: string | null = null
    let atributoId: string | null = null
    const jobLogIds: string[] = []

    try {
      // PRE-CLEANUP: remove any leftover dedup envíos from parallel test runs
      await supabase.from('com_envios').delete().eq('persona_id', PERSONA_E2E).eq('origen_modulo_slug', 'apto_vence_7d')

      // SETUP: dar permiso comunicaciones.admin temporal al E2E user
      const { data: attr } = await supabase
        .from('personas_atributos')
        .insert({
          tenant_id: TENANT,
          persona_id: PERSONA_E2E,
          atributo_slug: 'comunicaciones.admin',
          activo: true,
        })
        .select('id')
        .single()
      atributoId = attr?.id ?? null

      // SETUP: insertar autorización apto_fisico que vence en 5 días (dentro de ventana 7d)
      const fechaTarget = new Date()
      fechaTarget.setDate(fechaTarget.getDate() + 5)
      const fechaStr = fechaTarget.toISOString().slice(0, 10)

      const { data: fix, error: fixErr } = await supabase
        .from('personas_autorizaciones')
        .insert({
          tenant_id: TENANT,
          persona_id: PERSONA_E2E,
          tipo_autorizacion_slug: 'apto_fisico',
          estado: 'firmada',
          activo: true,
          fecha_vencimiento: fechaStr,
        })
        .select('id')
        .single()

      expect(fixErr).toBeNull()
      fixtureId = fix!.id

      // ACTION: navegar a automatizaciones y ejecutar trigger
      await page.goto('/admin/comunicaciones')
      await page.getByTestId('tab-automatizaciones').click()
      await expect(page.getByTestId('jobs-log-section')).toBeVisible({ timeout: 10000 })
      await page.getByTestId('ejecutar-apto_vence_7d').click()

      // Esperar toast de resultado
      await expect(page.getByTestId('job-log-toast')).toBeVisible({ timeout: 20000 })

      // ASSERT 1: com_jobs_log tiene 1 row del trigger
      const { data: jobs } = await supabase
        .from('com_jobs_log')
        .select('*')
        .eq('tenant_id', TENANT)
        .eq('job_slug', 'apto_vence_7d')
        .order('started_at', { ascending: false })
        .limit(1)

      expect(jobs).toHaveLength(1)
      expect(jobs![0].status).toBe('completed')
      expect(jobs![0].personas_encontradas).toBeGreaterThanOrEqual(1)
      expect(jobs![0].personas_notificadas).toBeGreaterThanOrEqual(1)
      jobLogIds.push(jobs![0].id)

      // ASSERT 2: com_envios tiene al menos 1 row con origen_modulo_slug correcto
      const { data: envios } = await supabase
        .from('com_envios')
        .select('canal, origen_modulo_slug, origen_entidad_id, persona_id')
        .eq('tenant_id', TENANT)
        .eq('origen_entidad_id', jobs![0].id)

      expect(envios!.length).toBeGreaterThanOrEqual(1)
      expect(envios!.every(e => e.origen_modulo_slug === 'apto_vence_7d')).toBe(true)
      expect(envios!.some(e => e.persona_id === PERSONA_E2E)).toBe(true)

    } finally {
      // CLEANUP: siempre, aunque falle
      for (const jid of jobLogIds) {
        await supabase.from('com_envios').delete().eq('origen_entidad_id', jid)
        await supabase.from('com_jobs_log').delete().eq('id', jid)
      }
      if (fixtureId) {
        await supabase.from('personas_autorizaciones').delete().eq('id', fixtureId)
      }
      if (atributoId) {
        await supabase.from('personas_atributos').delete().eq('id', atributoId)
      }
    }
  })

  // === Preferencias de comunicacion (FASE 2.5) ===

  test('preferencias: transaccional ignora opt-out (apto vence se envia aunque opt_in=false)', async ({ page }) => {
    test.setTimeout(60000)
    const TENANT = '11111111-1111-1111-1111-111111111111'
    const PERSONA_E2E = '99999999-9999-9999-9999-999999999999'
    const supabase = serviceRole()

    let prefId: string | null = null
    let fixtureId: string | null = null
    let atributoId: string | null = null
    const jobLogIds: string[] = []

    try {
      // PRE-CLEANUP: remove any leftover dedup envíos from parallel test runs
      await supabase.from('com_envios').delete().eq('persona_id', PERSONA_E2E).eq('origen_modulo_slug', 'apto_vence_7d')

      // SETUP: permiso comunicaciones.admin
      const { data: attr } = await supabase
        .from('personas_atributos')
        .insert({ tenant_id: TENANT, persona_id: PERSONA_E2E, atributo_slug: 'comunicaciones.admin', activo: true })
        .select('id')
        .single()
      atributoId = attr?.id ?? null

      // SETUP: preferencias con todos los opt-in en false
      const { data: pref } = await supabase
        .from('personas_preferencias_comunicacion')
        .insert({
          tenant_id: TENANT,
          persona_id: PERSONA_E2E,
          opt_in_marketing: false,
          opt_in_eventos_club: false,
          opt_in_partners: false,
          opt_in_torneos: false,
        })
        .select('id')
        .single()
      prefId = pref?.id ?? null

      // SETUP: apto fisico que vence en 5 dias
      const fechaTarget = new Date()
      fechaTarget.setDate(fechaTarget.getDate() + 5)
      const { data: fix } = await supabase
        .from('personas_autorizaciones')
        .insert({
          tenant_id: TENANT,
          persona_id: PERSONA_E2E,
          tipo_autorizacion_slug: 'apto_fisico',
          estado: 'firmada',
          activo: true,
          fecha_vencimiento: fechaTarget.toISOString().slice(0, 10),
        })
        .select('id')
        .single()
      fixtureId = fix?.id ?? null

      // ACTION: ejecutar trigger transaccional
      await page.goto('/admin/comunicaciones')
      await page.getByTestId('tab-automatizaciones').click()
      await expect(page.getByTestId('jobs-log-section')).toBeVisible({ timeout: 10000 })
      await page.getByTestId('ejecutar-apto_vence_7d').click()
      await expect(page.getByTestId('job-log-toast')).toBeVisible({ timeout: 20000 })

      // ASSERT: persona DEBE recibir aunque tenga todos los opt-in en false (transaccional)
      const { data: jobs } = await supabase
        .from('com_jobs_log')
        .select('*')
        .eq('tenant_id', TENANT)
        .eq('job_slug', 'apto_vence_7d')
        .order('started_at', { ascending: false })
        .limit(1)

      expect(jobs).toHaveLength(1)
      expect(jobs![0].status).toBe('completed')
      expect(jobs![0].personas_encontradas).toBeGreaterThanOrEqual(1)
      expect(jobs![0].personas_notificadas).toBeGreaterThanOrEqual(1)
      jobLogIds.push(jobs![0].id)

    } finally {
      for (const jid of jobLogIds) {
        await supabase.from('com_envios').delete().eq('origen_entidad_id', jid)
        await supabase.from('com_jobs_log').delete().eq('id', jid)
      }
      if (fixtureId) await supabase.from('personas_autorizaciones').delete().eq('id', fixtureId)
      if (prefId) await supabase.from('personas_preferencias_comunicacion').delete().eq('id', prefId)
      if (atributoId) await supabase.from('personas_atributos').delete().eq('id', atributoId)
    }
  })

  test('preferencias: UI guarda y muestra preferencias en ficha persona', async ({ page }) => {
    const TENANT = '11111111-1111-1111-1111-111111111111'
    const PERSONA_E2E = '99999999-9999-9999-9999-999999999999'
    const supabase = serviceRole()

    try {
      // Navigate to persona detail, comunicaciones tab
      await page.goto(`/admin/personas/${PERSONA_E2E}?tab=comunicaciones`)
      await expect(page.getByTestId('preferencias-comunicacion-form')).toBeVisible({ timeout: 15000 })

      // Toggle marketing ON
      await page.getByTestId('pref-opt-marketing').click()

      // Save
      await page.getByTestId('pref-btn-guardar').click()

      // Wait for success toast
      await expect(page.getByText('Preferencias guardadas')).toBeVisible({ timeout: 10000 })

      // Verify in DB
      const { data: pref } = await supabase
        .from('personas_preferencias_comunicacion')
        .select('opt_in_marketing')
        .eq('tenant_id', TENANT)
        .eq('persona_id', PERSONA_E2E)
        .maybeSingle()

      expect(pref).not.toBeNull()
      expect(pref!.opt_in_marketing).toBe(true)

    } finally {
      // Cleanup
      await supabase.from('personas_preferencias_comunicacion').delete().eq('persona_id', PERSONA_E2E)
    }
  })
})

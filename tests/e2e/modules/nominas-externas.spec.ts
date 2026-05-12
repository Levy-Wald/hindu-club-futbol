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

test.describe('Nóminas externas', () => {
  test.describe.configure({ mode: 'serial' })

  let nominaId: string | null = null
  let nominaToken: string | null = null
  let eventoId: string | null = null
  let createdPersonaIds: string[] = []
  let createdEntidadIds: string[] = []

  test.afterAll(async () => {
    const supabase = serviceRole()

    // Cleanup items
    if (nominaId) {
      await supabase.from('nomina_externa_items').delete().eq('nomina_externa_id', nominaId)
      await supabase.from('nominas_externas').delete().eq('id', nominaId)
    }

    // Cleanup personas creadas
    for (const pid of createdPersonaIds) {
      await supabase.from('personas_padrones').delete().eq('persona_id', pid).eq('tenant_id', TENANT)
      await supabase.from('personas').delete().eq('id', pid)
    }

    // Cleanup entidades creadas
    for (const eid of createdEntidadIds) {
      await supabase.from('entidades').delete().eq('id', eid)
    }

    // Cleanup evento
    if (eventoId) {
      await supabase.from('eventos').delete().eq('id', eventoId)
    }
  })

  test('flujo completo: generar link, submit público, confirmar admin', async ({ page }) => {
    const supabase = serviceRole()

    // Fixture: crear evento futuro
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    const fechaStr = manana.toISOString().slice(0, 10)

    const { data: evento } = await supabase
      .from('eventos')
      .insert({
        tenant_id: TENANT,
        tipo_evento_slug: 'entrenamiento',
        titulo: 'E2E Nómina Externa Test',
        fecha: fechaStr,
        hora_inicio: '18:00:00',
        modulo_origen: 'nominas_externas',
      })
      .select('id')
      .single()
    eventoId = evento!.id

    // Fixture: crear nómina directamente en DB (simula admin action)
    const crypto = await import('crypto')
    const token = crypto.randomBytes(32).toString('base64url')

    const caducaAt = new Date()
    caducaAt.setDate(caducaAt.getDate() + 2)

    const { data: nomina } = await supabase
      .from('nominas_externas')
      .insert({
        tenant_id: TENANT,
        token,
        evento_id: eventoId,
        campos_solicitados: ['nombre', 'apellido', 'dni', 'rol'],
        nivel_validacion: 'L0',
        caduca_at: caducaAt.toISOString(),
        estado: 'pendiente',
        max_submissions: 3,
      })
      .select('id, token')
      .single()

    nominaId = nomina!.id
    nominaToken = nomina!.token

    // 1. Navegar al form público
    await page.goto(`/nomina/${nominaToken}`)
    await page.waitForLoadState('networkidle')

    // Assert: form público visible (btn-agregar-persona is on the form)
    await expect(page.getByTestId('btn-agregar-persona')).toBeVisible({ timeout: 10000 })

    // 2. Agregar y llenar datos de una persona
    await page.getByTestId('btn-agregar-persona').click()
    await page.getByTestId('input-persona-0-nombre').fill('Carlos')
    await page.getByTestId('input-persona-0-apellido').fill('Testoni')
    await page.getByTestId('input-persona-0-dni').fill('99887766')

    // Seleccionar rol si está visible
    const rolSelect = page.getByTestId('input-persona-0-rol')
    if (await rolSelect.isVisible().catch(() => false)) {
      await rolSelect.selectOption('jugador')
    }

    // 3. Submit
    await page.getByTestId('btn-submit-nomina').click()

    // Assert: confirmación visible
    await expect(page.getByTestId('confirmacion-submit')).toBeVisible({ timeout: 15000 })

    // 4. Verificar en DB que se creó el item
    const { data: items } = await supabase
      .from('nomina_externa_items')
      .select('id, tipo, persona_input, match_decision, procesada')
      .eq('nomina_externa_id', nominaId)

    expect(items).not.toBeNull()
    expect(items!.length).toBeGreaterThanOrEqual(1)
    const item = items![0]
    expect(item.tipo).toBe('persona')
    expect(item.procesada).toBe(false)
    const pInput = item.persona_input as Record<string, string>
    expect(pInput.nombre).toBe('Carlos')
    expect(pInput.apellido).toBe('Testoni')

    // 5. Admin: ir a detalle de nómina
    await page.goto(`/admin/nominas-externas/${nominaId}`)
    await page.waitForLoadState('networkidle')

    // Assert: item pendiente visible
    await expect(page.getByText('Carlos')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Testoni')).toBeVisible()

    // 6. Confirmar (crear nueva persona)
    const btnConfirmar = page.getByTestId(`btn-confirmar-crear-${item.id}`)
    await expect(btnConfirmar).toBeVisible({ timeout: 5000 })
    await btnConfirmar.click()

    // Esperar que el item se mueva a la sección "Procesados"
    await expect(page.getByText('Confirmada')).toBeVisible({ timeout: 15000 })

    // 7. Verificar item procesado en DB
    const { data: itemPost } = await supabase
      .from('nomina_externa_items')
      .select('procesada, persona_id_creada')
      .eq('id', item.id)
      .single()

    expect(itemPost!.procesada).toBe(true)
    if (itemPost!.persona_id_creada) {
      createdPersonaIds.push(itemPost!.persona_id_creada)
    }
  })

  test('token inválido → error genérico', async ({ page }) => {
    await page.goto('/nomina/token-invalido-que-no-existe')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('error-token')).toBeVisible({ timeout: 10000 })
  })

  test('API submit con token inválido → 400', async ({ request }) => {
    const response = await request.post('/api/nomina/token-falso-12345/submit', {
      data: {
        personas: [{ nombre: 'Test', apellido: 'Test' }],
        entidades: [],
      },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.ok).toBe(false)
  })

  test('form público responsive en mobile', async ({ browser }) => {
    if (!nominaToken) {
      test.skip()
      return
    }

    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
    })
    const page = await context.newPage()

    await page.goto(`/nomina/${nominaToken}`)
    await page.waitForLoadState('networkidle')

    // El form puede mostrar error si ya se completó, o el form si aún hay submits
    // Solo verificamos que la página carga sin errores de layout
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5) // 5px tolerance

    await context.close()
  })
})

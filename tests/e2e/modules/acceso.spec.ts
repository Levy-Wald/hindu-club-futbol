import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const TENANT = '11111111-1111-1111-1111-111111111111'
const PERSONA_E2E = '3d2d5902-9c10-4154-8086-316b0fbe081e' // Yair
const DNI_E2E = '33936495'

function serviceRole() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

test.describe('Acceso', () => {
  test('socio activo → veredicto VERDE', async ({ page }) => {
    const supabase = serviceRole()

    let padron_membresia_id: string | null = null

    try {
      // Pre-cleanup
      await supabase.from('acceso_logs').delete().eq('dni_consultado', DNI_E2E).eq('tenant_id', TENANT)

      // Fixture: hacer a persona E2E miembro activo de un padrón
      const { data: padron } = await supabase
        .from('padrones')
        .select('id')
        .eq('tenant_id', TENANT)
        .limit(1)
        .single()

      if (padron) {
        // Check-then-insert (AP-002)
        const { data: existente } = await supabase
          .from('personas_padrones')
          .select('id')
          .eq('padron_id', padron.id)
          .eq('persona_id', PERSONA_E2E)
          .eq('tenant_id', TENANT)
          .eq('activo', true)
          .maybeSingle()

        if (!existente) {
          const { data: mem } = await supabase
            .from('personas_padrones')
            .insert({
              tenant_id: TENANT,
              padron_id: padron.id,
              persona_id: PERSONA_E2E,
              activo: true,
              fecha_alta: new Date().toISOString().slice(0, 10),
            })
            .select('id')
            .single()
          padron_membresia_id = mem?.id ?? null
        }
      }

      // Action: ir a pantalla de acceso
      await page.goto('/admin/acceso')
      await page.waitForLoadState('networkidle')

      // Buscar DNI
      await page.getByTestId('input-dni').fill(DNI_E2E)
      await page.getByTestId('btn-buscar-acceso').click()

      // Assert: veredicto VERDE
      await expect(page.getByTestId('card-veredicto')).toBeVisible({ timeout: 10000 })
      await expect(page.getByTestId('veredicto-color-verde')).toBeVisible()
      await expect(page.getByTestId('dato-persona-nombre')).toContainText('Levy Wald')
      await expect(page.getByTestId('dato-persona-dni')).toContainText(DNI_E2E)

      // Assert DB: acceso_log creado
      const { data: log } = await supabase
        .from('acceso_logs')
        .select('id, veredicto, persona_id')
        .eq('dni_consultado', DNI_E2E)
        .eq('tenant_id', TENANT)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      expect(log).not.toBeNull()
      expect(log!.veredicto).toBe('verde')
      expect(log!.persona_id).toBe(PERSONA_E2E)

    } finally {
      await supabase.from('acceso_logs').delete().eq('dni_consultado', DNI_E2E).eq('tenant_id', TENANT)
      if (padron_membresia_id) await supabase.from('personas_padrones').delete().eq('id', padron_membresia_id)
    }
  })

  test('invitado a evento de hoy → VERDE con lista de eventos y marcar presente', async ({ page }) => {
    const supabase = serviceRole()

    let evento_id: string | null = null
    let invitado_id: string | null = null

    try {
      // Pre-cleanup
      await supabase.from('acceso_logs').delete().eq('dni_consultado', DNI_E2E).eq('tenant_id', TENANT)
      // Asegurarse de que no sea socio activo (para que el VERDE venga por invitación)
      await supabase.from('personas_padrones')
        .update({ activo: false })
        .eq('persona_id', PERSONA_E2E)
        .eq('tenant_id', TENANT)

      // Fixture: evento de hoy
      const hoy = new Date().toISOString().slice(0, 10)
      const { data: evento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          tipo_evento_slug: 'entrenamiento',
          titulo: 'E2E Test - Acceso Invitado Hoy',
          fecha: hoy,
          hora_inicio: '18:00:00',
          modulo_origen: 'acceso',
        })
        .select()
        .single()
      evento_id = evento!.id

      // Fixture: invitar persona al evento
      const { data: inv } = await supabase
        .from('evento_invitados')
        .insert({
          tenant_id: TENANT,
          evento_id: evento_id,
          persona_id: PERSONA_E2E,
          origen: 'manual',
        })
        .select()
        .single()
      invitado_id = inv!.id

      // Action
      await page.goto('/admin/acceso')
      await page.waitForLoadState('networkidle')
      await page.getByTestId('input-dni').fill(DNI_E2E)
      await page.getByTestId('btn-buscar-acceso').click()

      // Assert: VERDE con eventos de hoy
      await expect(page.getByTestId('card-veredicto')).toBeVisible({ timeout: 10000 })
      await expect(page.getByTestId('veredicto-color-verde')).toBeVisible()
      await expect(page.getByTestId('lista-eventos-hoy')).toBeVisible()
      await expect(page.getByTestId(`btn-marcar-presente-${evento_id}`)).toBeVisible()

      // Marcar presente
      page.on('dialog', dialog => dialog.accept())
      await page.getByTestId(`btn-marcar-presente-${evento_id}`).click()
      await page.waitForTimeout(2500)

      // Assert: asistencia creada
      const { data: asistencia } = await supabase
        .from('evento_asistencias')
        .select('id, estado, persona_id')
        .eq('evento_id', evento_id)
        .eq('persona_id', PERSONA_E2E)
        .maybeSingle()

      expect(asistencia).not.toBeNull()
      expect(asistencia!.estado).toBe('presente')

      // Assert: acceso_log tiene asistencia_marcada = true
      const { data: log } = await supabase
        .from('acceso_logs')
        .select('asistencia_marcada')
        .eq('dni_consultado', DNI_E2E)
        .eq('tenant_id', TENANT)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      expect(log!.asistencia_marcada).toBe(true)

    } finally {
      if (evento_id) {
        await supabase.from('evento_asistencias').delete().eq('evento_id', evento_id)
        await supabase.from('evento_invitados').delete().eq('evento_id', evento_id)
        await supabase.from('eventos').delete().eq('id', evento_id)
      }
      await supabase.from('acceso_logs').delete().eq('dni_consultado', DNI_E2E).eq('tenant_id', TENANT)
      // Reactivar membresías
      await supabase.from('personas_padrones')
        .update({ activo: true })
        .eq('persona_id', PERSONA_E2E)
        .eq('tenant_id', TENANT)
    }
  })

  test('DNI no encontrado → ROJO', async ({ page }) => {
    const supabase = serviceRole()
    const DNI_INEXISTENTE = '00000001'

    try {
      // Pre-cleanup
      await supabase.from('acceso_logs').delete().eq('dni_consultado', DNI_INEXISTENTE).eq('tenant_id', TENANT)

      // Action
      await page.goto('/admin/acceso')
      await page.waitForLoadState('networkidle')
      await page.getByTestId('input-dni').fill(DNI_INEXISTENTE)
      await page.getByTestId('btn-buscar-acceso').click()

      // Assert: ROJO
      await expect(page.getByTestId('card-veredicto')).toBeVisible({ timeout: 10000 })
      await expect(page.getByTestId('veredicto-color-rojo')).toBeVisible()

      // Assert: log creado con persona_id NULL
      const { data: log } = await supabase
        .from('acceso_logs')
        .select('id, veredicto, persona_id')
        .eq('dni_consultado', DNI_INEXISTENTE)
        .eq('tenant_id', TENANT)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      expect(log).not.toBeNull()
      expect(log!.veredicto).toBe('rojo')
      expect(log!.persona_id).toBeNull()

      // Assert: botón nueva búsqueda funciona
      await page.getByTestId('btn-nueva-busqueda').click()
      await expect(page.getByTestId('input-dni')).toBeVisible()

    } finally {
      await supabase.from('acceso_logs').delete().eq('dni_consultado', DNI_INEXISTENTE).eq('tenant_id', TENANT)
    }
  })
})

import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const TENANT = '11111111-1111-1111-1111-111111111111'
const PERSONA_E2E = '3d2d5902-9c10-4154-8086-316b0fbe081e' // Yair

function serviceRole() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

test.describe('Asistencias', () => {
  test('admin marca presente y se crea evento_asistencia con estado correcto', async ({ page }) => {
    const supabase = serviceRole()

    let evento_id: string | null = null
    let equipo_id: string | null = null
    let pe_id: string | null = null

    try {
      // Pre-cleanup
      await supabase.from('evento_asistencias').delete().eq('persona_id', PERSONA_E2E).eq('tenant_id', TENANT)

      // Fixture 1: equipo de prueba
      const { data: equipo, error: errEquipo } = await supabase
        .from('equipos')
        .insert({
          tenant_id: TENANT,
          nombre: 'E2E Asistencia Team',
          disciplina_slug: 'futbol',
          activo: true,
        })
        .select()
        .single()
      expect(errEquipo).toBeNull()
      equipo_id = equipo!.id

      // Fixture 2: persona E2E como jugador del equipo
      const { data: pe, error: errPE } = await supabase
        .from('personas_equipos')
        .insert({
          tenant_id: TENANT,
          persona_id: PERSONA_E2E,
          equipo_id: equipo_id,
          rol_equipo_slug: 'jugador',
          activo: true,
          dorsal: 99,
        })
        .select()
        .single()
      expect(errPE).toBeNull()
      pe_id = pe!.id

      // Fixture 3: evento de entrenamiento
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      const { data: evento, error: errEvento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          equipo_id: equipo_id,
          tipo_evento_slug: 'entrenamiento',
          titulo: 'E2E Test - Entrenamiento Asistencia',
          fecha: tomorrow,
          hora_inicio: '18:00:00',
          modulo_origen: 'asistencias',
        })
        .select()
        .single()
      expect(errEvento).toBeNull()
      evento_id = evento!.id

      // Action: ir a la pantalla de asistencia
      await page.goto(`/admin/operaciones/eventos/${evento_id}/asistencia`)
      await page.waitForLoadState('networkidle')

      // Verificar que la persona E2E aparece (auto-poblada desde plantel)
      await expect(page.getByTestId(`fila-persona-${PERSONA_E2E}`)).toBeVisible({ timeout: 15000 })

      // Click en botón "Presente"
      await page.getByTestId(`btn-estado-${PERSONA_E2E}-presente`).click()

      // Esperar mutation (optimistic + server round-trip)
      await page.waitForTimeout(1500)

      // Assert: fila creada en evento_asistencias con estado='presente'
      const { data: asistencia, error: errAsist } = await supabase
        .from('evento_asistencias')
        .select('id, estado, respondido_at, persona_id, evento_id')
        .eq('persona_id', PERSONA_E2E)
        .eq('evento_id', evento_id)
        .single()

      expect(errAsist).toBeNull()
      expect(asistencia).not.toBeNull()
      expect(asistencia!.estado).toBe('presente')
      expect(asistencia!.respondido_at).toBeTruthy()

      // Assert: el invitado fue auto-poblado con origen='auto_plantel'
      const { data: invitado } = await supabase
        .from('evento_invitados')
        .select('origen')
        .eq('evento_id', evento_id)
        .eq('persona_id', PERSONA_E2E)
        .is('deleted_at', null)
        .single()

      expect(invitado!.origen).toBe('auto_plantel')

    } finally {
      // Cleanup en orden inverso
      if (evento_id) {
        await supabase.from('evento_asistencias').delete().eq('evento_id', evento_id)
        await supabase.from('evento_invitados').delete().eq('evento_id', evento_id)
        await supabase.from('eventos').delete().eq('id', evento_id)
      }
      if (pe_id) await supabase.from('personas_equipos').delete().eq('id', pe_id)
      if (equipo_id) await supabase.from('equipos').delete().eq('id', equipo_id)
    }
  })

  test('cambiar estado de presente a tarde actualiza la misma fila (no duplica)', async ({ page }) => {
    const supabase = serviceRole()

    let evento_id: string | null = null
    let equipo_id: string | null = null
    let pe_id: string | null = null

    try {
      // Pre-cleanup
      await supabase.from('evento_asistencias').delete().eq('persona_id', PERSONA_E2E).eq('tenant_id', TENANT)

      // Fixture: equipo + persona_equipos + evento
      const { data: equipo } = await supabase
        .from('equipos')
        .insert({
          tenant_id: TENANT,
          nombre: 'E2E Asistencia Upsert Team',
          disciplina_slug: 'futbol',
          activo: true,
        })
        .select()
        .single()
      equipo_id = equipo!.id

      const { data: pe } = await supabase
        .from('personas_equipos')
        .insert({
          tenant_id: TENANT,
          persona_id: PERSONA_E2E,
          equipo_id: equipo_id,
          rol_equipo_slug: 'jugador',
          activo: true,
        })
        .select()
        .single()
      pe_id = pe!.id

      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      const { data: evento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          equipo_id: equipo_id,
          tipo_evento_slug: 'entrenamiento',
          titulo: 'E2E Test - Upsert Asistencia',
          fecha: tomorrow,
          hora_inicio: '19:00:00',
          modulo_origen: 'asistencias',
        })
        .select()
        .single()
      evento_id = evento!.id

      await page.goto(`/admin/operaciones/eventos/${evento_id}/asistencia`)
      await page.waitForLoadState('networkidle')
      await expect(page.getByTestId(`fila-persona-${PERSONA_E2E}`)).toBeVisible({ timeout: 15000 })

      // Marcar presente
      await page.getByTestId(`btn-estado-${PERSONA_E2E}-presente`).click()
      await page.waitForTimeout(1500)

      // Cambiar a tarde
      await page.getByTestId(`btn-estado-${PERSONA_E2E}-tarde`).click()
      await page.waitForTimeout(1500)

      // Assert: solo 1 fila de asistencia
      const { data: asistencias, error } = await supabase
        .from('evento_asistencias')
        .select('id, estado')
        .eq('persona_id', PERSONA_E2E)
        .eq('evento_id', evento_id)

      expect(error).toBeNull()
      expect(asistencias).toHaveLength(1)
      expect(asistencias![0].estado).toBe('tarde')

    } finally {
      if (evento_id) {
        await supabase.from('evento_asistencias').delete().eq('evento_id', evento_id)
        await supabase.from('evento_invitados').delete().eq('evento_id', evento_id)
        await supabase.from('eventos').delete().eq('id', evento_id)
      }
      if (pe_id) await supabase.from('personas_equipos').delete().eq('id', pe_id)
      if (equipo_id) await supabase.from('equipos').delete().eq('id', equipo_id)
    }
  })
})

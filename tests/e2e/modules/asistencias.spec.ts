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

  test('invitar entidad a evento y marcar asistencia', async ({ page }) => {
    const supabase = serviceRole()

    let evento_id: string | null = null
    let entidad_id: string | null = null

    try {
      // Fixture: entidad
      const { data: entidad, error: errEnt } = await supabase
        .from('entidades')
        .insert({
          tenant_id: TENANT,
          nombre: 'E2E Sponsor Test',
          tipo: 'sponsor',
        })
        .select()
        .single()
      expect(errEnt).toBeNull()
      entidad_id = entidad!.id

      // Fixture: evento sin equipo (genérico)
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      const { data: evento, error: errEvento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          tipo_evento_slug: 'reunion',
          titulo: 'E2E Test - Entidad Asistencia',
          fecha: tomorrow,
          hora_inicio: '10:00:00',
          modulo_origen: 'asistencias',
        })
        .select()
        .single()
      expect(errEvento).toBeNull()
      evento_id = evento!.id

      // Invitar entidad via DB (simula action)
      const { error: errInv } = await supabase
        .from('evento_invitados')
        .insert({
          tenant_id: TENANT,
          evento_id: evento_id,
          entidad_id: entidad_id,
          origen: 'manual',
          marca_asistencia: true,
        })
      expect(errInv).toBeNull()

      // Navegar a pantalla de asistencia
      await page.goto(`/admin/operaciones/eventos/${evento_id}/asistencia`)
      await page.waitForLoadState('networkidle')

      // Verificar sección entidades visible
      await expect(page.getByTestId('seccion-entidades')).toBeVisible({ timeout: 15000 })

      // Expandir sección
      await page.getByTestId('seccion-entidades').getByRole('button').first().click()

      // Verificar fila de entidad
      await expect(page.getByTestId(`fila-entidad-${entidad_id}`)).toBeVisible()

      // Marcar presente
      await page.getByTestId(`btn-estado-entidad-${entidad_id}-presente`).click()
      await page.waitForTimeout(1500)

      // Assert: asistencia creada con entidad_id
      const { data: asistencia, error: errAsist } = await supabase
        .from('evento_asistencias')
        .select('id, estado, entidad_id')
        .eq('entidad_id', entidad_id)
        .eq('evento_id', evento_id)
        .single()

      expect(errAsist).toBeNull()
      expect(asistencia!.estado).toBe('presente')
      expect(asistencia!.entidad_id).toBe(entidad_id)

    } finally {
      if (evento_id) {
        await supabase.from('evento_asistencias').delete().eq('evento_id', evento_id)
        await supabase.from('evento_invitados').delete().eq('evento_id', evento_id)
        await supabase.from('eventos').delete().eq('id', evento_id)
      }
      if (entidad_id) await supabase.from('entidades').delete().eq('id', entidad_id)
    }
  })

  test('invitar equipo rival a evento y marcar asistencia', async ({ page }) => {
    const supabase = serviceRole()

    let evento_id: string | null = null
    let equipo_rival_id: string | null = null

    try {
      // Fixture: equipo rival
      const { data: equipoRival, error: errEq } = await supabase
        .from('equipos')
        .insert({
          tenant_id: TENANT,
          nombre: 'E2E Rival Team',
          disciplina_slug: 'futbol',
          activo: true,
        })
        .select()
        .single()
      expect(errEq).toBeNull()
      equipo_rival_id = equipoRival!.id

      // Fixture: evento
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      const { data: evento, error: errEvento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          tipo_evento_slug: 'partido',
          titulo: 'E2E Test - Equipo Rival Asistencia',
          fecha: tomorrow,
          hora_inicio: '15:00:00',
          modulo_origen: 'asistencias',
        })
        .select()
        .single()
      expect(errEvento).toBeNull()
      evento_id = evento!.id

      // Invitar equipo rival via DB
      const { error: errInv } = await supabase
        .from('evento_invitados')
        .insert({
          tenant_id: TENANT,
          evento_id: evento_id,
          equipo_id: equipo_rival_id,
          origen: 'manual',
          marca_asistencia: true,
        })
      expect(errInv).toBeNull()

      // Navegar
      await page.goto(`/admin/operaciones/eventos/${evento_id}/asistencia`)
      await page.waitForLoadState('networkidle')

      // Verificar sección equipos
      await expect(page.getByTestId('seccion-equipos')).toBeVisible({ timeout: 15000 })

      // Expandir sección
      await page.getByTestId('seccion-equipos').getByRole('button').first().click()

      // Verificar fila de equipo
      await expect(page.getByTestId(`fila-equipo-${equipo_rival_id}`)).toBeVisible()

      // Marcar presente
      await page.getByTestId(`btn-estado-equipo-${equipo_rival_id}-presente`).click()
      await page.waitForTimeout(1500)

      // Assert: asistencia creada con equipo_id
      const { data: asistencia, error: errAsist } = await supabase
        .from('evento_asistencias')
        .select('id, estado, equipo_id')
        .eq('equipo_id', equipo_rival_id)
        .eq('evento_id', evento_id)
        .single()

      expect(errAsist).toBeNull()
      expect(asistencia!.estado).toBe('presente')
      expect(asistencia!.equipo_id).toBe(equipo_rival_id)

    } finally {
      if (evento_id) {
        await supabase.from('evento_asistencias').delete().eq('evento_id', evento_id)
        await supabase.from('evento_invitados').delete().eq('evento_id', evento_id)
        await supabase.from('eventos').delete().eq('id', evento_id)
      }
      if (equipo_rival_id) await supabase.from('equipos').delete().eq('id', equipo_rival_id)
    }
  })

  test('expandir equipo invitado crea invitaciones individuales de personas', async ({ page }) => {
    const supabase = serviceRole()

    let evento_id: string | null = null
    let equipo_id: string | null = null
    let pe_id: string | null = null

    try {
      // Pre-cleanup
      await supabase.from('evento_asistencias').delete().eq('persona_id', PERSONA_E2E).eq('tenant_id', TENANT)

      // Fixture: equipo + persona como jugador
      const { data: equipo } = await supabase
        .from('equipos')
        .insert({
          tenant_id: TENANT,
          nombre: 'E2E Expandir Team',
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

      // Fixture: evento
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      const { data: evento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          tipo_evento_slug: 'partido',
          titulo: 'E2E Test - Expandir Equipo',
          fecha: tomorrow,
          hora_inicio: '16:00:00',
          modulo_origen: 'asistencias',
        })
        .select()
        .single()
      evento_id = evento!.id

      // Invitar equipo como bloque (no auto-poblar personas)
      const { error: errInv } = await supabase
        .from('evento_invitados')
        .insert({
          tenant_id: TENANT,
          evento_id: evento_id,
          equipo_id: equipo_id,
          origen: 'manual',
          marca_asistencia: true,
        })
      expect(errInv).toBeNull()

      // Navegar
      await page.goto(`/admin/operaciones/eventos/${evento_id}/asistencia`)
      await page.waitForLoadState('networkidle')

      // Expandir sección equipos
      await page.getByTestId('seccion-equipos').getByRole('button').first().click()
      await expect(page.getByTestId(`fila-equipo-${equipo_id}`)).toBeVisible()

      // Click "Expandir plantel"
      await page.getByTestId(`btn-expandir-${equipo_id}`).click()
      await page.waitForTimeout(2000)

      // Assert: persona_id ahora aparece como invitado individual
      const { data: invitados } = await supabase
        .from('evento_invitados')
        .select('persona_id, origen')
        .eq('evento_id', evento_id)
        .eq('persona_id', PERSONA_E2E)
        .is('deleted_at', null)

      expect(invitados).toHaveLength(1)
      expect(invitados![0].origen).toBe('auto_plantel')

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

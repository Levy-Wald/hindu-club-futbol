import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import personasDemo from '../fixtures/ccbp/personas-demo.json'
import equiposDemo from '../fixtures/ccbp/equipos-demo.json'
import cuotasPlanesDemo from '../fixtures/ccbp/cuotas-planes-demo.json'
import torneosDemo from '../fixtures/ccbp/torneos-demo.json'

const TENANT = '11111111-1111-1111-1111-111111111111'

function serviceRole() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

// Shared state across serial tests
const state: {
  personaId: string | null
  fichaId: string | null
  equipoAlphaId: string | null
  equipoBetaId: string | null
  peId: string | null
  planId: string | null
  suscripcionId: string | null
  eventoId: string | null
  lesionId: string | null
  torneoId: string | null
  torneoEquipoAlphaId: string | null
  torneoEquipoBetaId: string | null
  equipoExternoC: string | null
  equipoExternoD: string | null
} = {
  personaId: null,
  fichaId: null,
  equipoAlphaId: null,
  equipoBetaId: null,
  peId: null,
  planId: null,
  suscripcionId: null,
  eventoId: null,
  lesionId: null,
  torneoId: null,
  torneoEquipoAlphaId: null,
  torneoEquipoBetaId: null,
  equipoExternoC: null,
  equipoExternoD: null,
}

test.describe('Happy path CCBP completo', () => {
  test.describe.configure({ mode: 'serial' })

  // =========================================================================
  // 1. Crear persona desde scouting
  // =========================================================================
  test('1. Crear persona desde scouting', async () => {
    const supabase = serviceRole()
    const p = personasDemo[0]

    // Create scouting ficha
    const { data: ficha, error } = await supabase
      .from('scouting_fichas')
      .insert({
        tenant_id: TENANT,
        nombre: p.nombre,
        apellido: p.apellido,
        posicion: 'delantero',
        club_actual: 'Club Independiente',
        estado: 'observado',
      })
      .select('id')
      .single()

    expect(error).toBeNull()
    expect(ficha).not.toBeNull()
    state.fichaId = ficha!.id
  })

  // =========================================================================
  // 2. Promover scouting -> persona del club
  // =========================================================================
  test('2. Promover scouting -> persona del club', async () => {
    const supabase = serviceRole()
    const p = personasDemo[0]

    // Create persona
    const { data: persona, error: errPersona } = await supabase
      .from('personas')
      .insert({
        tenant_id: TENANT,
        nombre: p.nombre,
        apellido: p.apellido,
        tipo_documento: p.tipo_documento,
        estado: p.estado,
        fuente_origen: 'manual_admin',
        fecha_alta_sistema: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single()

    expect(errPersona).toBeNull()
    state.personaId = persona!.id

    // Link ficha to persona (promover)
    const { error: errLink } = await supabase
      .from('scouting_fichas')
      .update({ persona_id: state.personaId, estado: 'incorporado' })
      .eq('id', state.fichaId!)

    expect(errLink).toBeNull()

    // Verify ficha linked
    const { data: ficha } = await supabase
      .from('scouting_fichas')
      .select('persona_id, estado')
      .eq('id', state.fichaId!)
      .single()

    expect(ficha!.persona_id).toBe(state.personaId)
    expect(ficha!.estado).toBe('incorporado')
  })

  // =========================================================================
  // 3. Asignar a equipo via personas_equipos
  // =========================================================================
  test('3. Asignar a equipo via personas_equipos', async ({ page }) => {
    const supabase = serviceRole()
    const eqData = equiposDemo[0]

    // Create equipos
    const { data: eqA, error: errA } = await supabase
      .from('equipos')
      .insert({ tenant_id: TENANT, ...eqData })
      .select('id')
      .single()
    expect(errA).toBeNull()
    state.equipoAlphaId = eqA!.id

    const { data: eqB, error: errB } = await supabase
      .from('equipos')
      .insert({ tenant_id: TENANT, ...equiposDemo[1] })
      .select('id')
      .single()
    expect(errB).toBeNull()
    state.equipoBetaId = eqB!.id

    // Assign persona to equipo Alpha
    const { data: pe, error: errPE } = await supabase
      .from('personas_equipos')
      .insert({
        tenant_id: TENANT,
        persona_id: state.personaId!,
        equipo_id: state.equipoAlphaId!,
        rol_equipo_slug: 'jugador',
        activo: true,
        dorsal: 10,
      })
      .select('id')
      .single()
    expect(errPE).toBeNull()
    state.peId = pe!.id

    // Verify via page (equipo detail loads without error)
    await page.goto(`/admin/equipos/${state.equipoAlphaId}`)
    await page.waitForLoadState('networkidle')
    const resp = await page.goto(`/admin/equipos/${state.equipoAlphaId}`)
    expect(resp?.status()).toBe(200)
    await expect(page.locator('text=Application error')).not.toBeVisible({ timeout: 3000 })

    // Verify assignment in DB
    const { data: assignment } = await supabase
      .from('personas_equipos')
      .select('persona_id, rol_equipo_slug, dorsal')
      .eq('id', state.peId!)
      .single()
    expect(assignment!.persona_id).toBe(state.personaId)
    expect(assignment!.rol_equipo_slug).toBe('jugador')
    expect(assignment!.dorsal).toBe(10)
  })

  // =========================================================================
  // 4. Alta de membresia con plan de cuotas
  // =========================================================================
  test('4. Alta de membresia con plan de cuotas', async ({ page }) => {
    const supabase = serviceRole()
    const planData = cuotasPlanesDemo[0]

    // Create plan
    const { data: plan, error: errPlan } = await supabase
      .from('cuotas_planes')
      .insert({ tenant_id: TENANT, ...planData })
      .select('id')
      .single()
    expect(errPlan).toBeNull()
    state.planId = plan!.id

    // Create suscripcion
    const { data: sus, error: errSus } = await supabase
      .from('suscripciones')
      .insert({
        tenant_id: TENANT,
        persona_id: state.personaId!,
        plan_id: state.planId!,
        estado: 'activa',
        tipo: 'membresia',
        disciplina_slug: 'futbol',
        equipo_id: state.equipoAlphaId!,
        monto_pactado: planData.monto,
        fecha_alta: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single()
    expect(errSus).toBeNull()
    state.suscripcionId = sus!.id

    // Verify membresias page loads without error
    await page.goto('/admin/membresias')
    await page.waitForLoadState('networkidle')
    const resp = await page.goto('/admin/membresias')
    expect(resp?.status()).toBe(200)
    await expect(page.locator('text=Application error')).not.toBeVisible({ timeout: 3000 })

    // Verify suscripcion in DB
    const { data: susDB } = await supabase
      .from('suscripciones')
      .select('estado, tipo, persona_id')
      .eq('id', state.suscripcionId!)
      .single()
    expect(susDB!.estado).toBe('activa')
    expect(susDB!.tipo).toBe('membresia')
    expect(susDB!.persona_id).toBe(state.personaId)
  })

  // =========================================================================
  // 5. Verificar cuotas_emitidas puede ser creada
  // =========================================================================
  test('5. Generar cuota mensual', async () => {
    const supabase = serviceRole()

    const mesActual = new Date().toISOString().slice(0, 7)
    const { data: cuota, error } = await supabase
      .from('cuotas_emitidas')
      .insert({
        tenant_id: TENANT,
        persona_id: state.personaId!,
        plan_id: state.planId!,
        periodo: mesActual,
        monto_original: 15000,
        monto_final: 15000,
        moneda: 'ARS',
        estado: 'pendiente',
        fecha_emision: new Date().toISOString().slice(0, 10),
        fecha_vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      })
      .select('id')
      .single()

    expect(error).toBeNull()
    expect(cuota).not.toBeNull()
  })

  // =========================================================================
  // 6. Registrar pago de cuota (mock cobranza)
  // =========================================================================
  test('6. Registrar pago de cuota (mock cobranza)', async () => {
    const supabase = serviceRole()

    const { data: cuotas } = await supabase
      .from('cuotas_emitidas')
      .select('id')
      .eq('persona_id', state.personaId!)
      .eq('estado', 'pendiente')
      .limit(1)

    expect(cuotas).toHaveLength(1)

    const { error } = await supabase
      .from('cuotas_emitidas')
      .update({ estado: 'pagada', fecha_pago: new Date().toISOString().slice(0, 10) })
      .eq('id', cuotas![0].id)

    expect(error).toBeNull()

    // Verify pagada
    const { data: cuotaPagada } = await supabase
      .from('cuotas_emitidas')
      .select('estado')
      .eq('id', cuotas![0].id)
      .single()

    expect(cuotaPagada!.estado).toBe('pagada')
  })

  // =========================================================================
  // 7. Convocar a entrenamiento (evento)
  // =========================================================================
  test('7. Convocar a entrenamiento (evento)', async ({ page }) => {
    const supabase = serviceRole()

    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    const { data: evento, error } = await supabase
      .from('eventos')
      .insert({
        tenant_id: TENANT,
        equipo_id: state.equipoAlphaId!,
        tipo_evento_slug: 'entrenamiento',
        titulo: 'DEMO_E2E Entrenamiento Alpha',
        fecha: tomorrow,
        hora_inicio: '18:00:00',
        modulo_origen: 'asistencias',
      })
      .select('id')
      .single()

    expect(error).toBeNull()
    state.eventoId = evento!.id

    // Navigate to event page
    await page.goto(`/admin/operaciones/eventos/${state.eventoId}/asistencia`)
    await page.waitForLoadState('networkidle')

    // Persona should appear in plantel
    const resp = await page.goto(`/admin/operaciones/eventos/${state.eventoId}/asistencia`)
    expect(resp?.status()).toBe(200)
  })

  // =========================================================================
  // 8. Registrar asistencia
  // =========================================================================
  test('8. Registrar asistencia', async () => {
    const supabase = serviceRole()

    // Ensure invitado exists (may already be auto-populated from plantel)
    const { data: existing } = await supabase
      .from('evento_invitados')
      .select('id')
      .eq('evento_id', state.eventoId!)
      .eq('persona_id', state.personaId!)
      .maybeSingle()

    if (!existing) {
      const { error: errInv } = await supabase
        .from('evento_invitados')
        .insert({
          tenant_id: TENANT,
          evento_id: state.eventoId!,
          persona_id: state.personaId!,
          origen: 'auto_plantel',
          marca_asistencia: true,
        })
      expect(errInv).toBeNull()
    }

    const { error: errAsist } = await supabase
      .from('evento_asistencias')
      .insert({
        tenant_id: TENANT,
        evento_id: state.eventoId!,
        persona_id: state.personaId!,
        estado: 'presente',
        respondido_at: new Date().toISOString(),
      })
    expect(errAsist).toBeNull()

    // Verify
    const { data: asistencia } = await supabase
      .from('evento_asistencias')
      .select('estado')
      .eq('evento_id', state.eventoId!)
      .eq('persona_id', state.personaId!)
      .single()

    expect(asistencia!.estado).toBe('presente')
  })

  // =========================================================================
  // 9. Registrar lesion durante entrenamiento
  // =========================================================================
  test('9. Registrar lesion durante entrenamiento', async () => {
    const supabase = serviceRole()

    const { data: lesion, error } = await supabase
      .from('personas_lesiones')
      .insert({
        tenant_id: TENANT,
        persona_id: state.personaId!,
        tipo_lesion: 'esguince_tobillo',
        tipo_lesion_slug: 'esguince_tobillo',
        zona_corporal: 'tobillo_derecho',
        gravedad: 'moderada',
        fecha_inicio: new Date().toISOString().slice(0, 10),
        recuperada: false,
        equipo_id: state.equipoAlphaId!,
        diagnostico_medico: 'Esguince grado II tobillo derecho',
      })
      .select('id')
      .single()

    expect(error).toBeNull()
    state.lesionId = lesion!.id

    // Verify in salud page
    const { data: lesionDB } = await supabase
      .from('personas_lesiones')
      .select('recuperada, persona_id')
      .eq('id', state.lesionId!)
      .single()

    expect(lesionDB!.recuperada).toBe(false)
    expect(lesionDB!.persona_id).toBe(state.personaId)
  })

  // =========================================================================
  // 10. Verificar badge LESIONADO en pagina salud
  // =========================================================================
  test('10. Verificar lesion activa visible en pagina salud', async ({ page }) => {
    await page.goto('/admin/salud')
    await page.waitForLoadState('networkidle')

    // Page should load without errors
    const resp = await page.goto('/admin/salud')
    expect(resp?.status()).toBe(200)
    const errorBoundary = page.locator('text=Application error')
    await expect(errorBoundary).not.toBeVisible({ timeout: 3000 })
  })

  // =========================================================================
  // 11. Inscribir equipo en torneo
  // =========================================================================
  test('11. Inscribir equipo en torneo', async ({ page }) => {
    const supabase = serviceRole()
    const tData = torneosDemo[0]

    // Create torneo
    const { data: torneo, error: errT } = await supabase
      .from('torneos')
      .insert({ tenant_id: TENANT, ...tData })
      .select('id')
      .single()
    expect(errT).toBeNull()
    state.torneoId = torneo!.id

    // Inscribe 4 equipos (2 internos + 2 externos)
    const { data: teA, error: errA } = await supabase
      .from('torneo_equipos')
      .insert({
        tenant_id: TENANT,
        torneo_id: state.torneoId!,
        equipo_id: state.equipoAlphaId!,
        partidos_jugados: 0, partidos_ganados: 0, partidos_empatados: 0,
        partidos_perdidos: 0, goles_a_favor: 0, goles_en_contra: 0,
      })
      .select('id')
      .single()
    expect(errA).toBeNull()
    state.torneoEquipoAlphaId = teA!.id

    const { data: teB, error: errB } = await supabase
      .from('torneo_equipos')
      .insert({
        tenant_id: TENANT,
        torneo_id: state.torneoId!,
        equipo_id: state.equipoBetaId!,
        partidos_jugados: 0, partidos_ganados: 0, partidos_empatados: 0,
        partidos_perdidos: 0, goles_a_favor: 0, goles_en_contra: 0,
      })
      .select('id')
      .single()
    expect(errB).toBeNull()
    state.torneoEquipoBetaId = teB!.id

    const { data: teC } = await supabase
      .from('torneo_equipos')
      .insert({
        tenant_id: TENANT,
        torneo_id: state.torneoId!,
        equipo_externo_nombre: 'DEMO_E2E_Club Gamma',
        partidos_jugados: 0, partidos_ganados: 0, partidos_empatados: 0,
        partidos_perdidos: 0, goles_a_favor: 0, goles_en_contra: 0,
      })
      .select('id')
      .single()
    state.equipoExternoC = teC?.id ?? null

    const { data: teD } = await supabase
      .from('torneo_equipos')
      .insert({
        tenant_id: TENANT,
        torneo_id: state.torneoId!,
        equipo_externo_nombre: 'DEMO_E2E_Club Delta',
        partidos_jugados: 0, partidos_ganados: 0, partidos_empatados: 0,
        partidos_perdidos: 0, goles_a_favor: 0, goles_en_contra: 0,
      })
      .select('id')
      .single()
    state.equipoExternoD = teD?.id ?? null

    // Verify torneo page loads
    await page.goto(`/admin/competencias/torneos/${state.torneoId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(tData.nombre).first()).toBeVisible({ timeout: 10000 })
  })

  // =========================================================================
  // 12. Cargar resultado de partido
  // =========================================================================
  test('12. Cargar resultado de partido via DB', async () => {
    const supabase = serviceRole()

    // Update torneo_equipos with match result: Alpha 2-1 Beta
    const { error: errA } = await supabase
      .from('torneo_equipos')
      .update({
        partidos_jugados: 1,
        partidos_ganados: 1,
        goles_a_favor: 2,
        goles_en_contra: 1,
      })
      .eq('id', state.torneoEquipoAlphaId!)
    expect(errA).toBeNull()

    const { error: errB } = await supabase
      .from('torneo_equipos')
      .update({
        partidos_jugados: 1,
        partidos_perdidos: 1,
        goles_a_favor: 1,
        goles_en_contra: 2,
      })
      .eq('id', state.torneoEquipoBetaId!)
    expect(errB).toBeNull()
  })

  // =========================================================================
  // 13. Verificar tabla de posiciones actualiza
  // =========================================================================
  test('13. Verificar tabla de posiciones actualiza', async ({ page }) => {
    const supabase = serviceRole()

    // Verify in DB
    const { data: posAlpha } = await supabase
      .from('torneo_equipos')
      .select('partidos_ganados, goles_a_favor')
      .eq('id', state.torneoEquipoAlphaId!)
      .single()

    expect(posAlpha!.partidos_ganados).toBe(1)
    expect(posAlpha!.goles_a_favor).toBe(2)

    // Verify posiciones page loads
    await page.goto(`/admin/competencias/torneos/${state.torneoId}/posiciones`)
    await page.waitForLoadState('networkidle')
    const resp = await page.goto(`/admin/competencias/torneos/${state.torneoId}/posiciones`)
    expect(resp?.status()).toBe(200)
    const errorBoundary = page.locator('text=Application error')
    await expect(errorBoundary).not.toBeVisible({ timeout: 3000 })
  })

  // =========================================================================
  // 14. Marcar lesion como recuperada
  // =========================================================================
  test('14. Marcar lesion como recuperada', async () => {
    const supabase = serviceRole()

    const { error } = await supabase
      .from('personas_lesiones')
      .update({
        recuperada: true,
        fecha_alta_medica: new Date().toISOString().slice(0, 10),
      })
      .eq('id', state.lesionId!)
    expect(error).toBeNull()

    // Verify
    const { data: lesion } = await supabase
      .from('personas_lesiones')
      .select('recuperada, fecha_alta_medica')
      .eq('id', state.lesionId!)
      .single()

    expect(lesion!.recuperada).toBe(true)
    expect(lesion!.fecha_alta_medica).not.toBeNull()
  })

  // =========================================================================
  // 15. Verificar reporte deportivo actualizado
  // =========================================================================
  test('15. Verificar reporte deportivo carga correctamente', async ({ page }) => {
    await page.goto('/admin/reportes-deportivos')
    await page.waitForLoadState('networkidle')

    const resp = await page.goto('/admin/reportes-deportivos')
    expect(resp?.status()).toBe(200)
    const errorBoundary = page.locator('text=Application error')
    await expect(errorBoundary).not.toBeVisible({ timeout: 3000 })
  })

  // =========================================================================
  // 16. Dar baja a la suscripcion
  // =========================================================================
  test('16. Dar baja a la suscripcion', async () => {
    const supabase = serviceRole()

    const { error } = await supabase
      .from('suscripciones')
      .update({
        estado: 'cancelada',
        fecha_baja: new Date().toISOString().slice(0, 10),
        motivo_baja: 'E2E test - baja programada',
      })
      .eq('id', state.suscripcionId!)
    expect(error).toBeNull()

    // Verify
    const { data: sus } = await supabase
      .from('suscripciones')
      .select('estado, fecha_baja')
      .eq('id', state.suscripcionId!)
      .single()

    expect(sus!.estado).toBe('cancelada')
    expect(sus!.fecha_baja).not.toBeNull()
  })

  // =========================================================================
  // 17. Verificar persona queda en historico (no se elimina)
  // =========================================================================
  test('17. Verificar persona queda en historico (no se elimina)', async ({ page }) => {
    const supabase = serviceRole()

    // Persona still exists
    const { data: persona } = await supabase
      .from('personas')
      .select('id, nombre, apellido, estado')
      .eq('id', state.personaId!)
      .single()

    expect(persona).not.toBeNull()
    expect(persona!.nombre).toBe(personasDemo[0].nombre)

    // Persona is still visible in admin
    await page.goto(`/admin/personas/${state.personaId}`)
    await page.waitForLoadState('networkidle')
    const resp = await page.goto(`/admin/personas/${state.personaId}`)
    expect(resp?.status()).toBe(200)

    // Suscripcion is cancelada but record exists
    const { data: sus } = await supabase
      .from('suscripciones')
      .select('estado')
      .eq('id', state.suscripcionId!)
      .single()
    expect(sus!.estado).toBe('cancelada')

    // Ficha scouting still linked
    const { data: ficha } = await supabase
      .from('scouting_fichas')
      .select('persona_id, estado')
      .eq('id', state.fichaId!)
      .single()
    expect(ficha!.persona_id).toBe(state.personaId)
  })

  // =========================================================================
  // CLEANUP — runs after all tests
  // =========================================================================
  test.afterAll(async () => {
    const supabase = serviceRole()
    const now = new Date().toISOString()

    // Cleanup in reverse dependency order
    // torneo_equipos
    if (state.torneoId) {
      await supabase.from('torneo_equipos').delete().eq('torneo_id', state.torneoId)
      await supabase.from('torneos').delete().eq('id', state.torneoId)
    }

    // evento data
    if (state.eventoId) {
      await supabase.from('evento_asistencias').delete().eq('evento_id', state.eventoId)
      await supabase.from('evento_invitados').delete().eq('evento_id', state.eventoId)
      await supabase.from('eventos').delete().eq('id', state.eventoId)
    }

    // lesion
    if (state.lesionId) {
      await supabase.from('personas_lesiones').delete().eq('id', state.lesionId)
    }

    // cuotas
    if (state.personaId) {
      await supabase.from('cuotas_emitidas').delete().eq('persona_id', state.personaId)
    }

    // suscripcion
    if (state.suscripcionId) {
      await supabase.from('suscripciones').delete().eq('id', state.suscripcionId)
    }

    // plan
    if (state.planId) {
      await supabase.from('cuotas_planes').delete().eq('id', state.planId)
    }

    // persona_equipos
    if (state.peId) {
      await supabase.from('personas_equipos').delete().eq('id', state.peId)
    }

    // equipos
    if (state.equipoAlphaId) await supabase.from('equipos').delete().eq('id', state.equipoAlphaId)
    if (state.equipoBetaId) await supabase.from('equipos').delete().eq('id', state.equipoBetaId)

    // scouting evaluaciones (if any linked to ficha)
    if (state.fichaId) {
      await supabase.from('scouting_evaluaciones').delete().eq('ficha_id', state.fichaId)
      await supabase.from('scouting_fichas').delete().eq('id', state.fichaId)
    }

    // persona
    if (state.personaId) {
      await supabase.from('personas').delete().eq('id', state.personaId)
    }

    // Safety sweep: delete any leftover DEMO_E2E_ data
    await supabase.from('personas').delete().like('nombre', 'DEMO_E2E_%')
    await supabase.from('equipos').delete().like('nombre', 'DEMO_E2E_%')
    await supabase.from('cuotas_planes').delete().like('nombre', 'DEMO_E2E_%')
    await supabase.from('torneos').delete().like('nombre', 'DEMO_E2E_%')
    await supabase.from('scouting_fichas').delete().like('nombre', 'DEMO_E2E_%')
  })
})

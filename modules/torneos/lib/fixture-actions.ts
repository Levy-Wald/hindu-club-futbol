'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { canAdministrarTorneos } from './permisos'
import type { FormatoTorneo } from './types'
import { generarFixture } from './fixture-generators'
import type { EquipoEnFixture, FixtureOptions, FixturePreview, PartidoEnFixture } from './fixture-generators'

async function getPersona() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  return persona
}

export async function generarFixturePreviewAction(input: {
  torneo_id: string
  categoria_id?: string
  options?: FixtureOptions
}): Promise<{ ok: true; preview: FixturePreview } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdministrarTorneos(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  // Get torneo
  const { data: torneo } = await supabase
    .from('torneos')
    .select('id, formato')
    .eq('id', input.torneo_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!torneo) return { ok: false, error: 'Torneo no encontrado' }

  // Get equipos inscriptos (optionally filtered by categoria)
  let query = supabase
    .from('torneo_equipos')
    .select('id, equipo_id, equipo_externo_nombre')
    .eq('torneo_id', input.torneo_id)
    .eq('activo', true)

  if (input.categoria_id) {
    query = query.eq('categoria_id', input.categoria_id)
  }

  const { data: inscriptos } = await query

  if (!inscriptos || inscriptos.length < 2) {
    return { ok: false, error: 'Se necesitan al menos 2 equipos inscriptos' }
  }

  // Hydrate equipo names
  const equipoIds = inscriptos.filter((e) => e.equipo_id).map((e) => e.equipo_id!)
  let equipoNombreMap: Record<string, string> = {}
  if (equipoIds.length > 0) {
    const { data: eqs } = await supabase
      .from('equipos')
      .select('id, nombre')
      .in('id', equipoIds)
    equipoNombreMap = (eqs ?? []).reduce(
      (acc, e) => {
        acc[e.id] = e.nombre
        return acc
      },
      {} as Record<string, string>
    )
  }

  const equipos: EquipoEnFixture[] = inscriptos.map((e) => ({
    id: e.id,
    nombre: e.equipo_id
      ? equipoNombreMap[e.equipo_id] ?? 'Equipo desconocido'
      : e.equipo_externo_nombre ?? 'Sin nombre',
  }))

  const formato = torneo.formato as FormatoTorneo
  const preview = generarFixture(formato, equipos, input.options ?? {})

  return { ok: true, preview }
}

export async function confirmarFixtureAction(input: {
  torneo_id: string
  categoria_id?: string
  partidos: PartidoEnFixture[]
  fecha_inicio?: string // YYYY-MM-DD for first match, auto-increment weekly
}): Promise<{ ok: true; eventos_creados: number } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdministrarTorneos(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  // Verify torneo exists
  const { data: torneo } = await supabase
    .from('torneos')
    .select('id')
    .eq('id', input.torneo_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!torneo) return { ok: false, error: 'Torneo no encontrado' }

  if (input.partidos.length === 0) {
    return { ok: false, error: 'No hay partidos para confirmar' }
  }

  // Calculate dates: fecha_inicio + 7 days per fecha_numero
  const baseDateStr = input.fecha_inicio ?? new Date().toISOString().split('T')[0]
  const baseDate = new Date(baseDateStr + 'T00:00:00')

  let eventosCreados = 0

  // Insert all partidos atomically — if one fails, report but continue
  // (Supabase doesn't support multi-table transactions via client SDK)
  for (const partido of input.partidos) {
    const fechaOffset = (partido.fecha_numero - 1) * 7
    const matchDate = new Date(baseDate)
    matchDate.setDate(matchDate.getDate() + fechaOffset)
    const fechaStr = matchDate.toISOString().split('T')[0]

    const titulo = `${partido.local.nombre} vs ${partido.visitante.nombre}`

    // Resolve equipo_id for the local team (try to find the actual equipo_id from torneo_equipos)
    const { data: localInscripto } = await supabase
      .from('torneo_equipos')
      .select('equipo_id')
      .eq('id', partido.local.id)
      .maybeSingle()

    const equipoId = localInscripto?.equipo_id ?? null

    // Create evento
    const { data: evento, error: errEvento } = await supabase
      .from('eventos')
      .insert({
        tenant_id,
        tipo_evento_slug: 'partido',
        titulo,
        fecha: fechaStr,
        hora_inicio: '00:00:00',
        equipo_id: equipoId,
        estado: 'programado',
      })
      .select('id')
      .single()

    if (errEvento || !evento) continue

    // Resolve rival name
    const { data: visitanteInscripto } = await supabase
      .from('torneo_equipos')
      .select('equipo_id, equipo_externo_nombre')
      .eq('id', partido.visitante.id)
      .maybeSingle()

    const rivalTexto =
      visitanteInscripto?.equipo_externo_nombre ?? partido.visitante.nombre

    // Create partidos_detalle
    const { error: errPartido } = await supabase.from('partidos_detalle').insert({
      tenant_id,
      evento_id: evento.id,
      torneo_id: input.torneo_id,
      categoria_id: input.categoria_id ?? null,
      equipo_id: equipoId,
      rival_texto: rivalTexto,
      condicion: 'local',
      fase: partido.fase,
      fecha_numero: partido.fecha_numero,
    })

    if (!errPartido) eventosCreados++
  }

  return { ok: true, eventos_creados: eventosCreados }
}

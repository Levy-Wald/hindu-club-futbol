'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'

export type RankingItem = {
  persona_id: string
  jugador_nombre: string
  equipo_nombre: string | null
  partidos_jugados: number
  goles: number
  asistencias: number
  tarjetas_amarillas: number
  tarjetas_rojas: number
  minutos_jugados: number
}

export type PerfilStats = {
  persona_id: string
  nombre: string
  apellido: string
  foto_url: string | null
  equipo_nombre: string | null
  totales: {
    partidos_jugados: number
    goles: number
    asistencias: number
    tarjetas_amarillas: number
    tarjetas_rojas: number
    minutos_jugados: number
  }
  partidos: {
    evento_id: string
    fecha: string
    rival: string
    marcador_local: number | null
    marcador_visitante: number | null
    goles: number
    asistencias: number
    tarjetas_amarillas: number
    tarjetas_rojas: number
    minutos_jugados: number
  }[]
}

export type StatsEquipo = {
  equipo_id: string
  equipo_nombre: string
  partidos_jugados: number
  goles_totales: number
  asistencias_totales: number
  tarjetas_amarillas: number
  tarjetas_rojas: number
}

async function getTenantId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: persona } = await supabase
    .from('personas')
    .select('tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  return persona?.tenant_id ?? TENANT_ID
}

export async function obtenerRankingJugadoresAction(input: {
  torneo_id?: string
  categoria_id?: string
  metrica?: 'goles' | 'asistencias' | 'tarjetas_amarillas' | 'minutos_jugados'
  top_n?: number
}): Promise<{ ok: true; ranking: RankingItem[] } | { ok: false; error: string }> {
  const tenant_id = await getTenantId()
  if (!tenant_id) return { ok: false, error: 'No autenticado' }

  const sr = createServiceRoleClient()
  const metrica = input.metrica ?? 'goles'
  const topN = input.top_n ?? 20

  // Build query joining partido_stats_jugador with personas and partidos_detalle
  const query = sr
    .from('partido_stats_jugador')
    .select('persona_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas, minutos_jugados, partido_evento_id')
    .eq('tenant_id', tenant_id)

  const { data: allStats, error } = await query

  if (error) return { ok: false, error: error.message }
  if (!allStats || allStats.length === 0) return { ok: true, ranking: [] }

  // Filter by torneo/categoria if specified
  let filteredStats = allStats
  if (input.torneo_id || input.categoria_id) {
    const eventoIds = allStats.map((s) => s.partido_evento_id)
    const uniqueIds = [...new Set(eventoIds)]

    let pdQuery = sr
      .from('partidos_detalle')
      .select('evento_id, torneo_id, categoria_id')
      .in('evento_id', uniqueIds)

    if (input.torneo_id) pdQuery = pdQuery.eq('torneo_id', input.torneo_id)
    if (input.categoria_id) pdQuery = pdQuery.eq('categoria_id', input.categoria_id)

    const { data: pds } = await pdQuery
    const validEventoIds = new Set((pds ?? []).map((pd) => pd.evento_id))
    filteredStats = allStats.filter((s) => validEventoIds.has(s.partido_evento_id))
  }

  // Aggregate by persona
  const agg = new Map<
    string,
    { persona_id: string; goles: number; asistencias: number; tarjetas_amarillas: number; tarjetas_rojas: number; minutos_jugados: number; partidos: Set<string> }
  >()

  for (const s of filteredStats) {
    if (!agg.has(s.persona_id)) {
      agg.set(s.persona_id, {
        persona_id: s.persona_id,
        goles: 0,
        asistencias: 0,
        tarjetas_amarillas: 0,
        tarjetas_rojas: 0,
        minutos_jugados: 0,
        partidos: new Set(),
      })
    }
    const a = agg.get(s.persona_id)!
    a.goles += s.goles ?? 0
    a.asistencias += s.asistencias ?? 0
    a.tarjetas_amarillas += s.tarjetas_amarillas ?? 0
    a.tarjetas_rojas += s.tarjetas_rojas ?? 0
    a.minutos_jugados += s.minutos_jugados ?? 0
    a.partidos.add(s.partido_evento_id)
  }

  // Sort by metrica
  const sorted = Array.from(agg.values())
    .sort((a, b) => (b[metrica] ?? 0) - (a[metrica] ?? 0))
    .slice(0, topN)

  // Hydrate personas
  const personaIds = sorted.map((s) => s.persona_id)
  if (personaIds.length === 0) return { ok: true, ranking: [] }

  const { data: personas } = await sr
    .from('personas')
    .select('id, nombre, apellido')
    .in('id', personaIds)

  // Get equipo for each persona
  const { data: equipoLinks } = await sr
    .from('personas_equipos')
    .select('persona_id, equipo_id')
    .in('persona_id', personaIds)
    .eq('activo', true)

  const equipoIds = [...new Set((equipoLinks ?? []).map((e) => e.equipo_id))]
  const { data: equipos } = await sr
    .from('equipos')
    .select('id, nombre')
    .in('id', equipoIds.length > 0 ? equipoIds : ['__none__'])

  const personaMap = new Map((personas ?? []).map((p) => [p.id, p]))
  const equipoLinkMap = new Map((equipoLinks ?? []).map((e) => [e.persona_id, e.equipo_id]))
  const equipoMap = new Map((equipos ?? []).map((e) => [e.id, e.nombre]))

  const ranking: RankingItem[] = sorted.map((s) => {
    const p = personaMap.get(s.persona_id)
    const eqId = equipoLinkMap.get(s.persona_id)
    return {
      persona_id: s.persona_id,
      jugador_nombre: p ? `${p.apellido}, ${p.nombre}` : s.persona_id.slice(0, 8),
      equipo_nombre: eqId ? equipoMap.get(eqId) ?? null : null,
      partidos_jugados: s.partidos.size,
      goles: s.goles,
      asistencias: s.asistencias,
      tarjetas_amarillas: s.tarjetas_amarillas,
      tarjetas_rojas: s.tarjetas_rojas,
      minutos_jugados: s.minutos_jugados,
    }
  })

  return { ok: true, ranking }
}

export async function obtenerStatsJugadorAction(input: {
  persona_id: string
  torneo_id?: string
}): Promise<{ ok: true; perfil: PerfilStats } | { ok: false; error: string }> {
  const tenant_id = await getTenantId()
  if (!tenant_id) return { ok: false, error: 'No autenticado' }

  const sr = createServiceRoleClient()

  // Get persona info
  const { data: persona } = await sr
    .from('personas')
    .select('id, nombre, apellido, foto_perfil_url')
    .eq('id', input.persona_id)
    .single()

  if (!persona) return { ok: false, error: 'Jugador no encontrado' }

  // Get equipo
  const { data: equipoLink } = await sr
    .from('personas_equipos')
    .select('equipo_id')
    .eq('persona_id', input.persona_id)
    .eq('activo', true)
    .limit(1)
    .maybeSingle()

  let equipoNombre: string | null = null
  if (equipoLink) {
    const { data: eq } = await sr
      .from('equipos')
      .select('nombre')
      .eq('id', equipoLink.equipo_id)
      .single()
    equipoNombre = eq?.nombre ?? null
  }

  // Get all stats for this persona
  const statsQuery = sr
    .from('partido_stats_jugador')
    .select('*')
    .eq('persona_id', input.persona_id)
    .eq('tenant_id', tenant_id)

  const { data: stats } = await statsQuery
  if (!stats || stats.length === 0) {
    return {
      ok: true,
      perfil: {
        persona_id: persona.id,
        nombre: persona.nombre ?? '',
        apellido: persona.apellido ?? '',
        foto_url: persona.foto_perfil_url,
        equipo_nombre: equipoNombre,
        totales: { partidos_jugados: 0, goles: 0, asistencias: 0, tarjetas_amarillas: 0, tarjetas_rojas: 0, minutos_jugados: 0 },
        partidos: [],
      },
    }
  }

  // Filter by torneo if specified
  const eventoIds = stats.map((s) => s.partido_evento_id)
  let pdQuery = sr
    .from('partidos_detalle')
    .select('evento_id, rival_texto, marcador_local, marcador_visitante, torneo_id, categoria_id')
    .in('evento_id', eventoIds)

  if (input.torneo_id) pdQuery = pdQuery.eq('torneo_id', input.torneo_id)

  const { data: pds } = await pdQuery
  const pdMap = new Map((pds ?? []).map((pd) => [pd.evento_id, pd]))

  // Get evento dates
  const { data: eventos } = await sr
    .from('eventos')
    .select('id, fecha')
    .in('id', eventoIds)

  const eventoFechaMap = new Map((eventos ?? []).map((e) => [e.id, e.fecha]))

  // Filter stats to only matching partidos
  const validStats = input.torneo_id
    ? stats.filter((s) => pdMap.has(s.partido_evento_id))
    : stats

  const totales = {
    partidos_jugados: validStats.length,
    goles: validStats.reduce((sum, s) => sum + (s.goles ?? 0), 0),
    asistencias: validStats.reduce((sum, s) => sum + (s.asistencias ?? 0), 0),
    tarjetas_amarillas: validStats.reduce((sum, s) => sum + (s.tarjetas_amarillas ?? 0), 0),
    tarjetas_rojas: validStats.reduce((sum, s) => sum + (s.tarjetas_rojas ?? 0), 0),
    minutos_jugados: validStats.reduce((sum, s) => sum + (s.minutos_jugados ?? 0), 0),
  }

  const partidos = validStats.map((s) => {
    const pd = pdMap.get(s.partido_evento_id)
    return {
      evento_id: s.partido_evento_id,
      fecha: eventoFechaMap.get(s.partido_evento_id) ?? '',
      rival: pd?.rival_texto ?? '—',
      marcador_local: pd?.marcador_local ?? null,
      marcador_visitante: pd?.marcador_visitante ?? null,
      goles: s.goles ?? 0,
      asistencias: s.asistencias ?? 0,
      tarjetas_amarillas: s.tarjetas_amarillas ?? 0,
      tarjetas_rojas: s.tarjetas_rojas ?? 0,
      minutos_jugados: s.minutos_jugados ?? 0,
    }
  })

  return {
    ok: true,
    perfil: {
      persona_id: persona.id,
      nombre: persona.nombre ?? '',
      apellido: persona.apellido ?? '',
      foto_url: persona.foto_perfil_url,
      equipo_nombre: equipoNombre,
      totales,
      partidos,
    },
  }
}

export async function obtenerStatsEquiposAction(input: {
  torneo_id?: string
}): Promise<{ ok: true; equipos: StatsEquipo[] } | { ok: false; error: string }> {
  const tenant_id = await getTenantId()
  if (!tenant_id) return { ok: false, error: 'No autenticado' }

  const sr = createServiceRoleClient()

  // Get all stats
  const { data: allStats } = await sr
    .from('partido_stats_jugador')
    .select('persona_id, partido_evento_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas')
    .eq('tenant_id', tenant_id)

  if (!allStats || allStats.length === 0) return { ok: true, equipos: [] }

  // Get partidos_detalle for equipo mapping
  const eventoIds = [...new Set(allStats.map((s) => s.partido_evento_id))]
  let pdQuery = sr
    .from('partidos_detalle')
    .select('evento_id, equipo_id')
    .in('evento_id', eventoIds)

  if (input.torneo_id) pdQuery = pdQuery.eq('torneo_id', input.torneo_id)

  const { data: pds } = await pdQuery
  const pdMap = new Map((pds ?? []).map((pd) => [pd.evento_id, pd.equipo_id]))

  // Aggregate by equipo
  const eqAgg = new Map<
    string,
    { equipo_id: string; goles: number; asistencias: number; tarjetas_amarillas: number; tarjetas_rojas: number; partidos: Set<string> }
  >()

  for (const s of allStats) {
    const equipoId = pdMap.get(s.partido_evento_id)
    if (!equipoId) continue

    if (!eqAgg.has(equipoId)) {
      eqAgg.set(equipoId, {
        equipo_id: equipoId,
        goles: 0,
        asistencias: 0,
        tarjetas_amarillas: 0,
        tarjetas_rojas: 0,
        partidos: new Set(),
      })
    }
    const a = eqAgg.get(equipoId)!
    a.goles += s.goles ?? 0
    a.asistencias += s.asistencias ?? 0
    a.tarjetas_amarillas += s.tarjetas_amarillas ?? 0
    a.tarjetas_rojas += s.tarjetas_rojas ?? 0
    a.partidos.add(s.partido_evento_id)
  }

  // Hydrate equipo names
  const eqIds = Array.from(eqAgg.keys())
  if (eqIds.length === 0) return { ok: true, equipos: [] }

  const { data: equipos } = await sr
    .from('equipos')
    .select('id, nombre')
    .in('id', eqIds)

  const eqNameMap = new Map((equipos ?? []).map((e) => [e.id, e.nombre]))

  const result: StatsEquipo[] = Array.from(eqAgg.values())
    .map((a) => ({
      equipo_id: a.equipo_id,
      equipo_nombre: eqNameMap.get(a.equipo_id) ?? a.equipo_id.slice(0, 8),
      partidos_jugados: a.partidos.size,
      goles_totales: a.goles,
      asistencias_totales: a.asistencias,
      tarjetas_amarillas: a.tarjetas_amarillas,
      tarjetas_rojas: a.tarjetas_rojas,
    }))
    .sort((a, b) => b.goles_totales - a.goles_totales)

  return { ok: true, equipos: result }
}

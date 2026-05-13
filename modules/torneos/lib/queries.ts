'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type {
  TorneoHidratado,
  Torneo,
  Categoria,
  EquipoInscripto,
  NivelCompetencia,
  Federacion,
  EquipoPropio,
} from './types'

export async function listarTorneos(
  tenant_id: string,
  filtros?: {
    tipo?: string
    estado?: string
    federacion_id?: string
    busqueda?: string
  }
): Promise<TorneoHidratado[]> {
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('torneos')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  if (filtros?.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros?.estado) query = query.eq('estado', filtros.estado)
  if (filtros?.federacion_id) query = query.eq('federacion_id', filtros.federacion_id)
  if (filtros?.busqueda) query = query.ilike('nombre', `%${filtros.busqueda}%`)

  const { data: torneos } = await query

  if (!torneos || torneos.length === 0) return []

  const torneoIds = torneos.map((t) => t.id)

  // Count categorias per torneo
  const { data: catCounts } = await supabase
    .from('torneo_categorias')
    .select('torneo_id')
    .in('torneo_id', torneoIds)

  const catCountMap: Record<string, number> = {}
  for (const c of catCounts ?? []) {
    catCountMap[c.torneo_id] = (catCountMap[c.torneo_id] ?? 0) + 1
  }

  // Count equipos per torneo
  const { data: eqCounts } = await supabase
    .from('torneo_equipos')
    .select('torneo_id')
    .in('torneo_id', torneoIds)
    .eq('activo', true)

  const eqCountMap: Record<string, number> = {}
  for (const e of eqCounts ?? []) {
    eqCountMap[e.torneo_id] = (eqCountMap[e.torneo_id] ?? 0) + 1
  }

  // Hydrate federaciones
  const fedIds = [...new Set(torneos.filter((t) => t.federacion_id).map((t) => t.federacion_id!))]
  let fedMap: Record<string, string> = {}
  if (fedIds.length > 0) {
    const { data: feds } = await supabase
      .from('entidades')
      .select('id, nombre')
      .in('id', fedIds)
    fedMap = (feds ?? []).reduce((acc, f) => {
      acc[f.id] = f.nombre
      return acc
    }, {} as Record<string, string>)
  }

  // Hydrate niveles
  const nivelSlugs = [...new Set(torneos.filter((t) => t.nivel_competencia_slug).map((t) => t.nivel_competencia_slug!))]
  let nivelMap: Record<string, string> = {}
  if (nivelSlugs.length > 0) {
    const { data: niveles } = await supabase
      .from('catalogo_niveles_competencia')
      .select('slug, nombre')
      .in('slug', nivelSlugs)
    nivelMap = (niveles ?? []).reduce((acc, n) => {
      acc[n.slug] = n.nombre
      return acc
    }, {} as Record<string, string>)
  }

  return torneos.map((t) => ({
    ...t,
    criterios_desempate: (t.criterios_desempate as string[]) ?? [],
    metadata: (t.metadata as Record<string, unknown>) ?? {},
    federacion_nombre: t.federacion_id ? (fedMap[t.federacion_id] ?? null) : null,
    nivel_competencia_nombre: t.nivel_competencia_slug ? (nivelMap[t.nivel_competencia_slug] ?? null) : null,
    categorias_count: catCountMap[t.id] ?? 0,
    equipos_count: eqCountMap[t.id] ?? 0,
  })) as TorneoHidratado[]
}

export async function obtenerTorneo(
  tenant_id: string,
  torneo_id: string
): Promise<{
  torneo: TorneoHidratado
  categorias: Categoria[]
  equipos: EquipoInscripto[]
} | null> {
  const supabase = createServiceRoleClient()

  const { data: torneo } = await supabase
    .from('torneos')
    .select('*')
    .eq('id', torneo_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!torneo) return null

  const [catRes, eqRes] = await Promise.all([
    supabase
      .from('torneo_categorias')
      .select('*')
      .eq('torneo_id', torneo_id)
      .order('orden'),
    supabase
      .from('torneo_equipos')
      .select('*')
      .eq('torneo_id', torneo_id)
      .eq('activo', true)
      .order('created_at'),
  ])

  const categorias = (catRes.data ?? []).map((c) => ({
    ...c,
    metadata: (c.metadata as Record<string, unknown>) ?? {},
  })) as Categoria[]

  const catMap: Record<string, string> = {}
  for (const c of categorias) {
    catMap[c.id] = c.nombre
  }

  // Hydrate equipo names
  const equipoIds = (eqRes.data ?? []).filter((e) => e.equipo_id).map((e) => e.equipo_id!)
  let equipoNombreMap: Record<string, string> = {}
  if (equipoIds.length > 0) {
    const { data: eqs } = await supabase
      .from('equipos')
      .select('id, nombre')
      .in('id', equipoIds)
    equipoNombreMap = (eqs ?? []).reduce((acc, e) => {
      acc[e.id] = e.nombre
      return acc
    }, {} as Record<string, string>)
  }

  const equipos: EquipoInscripto[] = (eqRes.data ?? []).map((e) => ({
    ...e,
    equipo_nombre: e.equipo_id
      ? (equipoNombreMap[e.equipo_id] ?? 'Equipo desconocido')
      : (e.equipo_externo_nombre ?? 'Sin nombre'),
    categoria_nombre: e.categoria_id ? (catMap[e.categoria_id] ?? null) : null,
  }))

  // Hydrate federacion + nivel for the single torneo
  let fedNombre: string | null = null
  if (torneo.federacion_id) {
    const { data: fed } = await supabase
      .from('entidades')
      .select('nombre')
      .eq('id', torneo.federacion_id)
      .single()
    fedNombre = fed?.nombre ?? null
  }

  let nivelNombre: string | null = null
  if (torneo.nivel_competencia_slug) {
    const { data: nivel } = await supabase
      .from('catalogo_niveles_competencia')
      .select('nombre')
      .eq('slug', torneo.nivel_competencia_slug)
      .single()
    nivelNombre = nivel?.nombre ?? null
  }

  return {
    torneo: {
      ...torneo,
      criterios_desempate: (torneo.criterios_desempate as string[]) ?? [],
      metadata: (torneo.metadata as Record<string, unknown>) ?? {},
      federacion_nombre: fedNombre,
      nivel_competencia_nombre: nivelNombre,
      categorias_count: categorias.length,
      equipos_count: equipos.length,
    } as TorneoHidratado,
    categorias,
    equipos,
  }
}

export async function listarFederaciones(
  tenant_id: string
): Promise<Federacion[]> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('entidades')
    .select('id, nombre')
    .eq('tenant_id', tenant_id)
    .eq('tipo', 'federacion')
    .order('nombre')
  return (data ?? []) as Federacion[]
}

export async function listarNivelesCompetencia(): Promise<NivelCompetencia[]> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('catalogo_niveles_competencia')
    .select('slug, nombre')
    .order('slug')
  return (data ?? []) as NivelCompetencia[]
}

export async function listarEquiposPropios(
  tenant_id: string
): Promise<EquipoPropio[]> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('equipos')
    .select('id, nombre')
    .eq('tenant_id', tenant_id)
    .order('nombre')
  return (data ?? []) as EquipoPropio[]
}

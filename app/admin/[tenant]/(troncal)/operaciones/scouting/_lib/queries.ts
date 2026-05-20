import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


export interface ScoutingFichaRow {
  id: string
  nombre: string
  apellido: string
  fecha_nacimiento: string | null
  posicion: string | null
  club_actual: string | null
  contacto: string | null
  estado: string
  observaciones: string | null
  evaluacion: number | null
  equipo_id: string | null
  persona_id: string | null
  scout_id: string | null
  created_at: string
  updated_at: string
  equipo_nombre: string | null
  scout_nombre: string | null
}

export interface FetchScoutingParams {
  search?: string
  estado?: string
  equipo_id?: string
}

export async function fetchScoutingFichas(
  params: FetchScoutingParams = {}
): Promise<ScoutingFichaRow[]> {
  const supabase = await createClient()

  let query = supabase
    .from('scouting_fichas')
    .select(
      `id, nombre, apellido, fecha_nacimiento, posicion, club_actual, contacto,
       estado, observaciones, evaluacion, equipo_id, persona_id, scout_id,
       created_at, updated_at,
       equipos!equipo_id(id, nombre),
       scout:personas!scout_id(id, nombre, apellido)`
    )
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (params.search) {
    query = query.or(
      `nombre.ilike.%${params.search}%,apellido.ilike.%${params.search}%`
    )
  }

  if (params.estado) {
    query = query.eq('estado', params.estado)
  }

  if (params.equipo_id) {
    query = query.eq('equipo_id', params.equipo_id)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []).map((row) => {
    const equipo = row.equipos as unknown as { id: string; nombre: string } | null
    const scout = row.scout as unknown as { id: string; nombre: string; apellido: string } | null

    return {
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      fecha_nacimiento: row.fecha_nacimiento,
      posicion: row.posicion,
      club_actual: row.club_actual,
      contacto: row.contacto,
      estado: row.estado,
      observaciones: row.observaciones,
      evaluacion: row.evaluacion,
      equipo_id: row.equipo_id,
      persona_id: row.persona_id,
      scout_id: row.scout_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      equipo_nombre: equipo?.nombre ?? null,
      scout_nombre: scout ? `${scout.nombre} ${scout.apellido}` : null,
    }
  })
}

export interface ScoutingFichaDetalle {
  id: string
  nombre: string
  apellido: string
  fecha_nacimiento: string | null
  posicion: string | null
  club_actual: string | null
  contacto: string | null
  estado: string
  observaciones: string | null
  evaluacion: number | null
  equipo_id: string | null
  persona_id: string | null
  scout_id: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
  equipo_nombre: string | null
  scout_nombre: string | null
}

export async function fetchScoutingFicha(
  id: string
): Promise<ScoutingFichaDetalle> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('scouting_fichas')
    .select(
      `id, nombre, apellido, fecha_nacimiento, posicion, club_actual, contacto,
       estado, observaciones, evaluacion, equipo_id, persona_id, scout_id,
       created_at, updated_at, metadata,
       equipos!equipo_id(id, nombre),
       scout:personas!scout_id(id, nombre, apellido)`
    )
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) throw error

  const equipo = data.equipos as unknown as { id: string; nombre: string } | null
  const scout = data.scout as unknown as { id: string; nombre: string; apellido: string } | null

  return {
    id: data.id,
    nombre: data.nombre,
    apellido: data.apellido,
    fecha_nacimiento: data.fecha_nacimiento,
    posicion: data.posicion,
    club_actual: data.club_actual,
    contacto: data.contacto,
    estado: data.estado,
    observaciones: data.observaciones,
    evaluacion: data.evaluacion,
    equipo_id: data.equipo_id,
    persona_id: data.persona_id,
    scout_id: data.scout_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    metadata: (data.metadata as Record<string, unknown>) ?? {},
    equipo_nombre: equipo?.nombre ?? null,
    scout_nombre: scout ? `${scout.nombre} ${scout.apellido}` : null,
  }
}

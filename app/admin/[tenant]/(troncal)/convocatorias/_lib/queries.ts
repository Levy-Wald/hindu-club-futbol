// F6.8 — Planificador de Partido (convocatoria). Queries.
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

const TIPOS_PARTIDO = ['partido', 'amistoso']

export interface PartidoRow {
  id: string
  titulo: string | null
  fecha_inicio: string | null
  hora_inicio: string | null
  equipo_nombre: string | null
  convocados_count: number
}

export async function fetchPartidos(): Promise<PartidoRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eventos')
    .select('id, titulo, fecha_inicio, hora_inicio, equipo:equipos!equipo_id(nombre), convocados:evento_convocados(count)')
    .eq('tenant_id', TENANT_ID)
    .in('tipo_evento_slug', TIPOS_PARTIDO)
    .not('equipo_id', 'is', null)
    .is('deleted_at', null)
    .order('fecha_inicio', { ascending: false })
    .limit(60)
  if (error) throw error
  return (data ?? []).map((e) => ({
    id: e.id,
    titulo: e.titulo,
    fecha_inicio: e.fecha_inicio,
    hora_inicio: e.hora_inicio,
    equipo_nombre: (e.equipo as unknown as { nombre: string } | null)?.nombre ?? null,
    convocados_count: (e.convocados as { count: number }[])?.[0]?.count ?? 0,
  }))
}

export type RespuestaJugador = 'pendiente' | 'aceptado' | 'rechazado' | 'tentativa'

export interface JugadorConvocatoria {
  persona_id: string
  nombre: string
  apellido: string
  dorsal: number | null
  posicion: string | null
  estado: 'titular' | 'suplente' | 'convocado' | null // null = no convocado
  respuesta: RespuestaJugador
  motivo_respuesta: string | null
}

export async function fetchConvocatoria(eventoId: string) {
  const supabase = await createClient()

  const { data: evento, error } = await supabase
    .from('eventos')
    .select('id, titulo, fecha_inicio, hora_inicio, equipo_id, equipo:equipos!equipo_id(id, nombre)')
    .eq('id', eventoId)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .single()
  if (error) throw error

  const equipoId = evento.equipo_id as string | null

  const [plantelRes, convocadosRes] = await Promise.all([
    equipoId
      ? supabase
          .from('personas_equipos')
          .select('persona_id, dorsal, posicion, persona:personas!persona_id(nombre, apellido)')
          .eq('tenant_id', TENANT_ID)
          .eq('equipo_id', equipoId)
          .eq('activo', true)
      : Promise.resolve({ data: [] as unknown[] }),
    supabase.from('evento_convocados').select('persona_id, estado, respuesta, motivo_respuesta').eq('evento_id', eventoId),
  ])

  const convPorPersona = new Map<string, { estado: 'titular' | 'suplente' | 'convocado'; respuesta: RespuestaJugador; motivo_respuesta: string | null }>()
  for (const c of (convocadosRes.data ?? []) as Array<{ persona_id: string; estado: 'titular' | 'suplente' | 'convocado'; respuesta: RespuestaJugador; motivo_respuesta: string | null }>) {
    convPorPersona.set(c.persona_id, { estado: c.estado, respuesta: c.respuesta ?? 'pendiente', motivo_respuesta: c.motivo_respuesta })
  }

  const jugadores: JugadorConvocatoria[] = ((plantelRes.data ?? []) as Array<Record<string, unknown>>)
    .map((pe) => {
      const persona = pe.persona as unknown as { nombre: string; apellido: string } | null
      const conv = convPorPersona.get(pe.persona_id as string)
      return {
        persona_id: pe.persona_id as string,
        nombre: persona?.nombre ?? '',
        apellido: persona?.apellido ?? '',
        dorsal: (pe.dorsal as number | null) ?? null,
        posicion: (pe.posicion as string | null) ?? null,
        estado: conv?.estado ?? null,
        respuesta: conv?.respuesta ?? 'pendiente',
        motivo_respuesta: conv?.motivo_respuesta ?? null,
      }
    })
    .sort((a, b) => a.apellido.localeCompare(b.apellido))

  return {
    evento,
    equipoNombre: (evento.equipo as unknown as { nombre: string } | null)?.nombre ?? null,
    jugadores,
  }
}

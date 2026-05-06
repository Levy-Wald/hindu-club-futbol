import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export interface EventoSemana {
  id: string
  fecha: string | null
  dia_semana: number | null
  hora_inicio: string
  hora_fin: string
  tipo_actividad: string
  titulo: string | null
  hora_citacion: string | null
  descripcion: string | null
  rival: string | null
  notas_pre: string | null
  notas_post: string | null
  equipo: {
    id: string
    nombre: string
    color_principal: string | null
    escudo_url: string | null
  } | null
  sede: { id: string; nombre: string } | null
  cancha: { id: string; nombre: string } | null
}

export async function fetchEventosSemana(
  fechaInicio: string,
  fechaFin: string
): Promise<EventoSemana[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('equipos_horarios')
    .select(
      `id, fecha, dia_semana, hora_inicio, hora_fin, tipo_actividad, titulo,
       hora_citacion, descripcion, rival, notas_pre, notas_post,
       equipos!equipo_id(id, nombre, color_principal, escudo_url),
       sedes!sede_id(id, nombre),
       canchas!cancha_id(id, nombre)`
    )
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    fecha: row.fecha,
    dia_semana: row.dia_semana,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,
    tipo_actividad: row.tipo_actividad,
    titulo: row.titulo,
    hora_citacion: row.hora_citacion,
    descripcion: row.descripcion,
    rival: (row as Record<string, unknown>).rival as string | null,
    notas_pre: (row as Record<string, unknown>).notas_pre as string | null,
    notas_post: (row as Record<string, unknown>).notas_post as string | null,
    equipo: row.equipos as unknown as EventoSemana['equipo'],
    sede: row.sedes as unknown as EventoSemana['sede'],
    cancha: row.canchas as unknown as EventoSemana['cancha'],
  }))
}

// --- Asistencias ---

export interface AsistenciaPersona {
  id: string
  persona_id: string
  estado: string
  nota: string | null
  respondido_at: string | null
  persona: {
    id: string
    nombre: string
    apellido: string
    numero_documento: string | null
    foto_perfil_url: string | null
  } | null
}

export async function fetchAsistenciasEvento(eventoId: string): Promise<AsistenciaPersona[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('evento_asistencias')
    .select(
      `id, persona_id, estado, nota, respondido_at,
       personas!persona_id(id, nombre, apellido, numero_documento, foto_perfil_url)`
    )
    .eq('evento_id', eventoId)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    persona_id: row.persona_id,
    estado: row.estado,
    nota: row.nota,
    respondido_at: row.respondido_at,
    persona: row.personas as unknown as AsistenciaPersona['persona'],
  }))
}

export interface EquipoSimple {
  id: string
  nombre: string
}

export async function fetchEquiposActivos(): Promise<EquipoSimple[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('equipos')
    .select('id, nombre')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) throw error
  return data ?? []
}

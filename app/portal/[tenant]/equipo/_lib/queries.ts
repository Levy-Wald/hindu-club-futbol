// F3 portal — Mi equipo + Mis partidos. Reutiliza el modelo de personas_equipos
// + eventos (partidos) + evento_convocados. Filtrado por la persona propia.
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

export interface MiEquipo {
  equipo_id: string
  nombre: string
  disciplina_slug: string | null
  categoria: string | null
  rol: string | null
  dorsal: number | null
  posicion: string | null
}

export interface CompaneroPlantel {
  nombre: string
  apellido: string
  dorsal: number | null
  rol: string | null
}

export interface MiPartido {
  id: string
  titulo: string | null
  fecha_inicio: string | null
  hora_inicio: string | null
  equipo_nombre: string | null
  mi_convocatoria: 'titular' | 'suplente' | 'convocado' | null
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function fetchMisEquipos(personaId: string): Promise<MiEquipo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personas_equipos')
    .select('rol_equipo_slug, dorsal, posicion, equipo:equipos!equipo_id(id, nombre, disciplina_slug, categoria:categorias_equipo!categoria_id(nombre_display))')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .eq('activo', true)
  if (error) throw error
  return (data ?? []).map((pe) => {
    const eq = pe.equipo as unknown as { id: string; nombre: string; disciplina_slug: string | null; categoria: { nombre_display: string } | null } | null
    return {
      equipo_id: eq?.id ?? '',
      nombre: eq?.nombre ?? '',
      disciplina_slug: eq?.disciplina_slug ?? null,
      categoria: eq?.categoria?.nombre_display ?? null,
      rol: pe.rol_equipo_slug,
      dorsal: pe.dorsal,
      posicion: pe.posicion,
    }
  }).filter((e) => e.equipo_id)
}

export async function fetchPlantel(equipoId: string): Promise<CompaneroPlantel[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('personas_equipos')
    .select('rol_equipo_slug, dorsal, persona:personas!persona_id(nombre, apellido)')
    .eq('tenant_id', TENANT_ID)
    .eq('equipo_id', equipoId)
    .eq('activo', true)
  return (data ?? [])
    .map((pe) => {
      const p = pe.persona as unknown as { nombre: string; apellido: string } | null
      return { nombre: p?.nombre ?? '', apellido: p?.apellido ?? '', dorsal: pe.dorsal, rol: pe.rol_equipo_slug }
    })
    .sort((a, b) => a.apellido.localeCompare(b.apellido))
}

export interface ReferenteEquipo {
  nombre: string
  apellido: string
  rol: string
  telefono: string | null
  whatsapp: string | null
  email: string | null
}

// Referentes contactables del equipo (cuerpo técnico + capitanes/subcapitanes/
// delegados): todos menos los jugadores. Con teléfono/WhatsApp/email para que el
// socio pueda contactarlos por mensaje, llamada o mail.
export async function fetchReferentesEquipo(equipoId: string): Promise<ReferenteEquipo[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('personas_equipos')
    .select('rol_equipo_slug, persona:personas!persona_id(nombre, apellido, telefono_principal, whatsapp, email_principal)')
    .eq('tenant_id', TENANT_ID)
    .eq('equipo_id', equipoId)
    .eq('activo', true)
    .neq('rol_equipo_slug', 'jugador')
  return (data ?? []).map((pe) => {
    const p = pe.persona as unknown as { nombre: string; apellido: string; telefono_principal: string | null; whatsapp: string | null; email_principal: string | null } | null
    return {
      nombre: p?.nombre ?? '',
      apellido: p?.apellido ?? '',
      rol: pe.rol_equipo_slug,
      telefono: p?.telefono_principal ?? null,
      whatsapp: p?.whatsapp ?? null,
      email: p?.email_principal ?? null,
    }
  })
}

export interface EventoEquipo {
  id: string
  titulo: string | null
  tipo: string
  fecha_inicio: string | null
  hora_inicio: string | null
  equipo_id: string
  mi_convocatoria: 'titular' | 'suplente' | 'convocado' | null
}

// Calendario del equipo: partidos + amistosos + entrenamientos futuros (incluye
// hoy), ordenados por fecha. Se usa para "próximo evento" y el calendario total.
export async function fetchEventosEquipo(personaId: string, equipoIds: string[]): Promise<EventoEquipo[]> {
  if (equipoIds.length === 0) return []
  const supabase = await createClient()
  const hoy = ymd(new Date())

  const [eventosRes, convocatoriasRes] = await Promise.all([
    supabase
      .from('eventos')
      .select('id, titulo, tipo_evento_slug, fecha_inicio, hora_inicio, equipo_id')
      .eq('tenant_id', TENANT_ID)
      .in('tipo_evento_slug', ['partido', 'amistoso', 'entrenamiento'])
      .in('equipo_id', equipoIds)
      .is('deleted_at', null)
      .gte('fecha_inicio', hoy)
      .order('fecha_inicio', { ascending: true })
      .order('hora_inicio', { ascending: true })
      .limit(60),
    supabase.from('evento_convocados').select('evento_id, estado').eq('persona_id', personaId),
  ])

  const miEstado = new Map<string, 'titular' | 'suplente' | 'convocado'>()
  for (const c of (convocatoriasRes.data ?? []) as { evento_id: string; estado: 'titular' | 'suplente' | 'convocado' }[]) {
    miEstado.set(c.evento_id, c.estado)
  }

  return (eventosRes.data ?? []).map((e) => ({
    id: e.id,
    titulo: e.titulo,
    tipo: e.tipo_evento_slug,
    fecha_inicio: e.fecha_inicio,
    hora_inicio: e.hora_inicio,
    equipo_id: e.equipo_id as string,
    mi_convocatoria: miEstado.get(e.id) ?? null,
  }))
}

export async function fetchMisPartidos(personaId: string, equipoIds: string[]): Promise<MiPartido[]> {
  if (equipoIds.length === 0) return []
  const supabase = await createClient()
  const hoy = ymd(new Date())

  const [partidosRes, convocatoriasRes] = await Promise.all([
    supabase
      .from('eventos')
      .select('id, titulo, fecha_inicio, hora_inicio, equipo:equipos!equipo_id(nombre)')
      .eq('tenant_id', TENANT_ID)
      .in('tipo_evento_slug', ['partido', 'amistoso'])
      .in('equipo_id', equipoIds)
      .is('deleted_at', null)
      .gte('fecha_inicio', hoy)
      .order('fecha_inicio', { ascending: true })
      .limit(20),
    supabase.from('evento_convocados').select('evento_id, estado').eq('persona_id', personaId),
  ])

  const miEstado = new Map<string, 'titular' | 'suplente' | 'convocado'>()
  for (const c of (convocatoriasRes.data ?? []) as { evento_id: string; estado: 'titular' | 'suplente' | 'convocado' }[]) {
    miEstado.set(c.evento_id, c.estado)
  }

  return (partidosRes.data ?? []).map((e) => ({
    id: e.id,
    titulo: e.titulo,
    fecha_inicio: e.fecha_inicio,
    hora_inicio: e.hora_inicio,
    equipo_nombre: (e.equipo as unknown as { nombre: string } | null)?.nombre ?? null,
    mi_convocatoria: miEstado.get(e.id) ?? null,
  }))
}

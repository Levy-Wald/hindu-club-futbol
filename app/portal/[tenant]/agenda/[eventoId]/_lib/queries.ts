// F3 portal — detalle de evento para el socio (con su invitación y convocatoria).
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'

export interface EventoDetalle {
  id: string
  titulo: string | null
  tipo_evento_slug: string
  fecha_inicio: string | null
  hora_inicio: string | null
  hora_fin: string | null
  hora_citacion: string | null
  descripcion: string | null
  lugar_encuentro: string | null
  equipo_nombre: string | null
  sede_nombre: string | null
  sede_direccion: string | null
  cancha_nombre: string | null
  mi_invitacion_id: string | null
  mi_invitacion_estado: string | null
  mi_convocatoria: string | null
}

export async function fetchEventoDetalle(eventoId: string, personaId: string): Promise<EventoDetalle | null> {
  const supabase = createServiceRoleClient()

  const { data: e } = await supabase
    .from('eventos')
    .select(`
      id, titulo, tipo_evento_slug, fecha_inicio, hora_inicio, hora_fin, hora_citacion,
      descripcion, lugar_encuentro,
      equipo:equipos!equipo_id(nombre),
      sede:sedes!sede_id(nombre, direccion),
      cancha:canchas!cancha_id(nombre)
    `)
    .eq('id', eventoId)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .maybeSingle()
  if (!e) return null

  const [invRes, convRes] = await Promise.all([
    supabase.from('evento_invitados').select('id, estado_invitacion').eq('evento_id', eventoId).eq('persona_id', personaId).maybeSingle(),
    supabase.from('evento_convocados').select('estado').eq('evento_id', eventoId).eq('persona_id', personaId).maybeSingle(),
  ])

  return {
    id: e.id,
    titulo: e.titulo,
    tipo_evento_slug: e.tipo_evento_slug,
    fecha_inicio: e.fecha_inicio,
    hora_inicio: e.hora_inicio,
    hora_fin: e.hora_fin,
    hora_citacion: e.hora_citacion,
    descripcion: e.descripcion,
    lugar_encuentro: e.lugar_encuentro,
    equipo_nombre: (e.equipo as unknown as { nombre: string } | null)?.nombre ?? null,
    sede_nombre: (e.sede as unknown as { nombre: string } | null)?.nombre ?? null,
    sede_direccion: (e.sede as unknown as { direccion: string } | null)?.direccion ?? null,
    cancha_nombre: (e.cancha as unknown as { nombre: string } | null)?.nombre ?? null,
    mi_invitacion_id: invRes.data?.id ?? null,
    mi_invitacion_estado: invRes.data?.estado_invitacion ?? null,
    mi_convocatoria: convRes.data?.estado ?? null,
  }
}

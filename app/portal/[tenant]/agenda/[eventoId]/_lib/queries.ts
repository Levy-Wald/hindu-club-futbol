// F3 portal — detalle de evento para el socio (con su invitación y convocatoria).
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'

export interface ConvocadoEvento {
  nombre: string
  apellido: string
  estado: string
}

export interface ResponsableEvento {
  persona_id: string
  nombre: string
  apellido: string
  telefono: string | null
  whatsapp: string | null
  email: string | null
}

export interface EventoDetalle {
  id: string
  titulo: string | null
  tipo_evento_slug: string
  fecha_inicio: string | null
  fecha_fin: string | null
  hora_inicio: string | null
  hora_fin: string | null
  hora_citacion: string | null
  descripcion: string | null
  lugar_encuentro: string | null
  equipo_nombre: string | null
  sede_nombre: string | null
  sede_direccion: string | null
  sede_mapa_url: string | null
  cancha_nombre: string | null
  mi_invitacion_id: string | null
  mi_invitacion_estado: string | null
  mi_convocatoria: string | null
  mi_respuesta: string | null
  mi_motivo_respuesta: string | null
  convocados: ConvocadoEvento[]
  responsables: ResponsableEvento[]
}

export async function fetchEventoDetalle(eventoId: string, personaId: string): Promise<EventoDetalle | null> {
  const supabase = createServiceRoleClient()

  const { data: e } = await supabase
    .from('eventos')
    .select(`
      id, titulo, tipo_evento_slug, fecha_inicio, fecha_fin, hora_inicio, hora_fin, hora_citacion,
      descripcion, lugar_encuentro, responsables_persona_id,
      equipo:equipos!equipo_id(nombre),
      sede:sedes!sede_id(nombre, direccion, mapa_url),
      cancha:canchas!cancha_id(nombre)
    `)
    .eq('id', eventoId)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .maybeSingle()
  if (!e) return null

  const responsablesIds = (e.responsables_persona_id as string[] | null) ?? []

  const [invRes, convRes, convocadosRes, responsablesRes] = await Promise.all([
    supabase.from('evento_invitados').select('id, estado_invitacion').eq('evento_id', eventoId).eq('persona_id', personaId).maybeSingle(),
    supabase.from('evento_convocados').select('estado, respuesta, motivo_respuesta').eq('evento_id', eventoId).eq('persona_id', personaId).maybeSingle(),
    supabase.from('evento_convocados').select('estado, persona:personas!persona_id(nombre, apellido)').eq('evento_id', eventoId),
    responsablesIds.length > 0
      ? supabase.from('personas').select('id, nombre, apellido, telefono_principal, whatsapp, email_principal').in('id', responsablesIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ])

  const ordenEstado: Record<string, number> = { titular: 0, suplente: 1, convocado: 2 }
  const convocados: ConvocadoEvento[] = (convocadosRes.data ?? [])
    .map((c) => {
      const p = c.persona as unknown as { nombre: string; apellido: string } | null
      return { nombre: p?.nombre ?? '', apellido: p?.apellido ?? '', estado: c.estado as string }
    })
    .sort((a, b) => (ordenEstado[a.estado] ?? 9) - (ordenEstado[b.estado] ?? 9) || a.apellido.localeCompare(b.apellido))

  const responsables: ResponsableEvento[] = ((responsablesRes.data ?? []) as Array<{ id: string; nombre: string; apellido: string; telefono_principal: string | null; whatsapp: string | null; email_principal: string | null }>)
    .map((p) => ({
      persona_id: p.id, nombre: p.nombre, apellido: p.apellido,
      telefono: p.telefono_principal, whatsapp: p.whatsapp, email: p.email_principal,
    }))

  return {
    id: e.id,
    titulo: e.titulo,
    tipo_evento_slug: e.tipo_evento_slug,
    fecha_inicio: e.fecha_inicio,
    fecha_fin: e.fecha_fin,
    hora_inicio: e.hora_inicio,
    hora_fin: e.hora_fin,
    hora_citacion: e.hora_citacion,
    descripcion: e.descripcion,
    lugar_encuentro: e.lugar_encuentro,
    equipo_nombre: (e.equipo as unknown as { nombre: string } | null)?.nombre ?? null,
    sede_nombre: (e.sede as unknown as { nombre: string } | null)?.nombre ?? null,
    sede_direccion: (e.sede as unknown as { direccion: string } | null)?.direccion ?? null,
    sede_mapa_url: (e.sede as unknown as { mapa_url: string | null } | null)?.mapa_url ?? null,
    cancha_nombre: (e.cancha as unknown as { nombre: string } | null)?.nombre ?? null,
    mi_invitacion_id: invRes.data?.id ?? null,
    mi_invitacion_estado: invRes.data?.estado_invitacion ?? null,
    mi_convocatoria: convRes.data?.estado ?? null,
    mi_respuesta: (convRes.data as { respuesta?: string } | null)?.respuesta ?? null,
    mi_motivo_respuesta: (convRes.data as { motivo_respuesta?: string | null } | null)?.motivo_respuesta ?? null,
    convocados,
    responsables,
  }
}

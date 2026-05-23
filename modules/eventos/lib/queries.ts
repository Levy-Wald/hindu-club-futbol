'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { InvitacionPendiente, EventoInvitado, EstadoInvitacion } from './types'

// ── Calendar: eventos por rango de fechas (todos los módulos) ──

export async function obtenerEventosCalendario(
  tenantId: string,
  fechaDesde: string,
  fechaHasta: string,
  filtros?: { modulo_origen?: string; equipo_id?: string; tipo_evento_slug?: string }
) {
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('eventos')
    .select(`
      id, titulo, fecha_inicio, fecha_fin, hora_inicio, hora_fin, tipo_evento_slug,
      equipo_id, cancha_id, sede_id, color, estado,
      es_recurrente, evento_padre_id, serie_uuid, modulo_origen,
      espacio_virtual_tipo, etiquetas, responsables_persona_id,
      periodicidad, lugar_encuentro
    `)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .gte('fecha_inicio', fechaDesde)
    .lte('fecha_inicio', fechaHasta)
    .order('fecha_inicio', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (filtros?.modulo_origen) query = query.eq('modulo_origen', filtros.modulo_origen)
  if (filtros?.equipo_id) query = query.eq('equipo_id', filtros.equipo_id)
  if (filtros?.tipo_evento_slug) query = query.eq('tipo_evento_slug', filtros.tipo_evento_slug)

  const { data, error } = await query
  if (error) throw error

  if (!data || data.length === 0) return []

  // Hydrate equipo + cancha names
  const equipoIds = [...new Set(data.map(e => e.equipo_id).filter(Boolean))] as string[]
  const canchaIds = [...new Set(data.map(e => e.cancha_id).filter(Boolean))] as string[]

  const [equiposRes, canchasRes] = await Promise.all([
    equipoIds.length > 0
      ? supabase.from('equipos').select('id, nombre').in('id', equipoIds)
      : Promise.resolve({ data: [] as Array<{ id: string; nombre: string }> }),
    canchaIds.length > 0
      ? supabase.from('canchas').select('id, nombre').in('id', canchaIds)
      : Promise.resolve({ data: [] as Array<{ id: string; nombre: string }> }),
  ])

  const equiposMap = new Map((equiposRes.data ?? []).map(e => [e.id, e.nombre]))
  const canchasMap = new Map((canchasRes.data ?? []).map(c => [c.id, c.nombre]))

  return data.map(e => ({
    ...e,
    equipo_nombre: e.equipo_id ? equiposMap.get(e.equipo_id) ?? null : null,
    cancha_nombre: e.cancha_id ? canchasMap.get(e.cancha_id) ?? null : null,
  }))
}

// ── Mi calendario: eventos donde el usuario es responsable ──

export async function obtenerEventosPersonales(
  personaId: string,
  tenantId: string,
  fechaDesde: string,
  fechaHasta: string,
) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('eventos')
    .select(`
      id, titulo, fecha_inicio, fecha_fin, hora_inicio, hora_fin, tipo_evento_slug,
      equipo_id, cancha_id, sede_id, color, estado,
      es_recurrente, evento_padre_id, serie_uuid, modulo_origen,
      espacio_virtual_tipo, etiquetas, responsables_persona_id,
      periodicidad, lugar_encuentro
    `)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .contains('responsables_persona_id', [personaId])
    .gte('fecha_inicio', fechaDesde)
    .lte('fecha_inicio', fechaHasta)
    .order('fecha_inicio', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) return []

  const equipoIds = [...new Set(data.map(e => e.equipo_id).filter(Boolean))] as string[]
  const equiposMap = new Map<string, string>()
  if (equipoIds.length > 0) {
    const { data: equipos } = await supabase.from('equipos').select('id, nombre').in('id', equipoIds)
    for (const eq of equipos ?? []) equiposMap.set(eq.id, eq.nombre)
  }

  return data.map(e => ({
    ...e,
    equipo_nombre: e.equipo_id ? equiposMap.get(e.equipo_id) ?? null : null,
    cancha_nombre: null as string | null,
  }))
}

// ── Eventos por módulo ──

export async function obtenerEventosPorModulo(
  moduloOrigen: string,
  tenantId: string,
  fechaDesde: string,
  fechaHasta: string,
) {
  return obtenerEventosCalendario(tenantId, fechaDesde, fechaHasta, { modulo_origen: moduloOrigen })
}

// ── Detalle de un evento ──

export async function obtenerEventoDetalle(eventoId: string, tenantId: string) {
  const supabase = createServiceRoleClient()

  const { data: evento, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('id', eventoId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  if (error || !evento) return null

  // Hydrate names
  const responsableIds = (evento.responsables_persona_id as string[]) ?? []

  const [equipoRes, sedeRes, canchaRes, responsablesRes] = await Promise.all([
    evento.equipo_id
      ? supabase.from('equipos').select('nombre').eq('id', evento.equipo_id).maybeSingle()
      : { data: null },
    evento.sede_id
      ? supabase.from('sedes').select('nombre').eq('id', evento.sede_id).maybeSingle()
      : { data: null },
    evento.cancha_id
      ? supabase.from('canchas').select('nombre').eq('id', evento.cancha_id).maybeSingle()
      : { data: null },
    responsableIds.length > 0
      ? supabase.from('personas').select('id, nombre, apellido').in('id', responsableIds)
      : Promise.resolve({ data: [] as Array<{ id: string; nombre: string; apellido: string }> }),
  ])

  return {
    ...evento,
    equipo_nombre: equipoRes?.data?.nombre ?? null,
    sede_nombre: sedeRes?.data?.nombre ?? null,
    cancha_nombre: canchaRes?.data?.nombre ?? null,
    responsables: (responsablesRes.data ?? []).map(p => ({
      id: p.id,
      nombre_completo: `${p.nombre} ${p.apellido}`,
    })),
  }
}

// ── Evento con invitados ──

export async function obtenerEventoConInvitados(eventoId: string, tenantId: string) {
  const evento = await obtenerEventoDetalle(eventoId, tenantId)
  if (!evento) return null

  const supabase = createServiceRoleClient()
  const { data: invitados } = await supabase
    .from('evento_invitados')
    .select('*')
    .eq('evento_id', eventoId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  // Hydrate persona names for invitados
  const personaIds = (invitados ?? []).map(i => i.persona_id).filter(Boolean) as string[]
  const personasMap = new Map<string, string>()
  if (personaIds.length > 0) {
    const { data: personas } = await supabase.from('personas').select('id, nombre, apellido').in('id', personaIds)
    for (const p of personas ?? []) personasMap.set(p.id, `${p.nombre} ${p.apellido}`)
  }

  return {
    ...evento,
    invitados: (invitados ?? []).map(i => ({
      ...(i as unknown as EventoInvitado),
      persona_nombre: i.persona_id ? personasMap.get(i.persona_id) ?? null : null,
    })),
  }
}

// ── Invitaciones pendientes de una persona ──

export async function obtenerInvitacionesPendientes(
  personaId: string,
  tenantId: string
): Promise<InvitacionPendiente[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('evento_invitados')
    .select(`
      id,
      evento_id,
      estado_invitacion,
      eventos!evento_id(titulo, fecha_inicio, hora_inicio, tipo_evento_slug, equipo_id)
    `)
    .eq('persona_id', personaId)
    .eq('tenant_id', tenantId)
    .eq('estado_invitacion', 'pendiente')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  const equipoIds = [...new Set(
    data
      .map(d => (d.eventos as unknown as { equipo_id: string | null })?.equipo_id)
      .filter(Boolean)
  )] as string[]

  const equiposMap = new Map<string, string>()
  if (equipoIds.length > 0) {
    const { data: equipos } = await supabase.from('equipos').select('id, nombre').in('id', equipoIds)
    for (const eq of equipos ?? []) equiposMap.set(eq.id, eq.nombre)
  }

  return data.map(d => {
    const ev = d.eventos as unknown as {
      titulo: string | null
      fecha_inicio: string | null
      hora_inicio: string | null
      tipo_evento_slug: string
      equipo_id: string | null
    }
    return {
      evento_invitado_id: d.id,
      evento_id: d.evento_id,
      titulo: ev?.titulo ?? null,
      fecha_inicio: ev?.fecha_inicio ?? null,
      hora_inicio: ev?.hora_inicio ?? null,
      tipo_evento_slug: ev?.tipo_evento_slug ?? 'otro',
      equipo_nombre: ev?.equipo_id ? equiposMap.get(ev.equipo_id) ?? null : null,
      estado_invitacion: d.estado_invitacion as InvitacionPendiente['estado_invitacion'],
    }
  })
}

// ── Invitation statuses for calendar (for graying) ──

export async function obtenerMisInvitaciones(
  personaId: string,
  tenantId: string,
  eventoIds: string[]
): Promise<Map<string, EstadoInvitacion>> {
  if (eventoIds.length === 0) return new Map()

  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('evento_invitados')
    .select('evento_id, estado_invitacion')
    .eq('persona_id', personaId)
    .eq('tenant_id', tenantId)
    .in('evento_id', eventoIds)
    .is('deleted_at', null)

  const map = new Map<string, EstadoInvitacion>()
  for (const d of data ?? []) {
    map.set(d.evento_id, d.estado_invitacion as EstadoInvitacion)
  }
  return map
}

// ── Report: Admin - event summary with invitation counts ──

export async function obtenerReporteEventosAdmin(
  tenantId: string,
  fechaDesde: string,
  fechaHasta: string,
) {
  const supabase = createServiceRoleClient()

  const { data: eventos } = await supabase
    .from('eventos')
    .select('id, titulo, fecha_inicio, fecha_fin, tipo_evento_slug, responsables_persona_id, estado')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .gte('fecha_inicio', fechaDesde)
    .lte('fecha_inicio', fechaHasta)
    .order('fecha_inicio', { ascending: false })

  if (!eventos || eventos.length === 0) return []

  const eventoIds = eventos.map(e => e.id)

  const { data: invitaciones } = await supabase
    .from('evento_invitados')
    .select('evento_id, estado_invitacion')
    .in('evento_id', eventoIds)
    .is('deleted_at', null)

  // Aggregate counts per evento
  const counts = new Map<string, { total: number; confirmados: number; pendientes: number; rechazados: number }>()
  for (const inv of invitaciones ?? []) {
    if (!counts.has(inv.evento_id)) {
      counts.set(inv.evento_id, { total: 0, confirmados: 0, pendientes: 0, rechazados: 0 })
    }
    const c = counts.get(inv.evento_id)!
    c.total++
    if (inv.estado_invitacion === 'aceptado') c.confirmados++
    else if (inv.estado_invitacion === 'pendiente') c.pendientes++
    else if (inv.estado_invitacion === 'rechazado') c.rechazados++
  }

  return eventos.map(e => ({
    ...e,
    invitaciones: counts.get(e.id) ?? { total: 0, confirmados: 0, pendientes: 0, rechazados: 0 },
  }))
}

// ── Report: Confirmed attendees for an event ──

export async function obtenerConfirmadosEvento(eventoId: string, tenantId: string) {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('evento_invitados')
    .select('id, persona_id, email_externo, invitado_tipo, estado_invitacion, respuesta_at')
    .eq('evento_id', eventoId)
    .eq('tenant_id', tenantId)
    .eq('estado_invitacion', 'aceptado')
    .is('deleted_at', null)

  if (!data || data.length === 0) return []

  const personaIds = data.map(d => d.persona_id).filter(Boolean) as string[]
  const personasMap = new Map<string, { nombre: string; apellido: string; numero_documento: string | null }>()
  if (personaIds.length > 0) {
    const { data: personas } = await supabase
      .from('personas')
      .select('id, nombre, apellido, numero_documento')
      .in('id', personaIds)
    for (const p of personas ?? []) personasMap.set(p.id, p)
  }

  return data.map(d => ({
    ...d,
    persona: d.persona_id ? personasMap.get(d.persona_id) ?? null : null,
  }))
}

// ── Report: External visitors for security ──

export async function obtenerVisitantesExternos(tenantId: string, fechaDesde: string) {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('evento_invitados')
    .select(`
      id, email_externo, estado_invitacion,
      eventos!evento_id(id, titulo, fecha_inicio, codigo_acceso)
    `)
    .eq('tenant_id', tenantId)
    .eq('invitado_tipo', 'email_externo')
    .is('deleted_at', null)

  if (!data) return []

  return data
    .filter(d => {
      const ev = d.eventos as unknown as { fecha_inicio: string } | null
      return ev && ev.fecha_inicio >= fechaDesde
    })
    .map(d => {
      const ev = d.eventos as unknown as { id: string; titulo: string; fecha_inicio: string; codigo_acceso: string | null }
      return {
        email: d.email_externo,
        estado: d.estado_invitacion,
        evento_titulo: ev?.titulo,
        evento_fecha: ev?.fecha_inicio,
        codigo_acceso: ev?.codigo_acceso,
      }
    })
}

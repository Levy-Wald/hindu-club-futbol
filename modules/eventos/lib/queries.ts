'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { InvitacionPendiente } from './types'

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
      id, titulo, fecha, hora_inicio, hora_fin, tipo_evento_slug,
      equipo_id, cancha_id, sede_id, color, estado,
      es_recurrente, evento_padre_id, serie_uuid, modulo_origen,
      espacio_virtual_tipo, etiquetas
    `)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .not('fecha', 'is', null)
    .gte('fecha', fechaDesde)
    .lte('fecha', fechaHasta)
    .order('fecha', { ascending: true })
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
  const [equipoRes, sedeRes, canchaRes, responsableRes] = await Promise.all([
    evento.equipo_id
      ? supabase.from('equipos').select('nombre').eq('id', evento.equipo_id).maybeSingle()
      : { data: null },
    evento.sede_id
      ? supabase.from('sedes').select('nombre').eq('id', evento.sede_id).maybeSingle()
      : { data: null },
    evento.cancha_id
      ? supabase.from('canchas').select('nombre').eq('id', evento.cancha_id).maybeSingle()
      : { data: null },
    evento.responsable_persona_id
      ? supabase.from('personas').select('nombre, apellido').eq('id', evento.responsable_persona_id).maybeSingle()
      : { data: null },
  ])

  return {
    ...evento,
    equipo_nombre: equipoRes?.data?.nombre ?? null,
    sede_nombre: sedeRes?.data?.nombre ?? null,
    cancha_nombre: canchaRes?.data?.nombre ?? null,
    responsable_nombre: responsableRes?.data
      ? `${responsableRes.data.nombre} ${responsableRes.data.apellido}`
      : null,
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
      eventos!evento_id(titulo, fecha, hora_inicio, tipo_evento_slug, equipo_id)
    `)
    .eq('persona_id', personaId)
    .eq('tenant_id', tenantId)
    .eq('estado_invitacion', 'pendiente')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  // Hydrate equipo names
  const equipoIds = [...new Set(
    data
      .map(d => (d.eventos as unknown as { equipo_id: string | null })?.equipo_id)
      .filter(Boolean)
  )] as string[]

  const equiposMap = new Map<string, string>()
  if (equipoIds.length > 0) {
    const { data: equipos } = await supabase
      .from('equipos')
      .select('id, nombre')
      .in('id', equipoIds)
    for (const eq of equipos ?? []) equiposMap.set(eq.id, eq.nombre)
  }

  return data.map(d => {
    const ev = d.eventos as unknown as {
      titulo: string | null
      fecha: string | null
      hora_inicio: string | null
      tipo_evento_slug: string
      equipo_id: string | null
    }
    return {
      evento_invitado_id: d.id,
      evento_id: d.evento_id,
      titulo: ev?.titulo ?? null,
      fecha: ev?.fecha ?? null,
      hora_inicio: ev?.hora_inicio ?? null,
      tipo_evento_slug: ev?.tipo_evento_slug ?? 'otro',
      equipo_nombre: ev?.equipo_id ? equiposMap.get(ev.equipo_id) ?? null : null,
      estado_invitacion: d.estado_invitacion as InvitacionPendiente['estado_invitacion'],
    }
  })
}

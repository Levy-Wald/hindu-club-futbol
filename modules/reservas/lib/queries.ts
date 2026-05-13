'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { ReservaHidratada, CanchaDisponible } from './types'

/**
 * Lista reservas con filtros opcionales.
 */
export async function listarReservas(
  tenant_id: string,
  filtros?: {
    cancha_id?: string
    estado?: string
    mes?: string // YYYY-MM
  }
): Promise<ReservaHidratada[]> {
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('reservas_canchas')
    .select('*')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })

  if (filtros?.cancha_id) {
    query = query.eq('cancha_id', filtros.cancha_id)
  }
  if (filtros?.estado) {
    query = query.eq('estado', filtros.estado)
  }

  const { data: reservas } = await query

  if (!reservas || reservas.length === 0) return []

  // Hidratar eventos
  const eventoIds = reservas.map(r => r.evento_id)
  const { data: eventos } = await supabase
    .from('eventos')
    .select('id, fecha, hora_inicio, hora_fin')
    .in('id', eventoIds)

  const eventosMap = (eventos ?? []).reduce((acc, e) => {
    acc[e.id] = e
    return acc
  }, {} as Record<string, { fecha: string; hora_inicio: string; hora_fin: string | null }>)

  // Hidratar canchas
  const canchaIds = [...new Set(reservas.map(r => r.cancha_id))]
  const { data: canchas } = await supabase
    .from('canchas')
    .select('id, nombre, tipo')
    .in('id', canchaIds)

  const canchasMap = (canchas ?? []).reduce((acc, c) => {
    acc[c.id] = c
    return acc
  }, {} as Record<string, { nombre: string; tipo: string | null }>)

  // Hidratar personas (si hay)
  const personaIds = reservas.filter(r => r.persona_id).map(r => r.persona_id!)
  let personasMap: Record<string, string> = {}
  if (personaIds.length > 0) {
    const { data: personas } = await supabase
      .from('personas')
      .select('id, nombre, apellido')
      .in('id', personaIds)
    personasMap = (personas ?? []).reduce((acc, p) => {
      acc[p.id] = `${p.apellido}, ${p.nombre}`
      return acc
    }, {} as Record<string, string>)
  }

  // Hidratar entidades (si hay)
  const entidadIds = reservas.filter(r => r.entidad_id).map(r => r.entidad_id!)
  let entidadesMap: Record<string, string> = {}
  if (entidadIds.length > 0) {
    const { data: entidades } = await supabase
      .from('entidades')
      .select('id, nombre')
      .in('id', entidadIds)
    entidadesMap = (entidades ?? []).reduce((acc, e) => {
      acc[e.id] = e.nombre
      return acc
    }, {} as Record<string, string>)
  }

  // Filtro por mes (post-query, sobre fecha del evento)
  let result = reservas.map(r => {
    const ev = eventosMap[r.evento_id]
    let clienteDisplay = r.cliente_nombre_externo ?? 'Sin cliente'
    if (r.persona_id && personasMap[r.persona_id]) {
      clienteDisplay = personasMap[r.persona_id]
    } else if (r.entidad_id && entidadesMap[r.entidad_id]) {
      clienteDisplay = entidadesMap[r.entidad_id]
    }

    return {
      ...r,
      tarifa_hora: r.tarifa_hora ? Number(r.tarifa_hora) : null,
      duracion_horas: r.duracion_horas ? Number(r.duracion_horas) : null,
      tarifa_total: r.tarifa_total ? Number(r.tarifa_total) : null,
      evento: {
        fecha: ev?.fecha ?? '',
        hora_inicio: ev?.hora_inicio ?? '',
        hora_fin: ev?.hora_fin ?? null,
      },
      cancha: {
        nombre: canchasMap[r.cancha_id]?.nombre ?? '',
        tipo: canchasMap[r.cancha_id]?.tipo ?? null,
      },
      cliente_display: clienteDisplay,
    } as ReservaHidratada
  })

  if (filtros?.mes) {
    result = result.filter(r => r.evento.fecha.startsWith(filtros.mes!))
  }

  // Sort by event date desc
  result.sort((a, b) => b.evento.fecha.localeCompare(a.evento.fecha))

  return result
}

/**
 * Lista canchas disponibles para alquiler.
 */
export async function listarCanchasDisponibles(
  tenant_id: string
): Promise<CanchaDisponible[]> {
  const supabase = createServiceRoleClient()

  const { data: canchas } = await supabase
    .from('canchas')
    .select('id, nombre, tipo, precio_alquiler_hora, sede_id')
    .eq('tenant_id', tenant_id)
    .eq('activa', true)
    .eq('disponible_para_alquiler', true)
    .order('nombre')

  if (!canchas || canchas.length === 0) return []

  const sedeIds = [...new Set(canchas.map(c => c.sede_id))]
  const { data: sedes } = await supabase
    .from('sedes')
    .select('id, nombre')
    .in('id', sedeIds)

  const sedesMap = (sedes ?? []).reduce((acc, s) => {
    acc[s.id] = s.nombre
    return acc
  }, {} as Record<string, string>)

  return canchas.map(c => ({
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    precio_alquiler_hora: c.precio_alquiler_hora ? Number(c.precio_alquiler_hora) : null,
    sede_nombre: sedesMap[c.sede_id] ?? null,
  }))
}

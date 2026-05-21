'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { EventoCalendar } from './types'

/**
 * Obtiene eventos del mes con padding de 1 semana para vista calendario.
 * AP-003: queries separadas para equipos y canchas (no FK joins)
 */
export async function obtenerEventosPorMes(
  year: number,
  month: number,
  tenant_id: string
): Promise<EventoCalendar[]> {
  const supabase = createServiceRoleClient()

  const fechaDesde = new Date(year, month - 1, 1)
  fechaDesde.setDate(fechaDesde.getDate() - 7)
  const fechaHasta = new Date(year, month, 0)
  fechaHasta.setDate(fechaHasta.getDate() + 7)

  const { data: eventos } = await supabase
    .from('eventos')
    .select('id, titulo, fecha, hora_inicio, hora_fin, tipo_evento_slug, equipo_id, cancha_id, color, es_recurrente, evento_padre_id, serie_uuid, estado')
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .not('fecha', 'is', null)
    .gte('fecha', fechaDesde.toISOString().slice(0, 10))
    .lte('fecha', fechaHasta.toISOString().slice(0, 10))
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (!eventos || eventos.length === 0) return []

  // AP-003: queries separadas para hidratar nombres
  const equipoIds = [...new Set(eventos.map(e => e.equipo_id).filter(Boolean))] as string[]
  const canchaIds = [...new Set(eventos.map(e => e.cancha_id).filter(Boolean))] as string[]

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

  return mapEventos(eventos, equiposMap, canchasMap)
}

/**
 * Obtiene eventos de una semana para vista semanal.
 * AP-003: queries separadas para equipos y canchas (no FK joins)
 */
export async function obtenerEventosPorSemana(
  fechaInicio: Date,
  tenant_id: string
): Promise<EventoCalendar[]> {
  const supabase = createServiceRoleClient()

  const fechaFin = new Date(fechaInicio)
  fechaFin.setDate(fechaFin.getDate() + 6)

  const { data: eventos } = await supabase
    .from('eventos')
    .select('id, titulo, fecha, hora_inicio, hora_fin, tipo_evento_slug, equipo_id, cancha_id, color, es_recurrente, evento_padre_id, serie_uuid, estado')
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .not('fecha', 'is', null)
    .gte('fecha', fechaInicio.toISOString().slice(0, 10))
    .lte('fecha', fechaFin.toISOString().slice(0, 10))
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (!eventos || eventos.length === 0) return []

  const equipoIds = [...new Set(eventos.map(e => e.equipo_id).filter(Boolean))] as string[]
  const canchaIds = [...new Set(eventos.map(e => e.cancha_id).filter(Boolean))] as string[]

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

  return mapEventos(eventos, equiposMap, canchasMap)
}

function mapEventos(
  eventos: Array<{
    id: string; titulo: string | null; fecha: string; hora_inicio: string | null;
    hora_fin: string | null; tipo_evento_slug: string; equipo_id: string | null;
    cancha_id: string | null; color: string | null; es_recurrente: boolean | null;
    evento_padre_id: string | null; serie_uuid: string | null; estado: string;
  }>,
  equiposMap: Map<string, string>,
  canchasMap: Map<string, string>,
): EventoCalendar[] {
  return eventos.map(e => {
    const horaInicio = e.hora_inicio ?? '00:00:00'
    const horaFin = e.hora_fin ?? horaInicio
    return {
      id: e.id,
      titulo: e.titulo ?? '(sin título)',
      start: new Date(`${e.fecha}T${horaInicio}`),
      end: new Date(`${e.fecha}T${horaFin}`),
      resource: {
        tipo_evento_slug: e.tipo_evento_slug,
        equipo_id: e.equipo_id,
        equipo_nombre: e.equipo_id ? equiposMap.get(e.equipo_id) ?? null : null,
        cancha_id: e.cancha_id,
        cancha_nombre: e.cancha_id ? canchasMap.get(e.cancha_id) ?? null : null,
        color: e.color,
        es_recurrente: e.es_recurrente ?? false,
        evento_padre_id: e.evento_padre_id,
        serie_uuid: e.serie_uuid,
        fecha: e.fecha,
        estado: e.estado,
      },
    }
  })
}

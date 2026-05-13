'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { EsquemaCompleto, JugadorPlantel } from './types'

/**
 * Obtiene el esquema táctico de un evento (si existe).
 * Hidrata posiciones con nombre/apellido de personas.
 */
export async function obtenerEsquemaPorEvento(
  evento_id: string,
  tenant_id: string
): Promise<EsquemaCompleto | null> {
  const supabase = createServiceRoleClient()

  const { data: esquema } = await supabase
    .from('esquemas_tacticos')
    .select('id, nombre, formacion, notas')
    .eq('evento_id', evento_id)
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!esquema) return null

  const { data: posiciones } = await supabase
    .from('esquema_posiciones')
    .select('id, posicion, persona_id, es_titular, orden')
    .eq('esquema_id', esquema.id)
    .eq('tenant_id', tenant_id)

  // Hidratar personas
  const personaIds = (posiciones ?? []).map(p => p.persona_id)
  let personasMap: Record<string, { nombre: string; apellido: string }> = {}

  if (personaIds.length > 0) {
    const { data: personas } = await supabase
      .from('personas')
      .select('id, nombre, apellido')
      .in('id', personaIds)

    personasMap = (personas ?? []).reduce((acc, p) => {
      acc[p.id] = { nombre: p.nombre, apellido: p.apellido }
      return acc
    }, {} as Record<string, { nombre: string; apellido: string }>)
  }

  return {
    esquema: {
      id: esquema.id,
      nombre: esquema.nombre,
      formacion: esquema.formacion,
      notas: esquema.notas,
    },
    posiciones: (posiciones ?? []).map(p => ({
      id: p.id,
      posicion: p.posicion,
      persona_id: p.persona_id,
      persona_nombre: personasMap[p.persona_id]?.nombre ?? '',
      persona_apellido: personasMap[p.persona_id]?.apellido ?? '',
      es_titular: p.es_titular,
      orden: p.orden,
    })),
  }
}

/**
 * Obtiene el plantel del equipo asociado al evento.
 * Devuelve jugadores (rol deportivo), con número de camiseta si hay.
 */
export async function obtenerPlantelParaEvento(
  evento_id: string,
  tenant_id: string
): Promise<JugadorPlantel[]> {
  const supabase = createServiceRoleClient()

  const { data: evento } = await supabase
    .from('eventos')
    .select('equipo_id')
    .eq('id', evento_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!evento?.equipo_id) return []

  const { data: miembros } = await supabase
    .from('personas_equipos')
    .select('persona_id, dorsal, posicion')
    .eq('equipo_id', evento.equipo_id)
    .eq('tenant_id', tenant_id)
    .eq('activo', true)
    .in('rol_equipo_slug', ['jugador', 'capitan', 'subcapitan'])

  if (!miembros || miembros.length === 0) return []

  const personaIds = miembros.map(m => m.persona_id)
  const { data: personas } = await supabase
    .from('personas')
    .select('id, nombre, apellido')
    .in('id', personaIds)
    .is('deleted_at', null)

  const personasMap = (personas ?? []).reduce((acc, p) => {
    acc[p.id] = { nombre: p.nombre, apellido: p.apellido }
    return acc
  }, {} as Record<string, { nombre: string; apellido: string }>)

  return miembros
    .filter(m => personasMap[m.persona_id])
    .map(m => ({
      persona_id: m.persona_id,
      nombre: personasMap[m.persona_id].nombre,
      apellido: personasMap[m.persona_id].apellido,
      numero_camiseta: m.dorsal ? String(m.dorsal) : null,
      posicion_habitual: m.posicion ?? null,
    }))
    .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
}

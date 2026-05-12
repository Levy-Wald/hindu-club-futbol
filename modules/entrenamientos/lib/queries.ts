'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { PlanCompleto, Ejercicio, Bloque } from './types'

/**
 * Obtiene el plan de entrenamiento asociado a un evento.
 * AP-003: queries separadas para hidratar ejercicios.
 */
export async function obtenerPlanPorEvento(
  evento_id: string,
  tenant_id: string
): Promise<PlanCompleto | null> {
  const supabase = createServiceRoleClient()

  const { data: plan } = await supabase
    .from('entrenamiento_planes')
    .select('*')
    .eq('evento_id', evento_id)
    .eq('tenant_id', tenant_id)
    .maybeSingle()

  if (!plan) return null

  const { data: bloques } = await supabase
    .from('entrenamiento_plan_bloques')
    .select('*')
    .eq('plan_id', plan.id)
    .order('orden', { ascending: true })

  if (!bloques) return { plan, bloques: [], duracion_total_calculada: 0 }

  // AP-003: query separada para hidratar ejercicios
  const ejercicioIds = [...new Set(
    bloques.map(b => b.ejercicio_id).filter(Boolean)
  )] as string[]

  let ejerciciosMap = new Map<string, Ejercicio>()
  if (ejercicioIds.length > 0) {
    const { data: ejercicios } = await supabase
      .from('catalogo_ejercicios')
      .select('*')
      .in('id', ejercicioIds)

    if (ejercicios) {
      ejerciciosMap = new Map(ejercicios.map(e => [e.id, e as unknown as Ejercicio]))
    }
  }

  const bloquesHidratados: Bloque[] = bloques.map(b => ({
    ...(b as unknown as Bloque),
    ejercicio: b.ejercicio_id ? ejerciciosMap.get(b.ejercicio_id) ?? null : null,
  }))

  const duracion_total_calculada = bloquesHidratados.reduce((sum, b) => {
    return sum + (b.duracion_min ?? b.ejercicio?.duracion_min_sugerida ?? 0)
  }, 0)

  return { plan, bloques: bloquesHidratados, duracion_total_calculada }
}

/**
 * Lista ejercicios del catálogo (globales + del tenant).
 */
export async function listarEjerciciosCatalogo(
  tenant_id: string,
  filtros?: { categoria?: string; busqueda?: string }
): Promise<Ejercicio[]> {
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('catalogo_ejercicios')
    .select('*')
    .eq('activo', true)
    .or(`tenant_id.is.null,tenant_id.eq.${tenant_id}`)
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true })

  if (filtros?.categoria) {
    query = query.eq('categoria', filtros.categoria)
  }

  if (filtros?.busqueda) {
    query = query.ilike('nombre', `%${filtros.busqueda}%`)
  }

  const { data } = await query
  return (data ?? []) as unknown as Ejercicio[]
}

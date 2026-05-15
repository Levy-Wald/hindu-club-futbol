import { createClient } from '@/lib/supabase/server'
import type { AtributoDefinicion, AtributoValor, AplicaA, VinculoCross } from './tipos'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function fetchDefiniciones(aplicaA?: AplicaA): Promise<AtributoDefinicion[]> {
  const supabase = await createClient()
  let query = supabase
    .from('atributos_custom_definicion')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true })

  if (aplicaA) {
    query = query.eq('aplica_a', aplicaA)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as AtributoDefinicion[]
}

export async function fetchDefinicion(id: string): Promise<AtributoDefinicion | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('atributos_custom_definicion')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return data as AtributoDefinicion | null
}

export async function fetchValoresEntidad(entidadTipo: AplicaA, entidadId: string): Promise<AtributoValor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('atributos_custom_valores')
    .select('*')
    .eq('entidad_tipo', entidadTipo)
    .eq('entidad_id', entidadId)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)

  if (error) throw error
  return (data ?? []) as AtributoValor[]
}

// Vinculos cross
export async function fetchVinculosCross(tipo: 'persona' | 'entidad', id: string): Promise<VinculoCross[]> {
  const supabase = await createClient()

  // Get vinculos where this entity is origin OR destination
  const { data: asOrigen, error: e1 } = await supabase
    .from('vinculos_cross')
    .select('*')
    .eq('origen_tipo', tipo)
    .eq('origen_id', id)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .eq('activo', true)

  const { data: asDestino, error: e2 } = await supabase
    .from('vinculos_cross')
    .select('*')
    .eq('destino_tipo', tipo)
    .eq('destino_id', id)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .eq('activo', true)

  if (e1) throw e1
  if (e2) throw e2

  return [...(asOrigen ?? []), ...(asDestino ?? [])] as VinculoCross[]
}

// Helper to resolve names for vinculos
export async function resolveVinculoNames(vinculos: VinculoCross[]): Promise<(VinculoCross & { origen_nombre: string; destino_nombre: string })[]> {
  if (vinculos.length === 0) return []

  const supabase = await createClient()

  const personaIds = new Set<string>()
  const entidadIds = new Set<string>()

  for (const v of vinculos) {
    if (v.origen_tipo === 'persona') personaIds.add(v.origen_id)
    else entidadIds.add(v.origen_id)
    if (v.destino_tipo === 'persona') personaIds.add(v.destino_id)
    else entidadIds.add(v.destino_id)
  }

  const nameMap = new Map<string, string>()

  if (personaIds.size > 0) {
    const { data } = await supabase
      .from('personas')
      .select('id, nombre, apellido')
      .in('id', Array.from(personaIds))
    for (const p of data ?? []) {
      nameMap.set(p.id, `${p.apellido}, ${p.nombre}`)
    }
  }

  if (entidadIds.size > 0) {
    const { data } = await supabase
      .from('entidades')
      .select('id, nombre')
      .in('id', Array.from(entidadIds))
    for (const e of data ?? []) {
      nameMap.set(e.id, e.nombre)
    }
  }

  return vinculos.map(v => ({
    ...v,
    origen_nombre: nameMap.get(v.origen_id) ?? 'Desconocido',
    destino_nombre: nameMap.get(v.destino_id) ?? 'Desconocido',
  }))
}

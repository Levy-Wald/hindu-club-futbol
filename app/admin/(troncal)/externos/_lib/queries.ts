import { createClient } from '@/lib/supabase/server'

export interface FetchEntidadesParams {
  search?: string
  tipo?: string
  activo?: string
}

export async function fetchEntidades(params: FetchEntidadesParams = {}) {
  const supabase = await createClient()

  let query = supabase
    .from('entidades')
    .select('*, representantes:entidades_representantes(count)')
    .order('nombre')

  if (params.search) {
    query = query.or(`nombre.ilike.%${params.search}%,email.ilike.%${params.search}%,cuit.ilike.%${params.search}%`)
  }
  if (params.tipo) {
    query = query.eq('tipo', params.tipo)
  }
  if (params.activo === 'activo') {
    query = query.eq('activo', true)
  } else if (params.activo === 'inactivo') {
    query = query.eq('activo', false)
  }

  const { data, error } = await query

  if (error) throw error
  return (data ?? []).map((e) => ({
    ...e,
    representantes_count: (e.representantes as { count: number }[])?.[0]?.count ?? 0,
  }))
}

export async function fetchEntidadesParent() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('entidades')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre')

  if (error) throw error
  return data ?? []
}

export async function fetchEntidadDetalle(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('entidades')
    .select('*, entidad_padre:entidades!entidad_padre_id(id, nombre, tipo)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function fetchEntidadRepresentantes(entidadId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('entidades_representantes')
    .select('*, persona:personas!persona_id(id, nombre, apellido, email_principal, telefono_principal)')
    .eq('entidad_id', entidadId)
    .eq('activo', true)
    .order('fecha_inicio', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchEntidadesHijas(entidadId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('entidades')
    .select('id, nombre, tipo, activo')
    .eq('entidad_padre_id', entidadId)
    .order('nombre')

  if (error) throw error
  return data ?? []
}

export async function fetchEntidadesForSelect() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('entidades')
    .select('id, nombre, tipo')
    .eq('activo', true)
    .order('nombre')

  if (error) throw error
  return data ?? []
}

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
    .select('*')
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
  return data ?? []
}

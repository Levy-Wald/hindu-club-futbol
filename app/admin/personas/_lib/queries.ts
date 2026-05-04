import { createClient } from '@/lib/supabase/server'

export interface PersonasQueryParams {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  estados?: string[]
  atributos?: string[]
  padrones?: string[]
  verEliminadas?: boolean
}

export async function fetchPersonas(params: PersonasQueryParams) {
  const {
    search = '',
    page = 1,
    pageSize = 50,
    sortBy = 'apellido',
    sortDir = 'asc',
    estados = [],
    atributos = [],
    // padrones filter: requiere join con personas_padrones, implementar en sprint futuro
    verEliminadas = false,
  } = params

  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('personas')
    .select(
      `*, personas_atributos(atributo_slug, activo)`,
      { count: 'exact' }
    )

  // Soft delete filter
  if (!verEliminadas) {
    query = query.is('deleted_at', null)
  }

  // Search
  if (search) {
    query = query.or(
      `nombre.ilike.%${search}%,apellido.ilike.%${search}%,dni.ilike.%${search}%,email.ilike.%${search}%`
    )
  }

  // Estado filter
  if (estados.length > 0) {
    query = query.in('estado', estados)
  }

  // Sort
  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  // Client-side filter para atributos (Supabase no soporta filter en relaciones anidadas fácilmente)
  let filtered = data ?? []
  if (atributos.length > 0) {
    filtered = filtered.filter((p) =>
      p.personas_atributos?.some(
        (a: { atributo_slug: string; activo: boolean }) =>
          atributos.includes(a.atributo_slug) && a.activo
      )
    )
  }

  return { data: filtered, total: count ?? 0 }
}

export async function fetchPersonaById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personas')
    .select(`
      *,
      personas_atributos(id, atributo_slug, valor, activo, fecha_inicio, fecha_fin, created_at),
      personas_vinculos_origen:personas_vinculos!personas_vinculos_persona_origen_id_fkey(
        id, tipo_vinculo_slug, activo, fecha_inicio, notas,
        destino:personas!personas_vinculos_persona_destino_id_fkey(id, nombre, apellido, dni)
      ),
      personas_vinculos_destino:personas_vinculos!personas_vinculos_persona_destino_id_fkey(
        id, tipo_vinculo_slug, activo, fecha_inicio, notas,
        origen:personas!personas_vinculos_persona_origen_id_fkey(id, nombre, apellido, dni)
      ),
      personas_padrones(id, padron_id, estado_slug, tipo_socio_slug, numero_socio, fecha_alta,
        padron:padrones(id, nombre, slug)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function fetchCatalogoAtributos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('catalogo_atributos')
    .select('slug, nombre, categoria')
    .eq('activo', true)
    .order('categoria')

  if (error) throw error
  return data ?? []
}

export async function fetchCatalogoVinculos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('catalogo_vinculos')
    .select('slug, nombre')
    .order('nombre')

  if (error) throw error
  return data ?? []
}

export async function fetchPadrones() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('padrones')
    .select('id, nombre, slug, tipo')
    .eq('activo', true)
    .order('nombre')

  if (error) throw error
  return data ?? []
}

export async function searchPersonas(query: string, excludeId?: string) {
  const supabase = await createClient()
  let q = supabase
    .from('personas')
    .select('id, nombre, apellido, dni')
    .is('deleted_at', null)
    .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%,dni.ilike.%${query}%`)
    .limit(10)

  if (excludeId) {
    q = q.neq('id', excludeId)
  }

  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

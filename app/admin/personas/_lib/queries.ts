import { createClient } from '@/lib/supabase/server'

export interface PersonasQueryParams {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  estados?: string[]
  atributos?: string[]
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
    verEliminadas = false,
  } = params

  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('personas')
    .select(
      `id, nombre, apellido, numero_documento, email_principal, telefono_principal, estado, deleted_at, created_at, personas_atributos!personas_atributos_persona_id_fkey(atributo_slug, activo)`,
      { count: 'exact' }
    )

  if (!verEliminadas) {
    query = query.is('deleted_at', null)
  }

  if (search) {
    query = query.or(
      `nombre.ilike.%${search}%,apellido.ilike.%${search}%,numero_documento.ilike.%${search}%,email_principal.ilike.%${search}%`
    )
  }

  if (estados.length > 0) {
    query = query.in('estado', estados)
  }

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

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
      personas_atributos!personas_atributos_persona_id_fkey(id, atributo_slug, valor, activo, fecha_inicio, fecha_fin, created_at),
      personas_vinculos_origen:personas_vinculos!personas_vinculos_persona_origen_id_fkey(
        id, tipo_vinculo_slug, activo, fecha_inicio, notas,
        destino:personas!personas_vinculos_persona_destino_id_fkey(id, nombre, apellido, numero_documento)
      ),
      personas_vinculos_destino:personas_vinculos!personas_vinculos_persona_destino_id_fkey(
        id, tipo_vinculo_slug, activo, fecha_inicio, notas,
        origen:personas!personas_vinculos_persona_origen_id_fkey(id, nombre, apellido, numero_documento)
      ),
      personas_padrones!personas_padrones_persona_id_fkey(id, padron_id, estado_padron_id, tipo_socio_id, numero_socio, fecha_alta, activo,
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
    .from('catalogo_tipos_vinculo')
    .select('slug, nombre, categoria')
    .eq('activo', true)
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

export async function fetchEstadosPadron() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('catalogo_estados_padron')
    .select('id, slug, nombre')
    .eq('activo', true)
    .order('orden')

  if (error) throw error
  return data ?? []
}

export async function fetchTiposSocio() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('catalogo_tipos_socio')
    .select('id, slug, nombre')
    .eq('activo', true)
    .order('orden')

  if (error) throw error
  return data ?? []
}

export async function searchPersonas(query: string, excludeId?: string) {
  const supabase = await createClient()
  let q = supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento')
    .is('deleted_at', null)
    .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%,numero_documento.ilike.%${query}%`)
    .limit(10)

  if (excludeId) {
    q = q.neq('id', excludeId)
  }

  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

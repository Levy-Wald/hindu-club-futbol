import { createClient } from '@/lib/supabase/server'

export interface BajasQueryParams {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  motivos?: string[]
  fechaDesde?: string
  fechaHasta?: string
}

export async function fetchBajas(params: BajasQueryParams) {
  const {
    search = '',
    page = 1,
    pageSize = 50,
    sortBy = 'fecha_baja',
    sortDir = 'desc',
    motivos = [],
    fechaDesde,
    fechaHasta,
  } = params

  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('personas')
    .select(
      `id, nombre, apellido, numero_documento, email_principal, telefono_principal, estado, motivo_baja_slug, motivo_baja_detalle, fecha_baja`,
      { count: 'exact' }
    )
    .in('estado', ['baja', 'baja_temporal'])
    .is('deleted_at', null)

  if (search) {
    query = query.or(
      `nombre.ilike.%${search}%,apellido.ilike.%${search}%,numero_documento.ilike.%${search}%,email_principal.ilike.%${search}%`
    )
  }

  if (motivos.length > 0) {
    query = query.in('motivo_baja_slug', motivos)
  }

  if (fechaDesde) {
    query = query.gte('fecha_baja', fechaDesde)
  }

  if (fechaHasta) {
    query = query.lte('fecha_baja', fechaHasta)
  }

  query = query.order(sortBy, { ascending: sortDir === 'asc' })
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return { data: data ?? [], total: count ?? 0 }
}

export async function fetchCatalogoMotivosBaja() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('catalogo_motivos_baja')
    .select('slug, nombre')
    .order('nombre')

  if (error) throw error
  return data ?? []
}

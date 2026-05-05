'use server'

import { createClient } from '@/lib/supabase/server'

const CAMPOS_VALIDOS = new Set([
  'nombre',
  'apellido',
  'numero_documento',
  'email_principal',
  'telefono_principal',
  'motivo_baja_slug',
  'motivo_baja_detalle',
  'fecha_baja',
  'estado',
])

interface ExportBajasParams {
  campos: string[]
  filtros?: {
    search?: string
    motivos?: string[]
    fechaDesde?: string
    fechaHasta?: string
  }
}

export async function exportarBajas(params: ExportBajasParams) {
  const { campos, filtros } = params

  const validCampos = campos.filter((c) => CAMPOS_VALIDOS.has(c))
  if (validCampos.length === 0) {
    return { ok: false as const, data: [] }
  }

  const supabase = await createClient()

  let query = supabase
    .from('personas')
    .select(validCampos.join(', '))
    .in('estado', ['baja', 'baja_temporal'])
    .is('deleted_at', null)

  if (filtros?.search) {
    query = query.or(
      `nombre.ilike.%${filtros.search}%,apellido.ilike.%${filtros.search}%,numero_documento.ilike.%${filtros.search}%,email_principal.ilike.%${filtros.search}%`
    )
  }

  if (filtros?.motivos && filtros.motivos.length > 0) {
    query = query.in('motivo_baja_slug', filtros.motivos)
  }

  if (filtros?.fechaDesde) {
    query = query.gte('fecha_baja', filtros.fechaDesde)
  }

  if (filtros?.fechaHasta) {
    query = query.lte('fecha_baja', filtros.fechaHasta)
  }

  query = query.order('fecha_baja', { ascending: false })
  query = query.limit(5000)

  const { data, error } = await query

  if (error) {
    return { ok: false as const, data: [] }
  }

  return { ok: true as const, data: (data ?? []) as unknown as Record<string, unknown>[] }
}

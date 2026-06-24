// F6.6 — Rendición de gastos. Queries.
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

export interface RendicionRow {
  id: string
  numero: string
  estado: string
  total: number
  fecha: string
  solicitante: { nombre: string; apellido: string } | null
  items_count: number
}

export async function fetchRendiciones(): Promise<RendicionRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rendiciones_gastos')
    .select('id, numero, estado, total, fecha, solicitante:personas!solicitante_persona_id(nombre, apellido), items:rendicion_gasto_items(count)')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    numero: r.numero,
    estado: r.estado,
    total: Number(r.total ?? 0),
    fecha: r.fecha,
    solicitante: (r.solicitante as unknown as { nombre: string; apellido: string }) ?? null,
    items_count: (r.items as { count: number }[])?.[0]?.count ?? 0,
  }))
}

export interface RendicionItem {
  id: string
  descripcion: string
  categoria: string | null
  monto: number
  comprobante_ref: string | null
  fecha: string | null
}

export async function fetchRendicionDetalle(id: string) {
  const supabase = await createClient()
  const { data: rendicion, error } = await supabase
    .from('rendiciones_gastos')
    .select('*, solicitante:personas!solicitante_persona_id(id, nombre, apellido), centro:centros_costo!centro_costo_id(id, nombre), aprobador:personas!aprobada_por_persona_id(id, nombre, apellido)')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .single()
  if (error) throw error

  const { data: items, error: itemsError } = await supabase
    .from('rendicion_gasto_items')
    .select('id, descripcion, categoria, monto, comprobante_ref, fecha')
    .eq('rendicion_id', id)
    .order('created_at')
  if (itemsError) throw itemsError

  return {
    rendicion,
    items: (items ?? []).map((i) => ({ ...i, monto: Number(i.monto ?? 0) })) as RendicionItem[],
  }
}

export async function fetchCentrosCosto() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('centros_costo')
    .select('id, nombre, codigo')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return data ?? []
}

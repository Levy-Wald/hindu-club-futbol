// F1.14 — Compras MVP. Ciclo solicitud → orden de compra → recepción → factura.
import { createClient } from '@/lib/supabase/server'

// ── Solicitudes ──────────────────────────────────────────────────────────
export interface SolicitudRow {
  id: string
  numero: string
  estado: string
  notas: string | null
  fecha: string
  convertida_oc_id: string | null
  items_count: number
}

export async function fetchSolicitudes(): Promise<SolicitudRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('compras_solicitudes')
    .select('id, numero, estado, notas, fecha, convertida_oc_id, items:compras_solicitud_items(count)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((s) => ({
    id: s.id,
    numero: s.numero,
    estado: s.estado,
    notas: s.notas,
    fecha: s.fecha,
    convertida_oc_id: s.convertida_oc_id,
    items_count: (s.items as { count: number }[])?.[0]?.count ?? 0,
  }))
}

export async function fetchSolicitudDetalle(id: string) {
  const supabase = await createClient()

  const { data: solicitud, error } = await supabase
    .from('compras_solicitudes')
    .select('*, oc:ordenes_compra!compras_solicitudes_convertida_oc_fk(id, numero)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error

  const { data: items, error: itemsError } = await supabase
    .from('compras_solicitud_items')
    .select('id, descripcion, cantidad, notas, producto:productos!producto_id(id, nombre, sku)')
    .eq('solicitud_id', id)
    .order('created_at')
  if (itemsError) throw itemsError

  return { solicitud, items: items ?? [] }
}

// ── Órdenes de compra ────────────────────────────────────────────────────
export interface OrdenCompraRow {
  id: string
  numero: string
  estado: string
  moneda: string
  total: number
  fecha_emision: string | null
  factura_registrada_at: string | null
  proveedor: { id: string; nombre: string } | null
  items_count: number
}

export async function fetchOrdenesCompra(params: { estado?: string } = {}): Promise<OrdenCompraRow[]> {
  const supabase = await createClient()

  let query = supabase
    .from('ordenes_compra')
    .select(
      'id, numero, estado, moneda, total, fecha_emision, factura_registrada_at, proveedor:entidades!proveedor_entidad_id(id, nombre), items:oc_items(count)',
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.estado) query = query.eq('estado', params.estado)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((o) => ({
    id: o.id,
    numero: o.numero,
    estado: o.estado,
    moneda: o.moneda,
    total: Number(o.total ?? 0),
    fecha_emision: o.fecha_emision,
    factura_registrada_at: o.factura_registrada_at,
    proveedor: (o.proveedor as unknown as { id: string; nombre: string }) ?? null,
    items_count: (o.items as { count: number }[])?.[0]?.count ?? 0,
  }))
}

export async function fetchOrdenesCompraByProveedor(entidadId: string): Promise<OrdenCompraRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ordenes_compra')
    .select('id, numero, estado, moneda, total, fecha_emision, factura_registrada_at, items:oc_items(count)')
    .eq('proveedor_entidad_id', entidadId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((o) => ({
    id: o.id,
    numero: o.numero,
    estado: o.estado,
    moneda: o.moneda,
    total: Number(o.total ?? 0),
    fecha_emision: o.fecha_emision,
    factura_registrada_at: o.factura_registrada_at,
    proveedor: null,
    items_count: (o.items as { count: number }[])?.[0]?.count ?? 0,
  }))
}

export interface OcItem {
  id: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  cantidad_recibida: number
  subtotal: number
  producto: { id: string; nombre: string; sku: string | null } | null
}

export async function fetchOrdenCompraDetalle(id: string) {
  const supabase = await createClient()

  const { data: oc, error } = await supabase
    .from('ordenes_compra')
    .select('*, proveedor:entidades!proveedor_entidad_id(id, nombre, cuit), solicitud:compras_solicitudes!solicitud_id(id, numero)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error

  const { data: items, error: itemsError } = await supabase
    .from('oc_items')
    .select('id, descripcion, cantidad, precio_unitario, cantidad_recibida, subtotal, producto:productos!producto_id(id, nombre, sku)')
    .eq('oc_id', id)
    .order('created_at')
  if (itemsError) throw itemsError

  const { data: recepciones, error: recError } = await supabase
    .from('compras_recepciones')
    .select('id, numero, fecha, notas, items:compras_recepcion_items(count)')
    .eq('oc_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (recError) throw recError

  return {
    oc,
    items: (items ?? []).map((i) => ({
      ...i,
      precio_unitario: Number(i.precio_unitario ?? 0),
      cantidad: Number(i.cantidad ?? 0),
      cantidad_recibida: Number(i.cantidad_recibida ?? 0),
      subtotal: Number(i.subtotal ?? 0),
      producto: (i.producto as unknown as OcItem['producto']) ?? null,
    })) as OcItem[],
    recepciones: (recepciones ?? []).map((r) => ({
      id: r.id,
      numero: r.numero,
      fecha: r.fecha,
      notas: r.notas,
      items_count: (r.items as { count: number }[])?.[0]?.count ?? 0,
    })),
  }
}

// ── Selects auxiliares ───────────────────────────────────────────────────
export async function fetchProveedoresSelect() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entidades')
    .select('id, nombre')
    .eq('tipo', 'proveedor')
    .eq('activo', true)
    .is('deleted_at', null)
    .order('nombre')
  if (error) throw error
  return data ?? []
}

export async function fetchProductosSelect() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, sku, precio_compra')
    .eq('activo', true)
    .is('deleted_at', null)
    .order('nombre')
    .limit(500)
  if (error) throw error
  return (data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    sku: p.sku,
    precio_compra: Number(p.precio_compra ?? 0),
  }))
}

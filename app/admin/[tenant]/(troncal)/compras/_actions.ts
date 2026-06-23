'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

// F1.14 — Compras MVP. Sin aprobaciones multinivel ni workflows complejos.
// El gating fino por rol (Compras/Tesorería/Admin) es a nivel de UI/capability;
// la RLS asegura aislamiento por tenant.

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

interface ItemInput {
  producto_id?: string | null
  descripcion: string
  cantidad: number
  notas?: string
}

// Recalcula ordenes_compra.total = suma de subtotales de sus items.
async function recalcularTotalOC(supabase: Awaited<ReturnType<typeof createClient>>, ocId: string) {
  const { data: items } = await supabase.from('oc_items').select('subtotal').eq('oc_id', ocId)
  const total = (items ?? []).reduce((acc, i) => acc + Number(i.subtotal ?? 0), 0)
  await supabase.from('ordenes_compra').update({ total }).eq('id', ocId)
  return total
}

// ── Solicitudes ──────────────────────────────────────────────────────────
export async function crearSolicitud(input: { notas?: string; items: ItemInput[] }) {
  const supabase = await createClient()

  const validos = input.items.filter((i) => i.descripcion.trim() && i.cantidad > 0)
  if (validos.length === 0) return formatResult(false, 'Agregá al menos un ítem con descripción y cantidad.')

  const { data: solicitud, error } = await supabase
    .from('compras_solicitudes')
    .insert({ tenant_id: TENANT_ID, notas: input.notas?.trim() || null })
    .select('id')
    .single()
  if (error) return formatResult(false, error.message)

  const { error: itemsError } = await supabase.from('compras_solicitud_items').insert(
    validos.map((i) => ({
      tenant_id: TENANT_ID,
      solicitud_id: solicitud.id,
      producto_id: i.producto_id || null,
      descripcion: i.descripcion.trim(),
      cantidad: i.cantidad,
      notas: i.notas?.trim() || null,
    })),
  )
  if (itemsError) return formatResult(false, itemsError.message)

  revalidatePath('/admin/compras')
  return formatResult(true, 'Solicitud creada', solicitud)
}

export async function enviarSolicitud(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('compras_solicitudes')
    .update({ estado: 'enviada' })
    .eq('id', id)
    .eq('estado', 'borrador')
  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/compras')
  revalidatePath(`/admin/compras/solicitudes/${id}`)
  return formatResult(true, 'Solicitud enviada')
}

export async function cancelarSolicitud(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('compras_solicitudes')
    .update({ estado: 'cancelada' })
    .eq('id', id)
    .neq('estado', 'convertida')
  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/compras')
  revalidatePath(`/admin/compras/solicitudes/${id}`)
  return formatResult(true, 'Solicitud cancelada')
}

// Convierte una solicitud en una OC borrador, copiando sus ítems.
export async function convertirSolicitudAOC(solicitudId: string, proveedorEntidadId: string) {
  const supabase = await createClient()
  if (!proveedorEntidadId) return formatResult(false, 'Elegí un proveedor.')

  const { data: solicitud, error: solErr } = await supabase
    .from('compras_solicitudes')
    .select('id, estado')
    .eq('id', solicitudId)
    .single()
  if (solErr) return formatResult(false, solErr.message)
  if (solicitud.estado === 'convertida') return formatResult(false, 'La solicitud ya fue convertida.')
  if (solicitud.estado === 'cancelada') return formatResult(false, 'La solicitud está cancelada.')

  const { data: items, error: itemsErr } = await supabase
    .from('compras_solicitud_items')
    .select('producto_id, descripcion, cantidad')
    .eq('solicitud_id', solicitudId)
  if (itemsErr) return formatResult(false, itemsErr.message)
  if (!items || items.length === 0) return formatResult(false, 'La solicitud no tiene ítems.')

  const { data: oc, error: ocErr } = await supabase
    .from('ordenes_compra')
    .insert({
      tenant_id: TENANT_ID,
      proveedor_entidad_id: proveedorEntidadId,
      solicitud_id: solicitudId,
    })
    .select('id')
    .single()
  if (ocErr) return formatResult(false, ocErr.message)

  const { error: ocItemsErr } = await supabase.from('oc_items').insert(
    items.map((i) => ({
      tenant_id: TENANT_ID,
      oc_id: oc.id,
      producto_id: i.producto_id || null,
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precio_unitario: 0,
    })),
  )
  if (ocItemsErr) return formatResult(false, ocItemsErr.message)

  await supabase
    .from('compras_solicitudes')
    .update({ estado: 'convertida', convertida_oc_id: oc.id })
    .eq('id', solicitudId)

  revalidatePath('/admin/compras')
  revalidatePath(`/admin/compras/solicitudes/${solicitudId}`)
  return formatResult(true, 'Orden de compra creada desde la solicitud', oc)
}

// ── Órdenes de compra ──────────────────────────────────────────────────────
interface OcItemInput {
  producto_id?: string | null
  descripcion: string
  cantidad: number
  precio_unitario: number
}

export async function crearOrdenCompra(input: {
  proveedor_entidad_id: string
  moneda?: string
  notas?: string
  fecha_entrega_estimada?: string
  items: OcItemInput[]
}) {
  const supabase = await createClient()
  if (!input.proveedor_entidad_id) return formatResult(false, 'Elegí un proveedor.')

  const validos = input.items.filter((i) => i.descripcion.trim() && i.cantidad > 0)
  if (validos.length === 0) return formatResult(false, 'Agregá al menos un ítem con descripción y cantidad.')

  const { data: oc, error } = await supabase
    .from('ordenes_compra')
    .insert({
      tenant_id: TENANT_ID,
      proveedor_entidad_id: input.proveedor_entidad_id,
      moneda: input.moneda || 'ARS',
      notas: input.notas?.trim() || null,
      fecha_entrega_estimada: input.fecha_entrega_estimada || null,
    })
    .select('id')
    .single()
  if (error) return formatResult(false, error.message)

  const { error: itemsError } = await supabase.from('oc_items').insert(
    validos.map((i) => ({
      tenant_id: TENANT_ID,
      oc_id: oc.id,
      producto_id: i.producto_id || null,
      descripcion: i.descripcion.trim(),
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario || 0,
    })),
  )
  if (itemsError) return formatResult(false, itemsError.message)

  await recalcularTotalOC(supabase, oc.id)

  revalidatePath('/admin/compras')
  return formatResult(true, 'Orden de compra creada', oc)
}

export async function emitirOrdenCompra(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ordenes_compra')
    .update({ estado: 'emitida', fecha_emision: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .eq('estado', 'borrador')
  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/compras')
  revalidatePath(`/admin/compras/ordenes/${id}`)
  return formatResult(true, 'Orden de compra emitida')
}

export async function cancelarOrdenCompra(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ordenes_compra')
    .update({ estado: 'cancelada' })
    .eq('id', id)
    .not('estado', 'in', '("recibida_total","recibida_parcial")')
  if (error) return formatResult(false, error.message)
  revalidatePath('/admin/compras')
  revalidatePath(`/admin/compras/ordenes/${id}`)
  return formatResult(true, 'Orden de compra cancelada')
}

export async function registrarFactura(id: string, input: { factura_numero: string; factura_fecha?: string; factura_total?: number }) {
  const supabase = await createClient()
  if (!input.factura_numero.trim()) return formatResult(false, 'Ingresá el número de factura.')

  const { error } = await supabase
    .from('ordenes_compra')
    .update({
      factura_numero: input.factura_numero.trim(),
      factura_fecha: input.factura_fecha || null,
      factura_total: input.factura_total ?? null,
      factura_registrada_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return formatResult(false, error.message)
  revalidatePath(`/admin/compras/ordenes/${id}`)
  return formatResult(true, 'Factura registrada')
}

// ── Recepción ──────────────────────────────────────────────────────────────
// Registra una recepción (parcial o total) contra una OC, suma a
// oc_items.cantidad_recibida y recalcula el estado de la OC.
export async function registrarRecepcion(
  ocId: string,
  input: { fecha?: string; notas?: string; items: Array<{ oc_item_id: string; cantidad_recibida: number }> },
) {
  const supabase = await createClient()

  const recibidos = input.items.filter((i) => i.cantidad_recibida > 0)
  if (recibidos.length === 0) return formatResult(false, 'Ingresá al menos una cantidad recibida.')

  // Estado actual de los ítems de la OC (cantidad pedida vs ya recibida).
  const { data: items, error: itemsErr } = await supabase
    .from('oc_items')
    .select('id, cantidad, cantidad_recibida')
    .eq('oc_id', ocId)
  if (itemsErr) return formatResult(false, itemsErr.message)
  const porId = new Map((items ?? []).map((i) => [i.id, { cantidad: Number(i.cantidad), recibida: Number(i.cantidad_recibida) }]))

  // Validar que no se reciba de más.
  for (const r of recibidos) {
    const it = porId.get(r.oc_item_id)
    if (!it) return formatResult(false, 'Ítem inválido en la recepción.')
    if (it.recibida + r.cantidad_recibida > it.cantidad) {
      return formatResult(false, 'No se puede recibir más de lo pendiente en un ítem.')
    }
  }

  const { data: recepcion, error: recErr } = await supabase
    .from('compras_recepciones')
    .insert({ tenant_id: TENANT_ID, oc_id: ocId, fecha: input.fecha || undefined, notas: input.notas?.trim() || null })
    .select('id')
    .single()
  if (recErr) return formatResult(false, recErr.message)

  const { error: recItemsErr } = await supabase.from('compras_recepcion_items').insert(
    recibidos.map((r) => ({
      tenant_id: TENANT_ID,
      recepcion_id: recepcion.id,
      oc_item_id: r.oc_item_id,
      cantidad_recibida: r.cantidad_recibida,
    })),
  )
  if (recItemsErr) return formatResult(false, recItemsErr.message)

  // Acumular cantidad_recibida en cada oc_item.
  for (const r of recibidos) {
    const it = porId.get(r.oc_item_id)!
    await supabase
      .from('oc_items')
      .update({ cantidad_recibida: it.recibida + r.cantidad_recibida })
      .eq('id', r.oc_item_id)
    it.recibida += r.cantidad_recibida
  }

  // Recalcular estado de la OC.
  const totalmente = [...porId.values()].every((it) => it.recibida >= it.cantidad)
  const algo = [...porId.values()].some((it) => it.recibida > 0)
  const nuevoEstado = totalmente ? 'recibida_total' : algo ? 'recibida_parcial' : 'emitida'
  await supabase.from('ordenes_compra').update({ estado: nuevoEstado }).eq('id', ocId)

  revalidatePath('/admin/compras')
  revalidatePath(`/admin/compras/ordenes/${ocId}`)
  return formatResult(true, totalmente ? 'Recepción registrada — OC completa' : 'Recepción parcial registrada')
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { totalRendicion, transicionValida, type EstadoRendicion } from './_lib/calculos'

// F6.6 — Rendición de gastos. Sin aprobaciones multinivel; la liquidación real
// (movimiento de caja) es integración con Finanzas/F5 — acá se registra el estado.

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

interface ItemInput {
  descripcion: string
  categoria?: string
  monto: number
  comprobante_ref?: string
  fecha?: string
}

async function recalcularTotal(supabase: Awaited<ReturnType<typeof createClient>>, rendicionId: string) {
  const { data: items } = await supabase.from('rendicion_gasto_items').select('monto').eq('rendicion_id', rendicionId)
  const total = totalRendicion((items ?? []).map((i) => ({ monto: Number(i.monto ?? 0) })))
  await supabase.from('rendiciones_gastos').update({ total }).eq('id', rendicionId)
  return total
}

function itemsValidos(items: ItemInput[]) {
  return items.filter((i) => i.descripcion.trim() && Number(i.monto) > 0)
}

export async function crearRendicion(input: { notas?: string; centro_costo_id?: string; items: ItemInput[] }) {
  const supabase = await createClient()
  const personaId = await getCurrentPersonaId()

  const validos = itemsValidos(input.items)
  if (validos.length === 0) return formatResult(false, 'Agregá al menos un gasto con descripción y monto.')

  const { data: rendicion, error } = await supabase
    .from('rendiciones_gastos')
    .insert({
      tenant_id: TENANT_ID,
      solicitante_persona_id: personaId,
      centro_costo_id: input.centro_costo_id || null,
      notas: input.notas?.trim() || null,
    })
    .select('id')
    .single()
  if (error) return formatResult(false, error.message)

  const { error: itemsError } = await supabase.from('rendicion_gasto_items').insert(
    validos.map((i) => ({
      tenant_id: TENANT_ID,
      rendicion_id: rendicion.id,
      descripcion: i.descripcion.trim(),
      categoria: i.categoria?.trim() || null,
      monto: Number(i.monto),
      comprobante_ref: i.comprobante_ref?.trim() || null,
      fecha: i.fecha || null,
    })),
  )
  if (itemsError) return formatResult(false, itemsError.message)

  await recalcularTotal(supabase, rendicion.id)
  revalidatePath('/admin/finanzas/rendiciones')
  return formatResult(true, 'Rendición creada', rendicion)
}

export async function actualizarItemsRendicion(id: string, items: ItemInput[]) {
  const supabase = await createClient()
  const { data: r, error: rErr } = await supabase.from('rendiciones_gastos').select('estado').eq('id', id).single()
  if (rErr) return formatResult(false, rErr.message)
  if (r.estado !== 'borrador') return formatResult(false, 'Solo se pueden editar los ítems en borrador.')

  const validos = itemsValidos(items)
  if (validos.length === 0) return formatResult(false, 'La rendición debe tener al menos un gasto.')

  const { error: delErr } = await supabase.from('rendicion_gasto_items').delete().eq('rendicion_id', id)
  if (delErr) return formatResult(false, delErr.message)
  const { error: insErr } = await supabase.from('rendicion_gasto_items').insert(
    validos.map((i) => ({
      tenant_id: TENANT_ID,
      rendicion_id: id,
      descripcion: i.descripcion.trim(),
      categoria: i.categoria?.trim() || null,
      monto: Number(i.monto),
      comprobante_ref: i.comprobante_ref?.trim() || null,
      fecha: i.fecha || null,
    })),
  )
  if (insErr) return formatResult(false, insErr.message)

  await recalcularTotal(supabase, id)
  revalidatePath('/admin/finanzas/rendiciones')
  revalidatePath(`/admin/finanzas/rendiciones/${id}`)
  return formatResult(true, 'Ítems actualizados')
}

// Cambio de estado genérico validado por la máquina de estados pura.
async function cambiarEstado(
  id: string,
  siguiente: EstadoRendicion,
  extra: Record<string, unknown> = {},
  okMsg = 'Estado actualizado',
) {
  const supabase = await createClient()
  const { data: r, error } = await supabase.from('rendiciones_gastos').select('estado').eq('id', id).single()
  if (error) return formatResult(false, error.message)
  if (!transicionValida(r.estado as EstadoRendicion, siguiente)) {
    return formatResult(false, `No se puede pasar de "${r.estado}" a "${siguiente}".`)
  }
  const { error: updErr } = await supabase.from('rendiciones_gastos').update({ estado: siguiente, ...extra }).eq('id', id)
  if (updErr) return formatResult(false, updErr.message)
  revalidatePath('/admin/finanzas/rendiciones')
  revalidatePath(`/admin/finanzas/rendiciones/${id}`)
  return formatResult(true, okMsg)
}

export async function presentarRendicion(id: string) {
  return cambiarEstado(id, 'presentada', {}, 'Rendición presentada')
}

export async function aprobarRendicion(id: string) {
  const personaId = await getCurrentPersonaId()
  return cambiarEstado(id, 'aprobada', { aprobada_por_persona_id: personaId, aprobada_at: new Date().toISOString() }, 'Rendición aprobada')
}

export async function rechazarRendicion(id: string, motivo?: string) {
  return cambiarEstado(id, 'rechazada', { motivo_rechazo: motivo?.trim() || null }, 'Rendición rechazada')
}

export async function volverABorrador(id: string) {
  return cambiarEstado(id, 'borrador', { motivo_rechazo: null }, 'Rendición vuelta a borrador')
}

export async function marcarLiquidada(id: string) {
  return cambiarEstado(id, 'liquidada', {}, 'Rendición marcada como liquidada')
}

export async function eliminarRendicion(id: string) {
  const supabase = await createClient()
  const { data: r, error } = await supabase.from('rendiciones_gastos').select('estado').eq('id', id).single()
  if (error) return formatResult(false, error.message)
  if (!['borrador', 'rechazada'].includes(r.estado)) {
    return formatResult(false, 'Solo se pueden eliminar rendiciones en borrador o rechazadas.')
  }
  const { error: delErr } = await supabase
    .from('rendiciones_gastos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
  if (delErr) return formatResult(false, delErr.message)
  revalidatePath('/admin/finanzas/rendiciones')
  return formatResult(true, 'Rendición eliminada')
}

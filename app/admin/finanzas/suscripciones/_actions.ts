'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

type ActionResult = { success: boolean; error?: string; data?: unknown }

function ok(data?: unknown): ActionResult {
  return { success: true, data }
}

function fail(error: string): ActionResult {
  return { success: false, error }
}

// =============================================================================
// Queries
// =============================================================================

export async function fetchSuscripciones(filters?: {
  plan_id?: string
  estado?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('suscripciones')
    .select(`
      *,
      persona:personas(id, nombre, apellido, numero_documento, email_principal),
      plan:cuotas_planes(id, nombre, monto, periodicidad, moneda)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (filters?.plan_id) query = query.eq('plan_id', filters.plan_id)
  if (filters?.estado) query = query.eq('estado', filters.estado)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function fetchSuscripcionesPersona(personaId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suscripciones')
    .select(`
      *,
      plan:cuotas_planes(id, nombre, monto, periodicidad, moneda)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .order('fecha_alta', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function fetchSuscripcionesStats() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('suscripciones')
    .select('estado')
    .eq('tenant_id', TENANT_ID)

  const stats = { activas: 0, suspendidas: 0, canceladas: 0, vencidas: 0, total: 0 }
  for (const row of data ?? []) {
    stats.total++
    if (row.estado === 'activa') stats.activas++
    else if (row.estado === 'suspendida') stats.suspendidas++
    else if (row.estado === 'cancelada') stats.canceladas++
    else if (row.estado === 'vencida') stats.vencidas++
  }
  return stats
}

export async function fetchPlanesActivos() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cuotas_planes')
    .select('id, nombre, monto, periodicidad, moneda')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')

  if (error) return []
  return data ?? []
}

// =============================================================================
// Mutations
// =============================================================================

export async function crearSuscripcion(
  personaId: string,
  planId: string,
  montoPactado?: number,
  notas?: string
): Promise<ActionResult> {
  const supabase = await createClient()

  if (!personaId || !planId) return fail('Persona y plan son obligatorios')

  const { error } = await supabase
    .from('suscripciones')
    .insert({
      tenant_id: TENANT_ID,
      persona_id: personaId,
      plan_id: planId,
      estado: 'activa',
      fecha_alta: new Date().toISOString().split('T')[0],
      monto_pactado: montoPactado && montoPactado > 0 ? montoPactado : null,
      notas: notas || null,
      origen: 'manual',
    })

  if (error) {
    if (error.message.includes('uq_suscripcion_activa')) {
      return fail('Esta persona ya tiene una suscripción activa a este plan')
    }
    return fail(`Error al crear suscripción: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/suscripciones')
  revalidatePath(`/admin/personas/${personaId}`)
  return ok()
}

export async function cancelarSuscripcion(
  suscripcionId: string,
  motivo?: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: sub, error: fetchErr } = await supabase
    .from('suscripciones')
    .select('id, estado, persona_id')
    .eq('id', suscripcionId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchErr || !sub) return fail('Suscripción no encontrada')
  if (sub.estado !== 'activa' && sub.estado !== 'suspendida') {
    return fail(`No se puede cancelar una suscripción con estado "${sub.estado}"`)
  }

  const { error } = await supabase
    .from('suscripciones')
    .update({
      estado: 'cancelada',
      fecha_baja: new Date().toISOString().split('T')[0],
      motivo_baja: motivo || null,
    })
    .eq('id', suscripcionId)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al cancelar: ${error.message}`)

  revalidatePath('/admin/finanzas/suscripciones')
  revalidatePath(`/admin/personas/${sub.persona_id}`)
  return ok()
}

export async function suspenderSuscripcion(suscripcionId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('suscripciones')
    .update({ estado: 'suspendida' })
    .eq('id', suscripcionId)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al suspender: ${error.message}`)

  revalidatePath('/admin/finanzas/suscripciones')
  return ok()
}

export async function reactivarSuscripcion(suscripcionId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('suscripciones')
    .update({
      estado: 'activa',
      fecha_baja: null,
      motivo_baja: null,
    })
    .eq('id', suscripcionId)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al reactivar: ${error.message}`)

  revalidatePath('/admin/finanzas/suscripciones')
  return ok()
}

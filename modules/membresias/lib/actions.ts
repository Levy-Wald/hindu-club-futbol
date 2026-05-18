'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { altaMembresiaSchema, type AltaMembresiaInput } from './schema'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

type Result = { ok: boolean; error?: string; id?: string }

export async function darAltaMembresia(input: AltaMembresiaInput): Promise<Result> {
  const parsed = altaMembresiaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const d = parsed.data

  const { data, error } = await supabase
    .from('suscripciones')
    .insert({
      tenant_id: TENANT_ID,
      persona_id: d.persona_id,
      plan_id: d.plan_id,
      tipo: d.tipo,
      disciplina_slug: d.disciplina_slug || null,
      equipo_id: d.equipo_id || null,
      estado: 'activa',
      fecha_alta: d.fecha_alta || new Date().toISOString().split('T')[0],
      monto_pactado: d.monto_pactado ?? null,
      origen: d.origen || 'manual',
      notas: d.notas || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('uq_suscripcion_activa')) {
      return { ok: false, error: 'Esta persona ya tiene una suscripción activa a este plan' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/membresias')
  revalidatePath('/admin/finanzas/suscripciones')
  return { ok: true, id: data?.id }
}

export async function darBajaMembresia(suscripcionId: string, motivo?: string): Promise<Result> {
  const supabase = await createClient()

  const { data: sub, error: fetchErr } = await supabase
    .from('suscripciones')
    .select('id, estado, persona_id')
    .eq('id', suscripcionId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchErr || !sub) return { ok: false, error: 'Suscripción no encontrada' }
  if (sub.estado !== 'activa' && sub.estado !== 'suspendida') {
    return { ok: false, error: `No se puede dar de baja una suscripción con estado "${sub.estado}"` }
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

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/membresias')
  revalidatePath('/admin/finanzas/suscripciones')
  return { ok: true }
}

export async function suspenderMembresia(suscripcionId: string): Promise<Result> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('suscripciones')
    .update({ estado: 'suspendida' })
    .eq('id', suscripcionId)
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'activa')

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/membresias')
  revalidatePath('/admin/finanzas/suscripciones')
  return { ok: true }
}

export async function reactivarMembresia(suscripcionId: string): Promise<Result> {
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

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/membresias')
  revalidatePath('/admin/finanzas/suscripciones')
  return { ok: true }
}

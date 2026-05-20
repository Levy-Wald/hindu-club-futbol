'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

export async function aprobarPreInscripcion(inscripcionId: string) {
  const supabase = await createClient()

  // Get the pre-inscription data
  const { data: inscripcion, error: fetchError } = await supabase
    .from('pre_inscripciones')
    .select('*')
    .eq('id', inscripcionId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !inscripcion) {
    return formatResult(false, 'Inscripcion no encontrada')
  }

  // Extract datos JSONB
  const datos = (inscripcion.datos ?? {}) as Record<string, unknown>

  // Check for existing persona with same DNI
  let personaId: string | null = null
  if (datos.numero_documento) {
    const { data: existing } = await supabase
      .from('personas')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('numero_documento', datos.numero_documento as string)
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      personaId = existing.id
    }
  }

  // If no existing persona, create one
  if (!personaId) {
    const { data: newPersona, error: createError } = await supabase
      .from('personas')
      .insert({
        tenant_id: TENANT_ID,
        nombre: (datos.nombre as string) || '',
        apellido: (datos.apellido as string) || '',
        numero_documento: (datos.numero_documento as string) || null,
        tipo_documento: (datos.tipo_documento as string) || 'DNI',
        fecha_nacimiento: (datos.fecha_nacimiento as string) || null,
        email_principal: datos.es_menor ? (datos.tutor_email as string) : (datos.email as string),
        telefono_principal: datos.es_menor ? (datos.tutor_telefono as string) : (datos.telefono as string),
        genero: (datos.sexo as string) || null,
        estado: 'activo',
      })
      .select('id')
      .single()

    if (createError) {
      return formatResult(false, `Error al crear persona: ${createError.message}`)
    }
    personaId = newPersona.id
  }

  // Get reviewer persona_id
  const { data: { user } } = await supabase.auth.getUser()
  let reviewerId: string | null = null
  if (user) {
    const { data: reviewer } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    reviewerId = reviewer?.id ?? null
  }

  // Update pre-inscription status
  const { error: updateError } = await supabase
    .from('pre_inscripciones')
    .update({
      estado: 'aprobada',
      persona_id: personaId,
      revisada_por_persona_id: reviewerId,
      fecha_revision: new Date().toISOString(),
    })
    .eq('id', inscripcionId)
    .eq('tenant_id', TENANT_ID)

  if (updateError) {
    return formatResult(false, `Error al aprobar: ${updateError.message}`)
  }

  revalidatePath('/admin/pre-inscripciones')
  return formatResult(true, 'Inscripcion aprobada. Persona creada/vinculada.', { persona_id: personaId })
}

export async function rechazarPreInscripcion(inscripcionId: string, motivo: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let reviewerId: string | null = null
  if (user) {
    const { data: reviewer } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    reviewerId = reviewer?.id ?? null
  }

  const { error } = await supabase
    .from('pre_inscripciones')
    .update({
      estado: 'rechazada',
      motivo_rechazo: motivo || 'Sin motivo especificado',
      revisada_por_persona_id: reviewerId,
      fecha_revision: new Date().toISOString(),
    })
    .eq('id', inscripcionId)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/pre-inscripciones')
  return formatResult(true, 'Inscripcion rechazada')
}

export async function marcarEnRevision(inscripcionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pre_inscripciones')
    .update({ estado: 'en_revision' })
    .eq('id', inscripcionId)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/pre-inscripciones')
  return formatResult(true, 'Marcada en revision')
}

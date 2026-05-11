'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

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

  // Check for existing persona with same DNI
  let personaId: string | null = null
  if (inscripcion.numero_documento) {
    const { data: existing } = await supabase
      .from('personas')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('numero_documento', inscripcion.numero_documento)
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
        nombre: inscripcion.nombre,
        apellido: inscripcion.apellido,
        numero_documento: inscripcion.numero_documento || null,
        tipo_documento: inscripcion.tipo_documento || 'DNI',
        fecha_nacimiento: inscripcion.fecha_nacimiento || null,
        email_principal: inscripcion.es_menor ? inscripcion.tutor_email : inscripcion.email,
        telefono_principal: inscripcion.es_menor ? inscripcion.tutor_telefono : inscripcion.telefono,
        genero: inscripcion.sexo || null,
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

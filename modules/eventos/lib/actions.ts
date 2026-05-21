'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { revalidatePath } from 'next/cache'
import { EventoCreateSchema, EventoUpdateSchema } from './types'
import type { EventoCreateInput, EventoUpdateInput, EstadoInvitacion } from './types'

type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

async function getAuthedPersona() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  return persona
}

// ── Crear evento universal ──

export async function crearEventoAction(
  input: EventoCreateInput
): Promise<ActionResult<{ id: string }>> {
  const persona = await getAuthedPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const parsed = EventoCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const d = parsed.data
  const tenantId = persona.tenant_id

  // Compute dia_semana
  const fechaDate = new Date(d.fecha + 'T00:00:00')
  const jsDay = fechaDate.getDay()
  const diaSemana = jsDay === 0 ? 7 : jsDay

  // Normalize hora to HH:MM:SS
  const normalizeHora = (h: string) => h.length === 5 ? h + ':00' : h

  const service = createServiceRoleClient()
  const { data, error } = await service
    .from('eventos')
    .insert({
      tenant_id: tenantId,
      titulo: d.titulo,
      tipo_evento_slug: d.tipo_evento_slug,
      fecha: d.fecha,
      hora_inicio: normalizeHora(d.hora_inicio),
      hora_fin: normalizeHora(d.hora_fin),
      dia_semana: diaSemana,
      modulo_origen: d.modulo_origen ?? 'manual',
      entidad_origen_id: d.entidad_origen_id ?? null,
      equipo_id: d.equipo_id ?? null,
      sede_id: d.sede_id ?? null,
      cancha_id: d.cancha_id ?? null,
      espacio_id: d.espacio_id ?? null,
      descripcion: d.descripcion?.trim() || null,
      responsable_persona_id: d.responsable_persona_id ?? persona.id,
      espacio_virtual_tipo: d.espacio_virtual_tipo ?? null,
      espacio_virtual_link: d.espacio_virtual_link ?? null,
      etiquetas: d.etiquetas ?? [],
      color: d.color ?? null,
      created_by: persona.id,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error creando evento' }

  revalidatePath(`/admin/${tenantId}/calendario`)
  return { ok: true, data: { id: data.id } }
}

// ── Editar evento ──

export async function editarEventoAction(
  eventoId: string,
  input: EventoUpdateInput
): Promise<ActionResult<{ id: string }>> {
  const persona = await getAuthedPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const parsed = EventoUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const changes: Record<string, unknown> = { ...parsed.data, updated_by: persona.id }

  // Normalize hora if present
  if (typeof changes.hora_inicio === 'string' && (changes.hora_inicio as string).length === 5) {
    changes.hora_inicio = changes.hora_inicio + ':00'
  }
  if (typeof changes.hora_fin === 'string' && (changes.hora_fin as string).length === 5) {
    changes.hora_fin = changes.hora_fin + ':00'
  }

  // Recompute dia_semana if fecha changed
  if (changes.fecha) {
    const fechaDate = new Date(changes.fecha as string + 'T00:00:00')
    const jsDay = fechaDate.getDay()
    changes.dia_semana = jsDay === 0 ? 7 : jsDay
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eventos')
    .update(changes)
    .eq('id', eventoId)
    .eq('tenant_id', persona.tenant_id)
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Evento no encontrado' }

  revalidatePath(`/admin/${persona.tenant_id}/calendario`)
  return { ok: true, data: { id: data.id } }
}

// ── Eliminar evento (soft delete) ──

export async function eliminarEventoAction(
  eventoId: string
): Promise<ActionResult<null>> {
  const persona = await getAuthedPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('eventos')
    .update({ deleted_at: new Date().toISOString(), updated_by: persona.id })
    .eq('id', eventoId)
    .eq('tenant_id', persona.tenant_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/${persona.tenant_id}/calendario`)
  return { ok: true, data: null }
}

// ── Responder invitación ──

export async function responderInvitacionAction(input: {
  evento_invitado_id: string
  estado: EstadoInvitacion
}): Promise<ActionResult<null>> {
  const persona = await getAuthedPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('evento_invitados')
    .update({
      estado_invitacion: input.estado,
      respuesta_at: new Date().toISOString(),
    })
    .eq('id', input.evento_invitado_id)
    .eq('persona_id', persona.id)

  if (error) return { ok: false, error: error.message }

  return { ok: true, data: null }
}

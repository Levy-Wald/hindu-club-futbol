'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { canEditarTactica } from './permisos'

async function getPersona() {
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

/**
 * Crea o actualiza el esquema táctico de un evento.
 * Si ya existe uno para ese evento, lo actualiza.
 * Si no, crea uno nuevo.
 */
export async function crearOActualizarEsquemaAction(input: {
  evento_id: string
  formacion: string
  nombre?: string
  notas?: string | null
}): Promise<{ ok: true; esquema_id: string } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditarTactica(persona.id, input.evento_id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  // Get equipo_id from event
  const { data: evento } = await supabase
    .from('eventos')
    .select('equipo_id')
    .eq('id', input.evento_id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .single()

  if (!evento?.equipo_id) return { ok: false, error: 'Evento sin equipo' }

  // Check if esquema already exists for this event
  const { data: existing } = await supabase
    .from('esquemas_tacticos')
    .select('id')
    .eq('evento_id', input.evento_id)
    .eq('tenant_id', tenant_id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('esquemas_tacticos')
      .update({
        formacion: input.formacion,
        nombre: input.nombre ?? input.formacion,
        notas: input.notas ?? null,
      })
      .eq('id', existing.id)

    if (error) return { ok: false, error: error.message }
    return { ok: true, esquema_id: existing.id }
  }

  const { data: created, error } = await supabase
    .from('esquemas_tacticos')
    .insert({
      tenant_id,
      equipo_id: evento.equipo_id,
      evento_id: input.evento_id,
      formacion: input.formacion,
      nombre: input.nombre ?? input.formacion,
      notas: input.notas ?? null,
    })
    .select('id')
    .single()

  if (error || !created) return { ok: false, error: error?.message ?? 'Error creando esquema' }
  return { ok: true, esquema_id: created.id }
}

/**
 * Asigna un jugador a un slot (posición) del esquema.
 * AP-002: UNIQUE on (tenant_id, esquema_id, persona_id) — check before insert.
 * Si el jugador ya está en otra posición del mismo esquema, lo mueve.
 * Si el slot ya tiene otro jugador, lo reemplaza.
 */
export async function asignarJugadorASlotAction(input: {
  esquema_id: string
  posicion_slug: string
  persona_id: string
  evento_id: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditarTactica(persona.id, input.evento_id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  // 1. Remove jugador from any current position in this esquema
  await supabase
    .from('esquema_posiciones')
    .delete()
    .eq('esquema_id', input.esquema_id)
    .eq('persona_id', input.persona_id)
    .eq('tenant_id', tenant_id)

  // 2. Remove any current occupant of this slot
  await supabase
    .from('esquema_posiciones')
    .delete()
    .eq('esquema_id', input.esquema_id)
    .eq('posicion', input.posicion_slug)
    .eq('tenant_id', tenant_id)

  // 3. Insert new assignment
  const { error } = await supabase
    .from('esquema_posiciones')
    .insert({
      tenant_id,
      esquema_id: input.esquema_id,
      persona_id: input.persona_id,
      posicion: input.posicion_slug,
      es_titular: true,
    })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Quita un jugador de un slot del esquema.
 */
export async function quitarJugadorDeSlotAction(input: {
  esquema_id: string
  posicion_slug: string
  evento_id: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditarTactica(persona.id, input.evento_id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('esquema_posiciones')
    .delete()
    .eq('esquema_id', input.esquema_id)
    .eq('posicion', input.posicion_slug)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

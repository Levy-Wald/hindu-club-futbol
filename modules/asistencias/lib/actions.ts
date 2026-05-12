'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { verificarPermisoTomarAsistencia } from './permisos'
import type { EstadoAsistencia } from './types'

type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

async function obtenerPersonaAutenticada() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return null
  return { ...persona, tenant_id: persona.tenant_id ?? TENANT_ID }
}

async function verificarPermisoYTenant(evento_id: string) {
  const persona = await obtenerPersonaAutenticada()
  if (!persona) return { ok: false as const, error: 'No autenticado' }

  const tienePermiso = await verificarPermisoTomarAsistencia(
    persona.id, persona.tenant_id, evento_id
  )
  if (!tienePermiso) return { ok: false as const, error: 'Sin permiso para tomar asistencia en este evento' }

  return { ok: true as const, persona }
}

// --- Marcar asistencia persona (AP-002: check-then-update/insert) ---

export async function marcarAsistenciaAction(input: {
  evento_id: string
  persona_id: string
  estado: EstadoAsistencia
  nota?: string | null
}): Promise<ActionResult<{ asistencia_id: string }>> {
  const auth = await verificarPermisoYTenant(input.evento_id)
  if (!auth.ok) return { ok: false, error: auth.error }
  const { tenant_id } = auth.persona

  const supabase = await createClient()

  // Buscar evento_invitado_id para trazabilidad
  const { data: invitado } = await supabase
    .from('evento_invitados')
    .select('id')
    .eq('evento_id', input.evento_id)
    .eq('persona_id', input.persona_id)
    .is('deleted_at', null)
    .maybeSingle()

  // AP-002: check-then-update/insert (partial unique index)
  const serviceClient = createServiceRoleClient()
  const { data: existente } = await serviceClient
    .from('evento_asistencias')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('evento_id', input.evento_id)
    .eq('persona_id', input.persona_id)
    .maybeSingle()

  if (existente) {
    const { data, error } = await supabase
      .from('evento_asistencias')
      .update({
        estado: input.estado,
        nota: input.nota ?? null,
        respondido_at: new Date().toISOString(),
        evento_invitado_id: invitado?.id ?? null,
      })
      .eq('id', existente.id)
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: { asistencia_id: data.id } }
  }

  const { data, error } = await supabase
    .from('evento_asistencias')
    .insert({
      evento_id: input.evento_id,
      persona_id: input.persona_id,
      tenant_id,
      estado: input.estado,
      nota: input.nota ?? null,
      respondido_at: new Date().toISOString(),
      evento_invitado_id: invitado?.id ?? null,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { asistencia_id: data.id } }
}

// --- Marcar asistencia entidad ---

export async function marcarAsistenciaEntidadAction(input: {
  evento_id: string
  entidad_id: string
  estado: EstadoAsistencia
  nota?: string | null
}): Promise<ActionResult<{ asistencia_id: string }>> {
  const auth = await verificarPermisoYTenant(input.evento_id)
  if (!auth.ok) return { ok: false, error: auth.error }
  const { tenant_id } = auth.persona

  const supabase = await createClient()
  const serviceClient = createServiceRoleClient()

  const { data: existente } = await serviceClient
    .from('evento_asistencias')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('evento_id', input.evento_id)
    .eq('entidad_id', input.entidad_id)
    .maybeSingle()

  if (existente) {
    const { data, error } = await supabase
      .from('evento_asistencias')
      .update({
        estado: input.estado,
        nota: input.nota ?? null,
        respondido_at: new Date().toISOString(),
      })
      .eq('id', existente.id)
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: { asistencia_id: data.id } }
  }

  const { data, error } = await supabase
    .from('evento_asistencias')
    .insert({
      evento_id: input.evento_id,
      entidad_id: input.entidad_id,
      tenant_id,
      estado: input.estado,
      nota: input.nota ?? null,
      respondido_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { asistencia_id: data.id } }
}

// --- Marcar asistencia equipo ---

export async function marcarAsistenciaEquipoAction(input: {
  evento_id: string
  equipo_id: string
  estado: EstadoAsistencia
  nota?: string | null
}): Promise<ActionResult<{ asistencia_id: string }>> {
  const auth = await verificarPermisoYTenant(input.evento_id)
  if (!auth.ok) return { ok: false, error: auth.error }
  const { tenant_id } = auth.persona

  const supabase = await createClient()
  const serviceClient = createServiceRoleClient()

  const { data: existente } = await serviceClient
    .from('evento_asistencias')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('evento_id', input.evento_id)
    .eq('equipo_id', input.equipo_id)
    .maybeSingle()

  if (existente) {
    const { data, error } = await supabase
      .from('evento_asistencias')
      .update({
        estado: input.estado,
        nota: input.nota ?? null,
        respondido_at: new Date().toISOString(),
      })
      .eq('id', existente.id)
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: { asistencia_id: data.id } }
  }

  const { data, error } = await supabase
    .from('evento_asistencias')
    .insert({
      evento_id: input.evento_id,
      equipo_id: input.equipo_id,
      tenant_id,
      estado: input.estado,
      nota: input.nota ?? null,
      respondido_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { asistencia_id: data.id } }
}

// --- Invitar entidad a evento ---

export async function invitarEntidadAction(input: {
  evento_id: string
  entidad_id: string
  marca_asistencia?: boolean
}): Promise<ActionResult<{ invitado_id: string }>> {
  const auth = await verificarPermisoYTenant(input.evento_id)
  if (!auth.ok) return { ok: false, error: auth.error }
  const { tenant_id } = auth.persona

  const serviceClient = createServiceRoleClient()

  // AP-002: check-then-insert
  const { data: existente } = await serviceClient
    .from('evento_invitados')
    .select('id')
    .eq('evento_id', input.evento_id)
    .eq('entidad_id', input.entidad_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (existente) return { ok: true, data: { invitado_id: existente.id } }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('evento_invitados')
    .insert({
      tenant_id,
      evento_id: input.evento_id,
      entidad_id: input.entidad_id,
      origen: 'manual',
      marca_asistencia: input.marca_asistencia ?? true,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { invitado_id: data.id } }
}

// --- Invitar equipo a evento ---

export async function invitarEquipoAction(input: {
  evento_id: string
  equipo_id: string
  marca_asistencia?: boolean
}): Promise<ActionResult<{ invitado_id: string }>> {
  const auth = await verificarPermisoYTenant(input.evento_id)
  if (!auth.ok) return { ok: false, error: auth.error }
  const { tenant_id } = auth.persona

  const serviceClient = createServiceRoleClient()

  const { data: existente } = await serviceClient
    .from('evento_invitados')
    .select('id')
    .eq('evento_id', input.evento_id)
    .eq('equipo_id', input.equipo_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (existente) return { ok: true, data: { invitado_id: existente.id } }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('evento_invitados')
    .insert({
      tenant_id,
      evento_id: input.evento_id,
      equipo_id: input.equipo_id,
      origen: 'manual',
      marca_asistencia: input.marca_asistencia ?? true,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { invitado_id: data.id } }
}

// --- Expandir equipo invitado a personas individuales ---

export async function expandirEquipoAction(input: {
  evento_id: string
  equipo_id: string
}): Promise<ActionResult<{ insertados: number }>> {
  const auth = await verificarPermisoYTenant(input.evento_id)
  if (!auth.ok) return { ok: false, error: auth.error }
  const { tenant_id } = auth.persona

  const serviceClient = createServiceRoleClient()

  // Obtener personas activas del equipo
  const { data: miembros, error: errMiembros } = await serviceClient
    .from('personas_equipos')
    .select('persona_id')
    .eq('equipo_id', input.equipo_id)
    .eq('tenant_id', tenant_id)
    .eq('activo', true)
    .is('deleted_at', null)

  if (errMiembros) return { ok: false, error: errMiembros.message }

  const personaIds = [...new Set((miembros ?? []).map(m => m.persona_id))]
  if (personaIds.length === 0) return { ok: true, data: { insertados: 0 } }

  // AP-002: check existing, insert only new
  const { data: existentes } = await serviceClient
    .from('evento_invitados')
    .select('persona_id')
    .eq('evento_id', input.evento_id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .not('persona_id', 'is', null)

  const existenteSet = new Set((existentes ?? []).map(e => e.persona_id))
  const nuevos = personaIds.filter(pid => !existenteSet.has(pid))

  if (nuevos.length === 0) return { ok: true, data: { insertados: 0 } }

  const rows = nuevos.map(persona_id => ({
    tenant_id,
    evento_id: input.evento_id,
    persona_id,
    origen: 'auto_plantel' as const,
  }))

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('evento_invitados')
    .insert(rows)
    .select('id')

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { insertados: data?.length ?? 0 } }
}

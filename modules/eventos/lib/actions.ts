'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { revalidatePath } from 'next/cache'
import { EventoCreateSchema, EventoUpdateSchema, ResponderInvitacionSchema } from './types'
import type { EventoCreateInput, EventoUpdateInput, EstadoInvitacion, InvitadoInput } from './types'
import { crearNotificacion } from '@/modules/notificaciones/lib/crear'
import { randomBytes } from 'crypto'

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

// Normalize HH:MM -> HH:MM:SS
const normalizeHora = (h: string | undefined | null) => {
  if (!h) return null
  return h.length === 5 ? h + ':00' : h
}

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// Generate a random alphanumeric code
function generateCodigoAcceso(): string {
  return randomBytes(6).toString('base64url').slice(0, 10).toUpperCase()
}

// ── Crear evento (basic, no invitados) ──

export async function crearEventoAction(
  input: EventoCreateInput
): Promise<ActionResult<{ id: string }>> {
  const persona = await getAuthedPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const parsed = EventoCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const d = parsed.data
  const tenantId = persona.tenant_id

  const fechaDate = new Date(d.fecha_inicio + 'T00:00:00')
  const jsDay = fechaDate.getDay()
  const diaSemana = jsDay === 0 ? 7 : jsDay

  const service = createServiceRoleClient()
  const { data, error } = await service
    .from('eventos')
    .insert({
      tenant_id: tenantId,
      titulo: d.titulo,
      tipo_evento_slug: d.tipo_evento_slug,
      fecha_inicio: d.fecha_inicio,
      fecha_fin: d.fecha_fin,
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
      responsables_persona_id: d.responsables_persona_id,
      visible_para_atributos: d.visible_para_atributos ?? null,
      espacio_virtual_tipo: d.espacio_virtual_tipo ?? null,
      espacio_virtual_link: d.espacio_virtual_link ?? null,
      etiquetas: d.etiquetas ?? [],
      color: d.color ?? null,
      periodicidad: d.periodicidad ?? 'nunca',
      dias_semana: d.dias_semana ?? null,
      fecha_fin_recurrencia: d.fecha_fin_recurrencia ?? null,
      portada_url: d.portada_url ?? null,
      lugar_encuentro: d.lugar_encuentro ?? null,
      codigo_acceso: d.codigo_acceso ?? null,
      contacto: d.contacto ?? null,
      estado: 'programado',
      created_by: persona.id,
      updated_by: persona.id,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error creando evento' }

  revalidatePath(`/admin/${tenantId}/calendario`)
  return { ok: true, data: { id: data.id } }
}

// ── Crear evento CON invitaciones ──

export async function crearEventoConInvitacionesAction(input: {
  evento: EventoCreateInput
  invitados: InvitadoInput[]
  codigo_acceso_manual?: string
}): Promise<ActionResult<{ evento_id: string; codigo_acceso: string | null; link_registro: string | null }>> {
  const persona = await getAuthedPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const parsed = EventoCreateSchema.safeParse(input.evento)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const d = parsed.data
  const tenantId = persona.tenant_id
  const service = createServiceRoleClient()

  const fechaDate = new Date(d.fecha_inicio + 'T00:00:00')
  const jsDay = fechaDate.getDay()
  const diaSemana = jsDay === 0 ? 7 : jsDay

  // 1. Create the evento
  const { data: evento, error: evError } = await service
    .from('eventos')
    .insert({
      tenant_id: tenantId,
      titulo: d.titulo,
      tipo_evento_slug: d.tipo_evento_slug,
      fecha_inicio: d.fecha_inicio,
      fecha_fin: d.fecha_fin,
      hora_inicio: normalizeHora(d.hora_inicio),
      hora_fin: normalizeHora(d.hora_fin),
      hora_citacion: normalizeHora(d.hora_inicio), // convocatoria = hora_inicio by default
      dia_semana: diaSemana,
      modulo_origen: d.modulo_origen ?? 'manual',
      entidad_origen_id: d.entidad_origen_id ?? null,
      equipo_id: d.equipo_id ?? null,
      sede_id: d.sede_id ?? null,
      cancha_id: d.cancha_id ?? null,
      espacio_id: d.espacio_id ?? null,
      descripcion: d.descripcion?.trim() || null,
      responsables_persona_id: d.responsables_persona_id,
      visible_para_atributos: d.visible_para_atributos ?? null,
      espacio_virtual_tipo: d.espacio_virtual_tipo ?? null,
      espacio_virtual_link: d.espacio_virtual_link ?? null,
      etiquetas: d.etiquetas ?? [],
      color: d.color ?? null,
      periodicidad: d.periodicidad ?? 'nunca',
      dias_semana: d.dias_semana ?? null,
      fecha_fin_recurrencia: d.fecha_fin_recurrencia ?? null,
      portada_url: d.portada_url ?? null,
      lugar_encuentro: d.lugar_encuentro ?? null,
      codigo_acceso: input.codigo_acceso_manual || null,
      contacto: d.contacto ?? null,
      estado: 'programado',
      created_by: persona.id,
      updated_by: persona.id,
    })
    .select('id')
    .single()

  if (evError || !evento) return { ok: false, error: evError?.message ?? 'Error creando evento' }

  const eventoId = evento.id

  // 2. Generate or save access code
  const codigoAcceso = input.codigo_acceso_manual || generateCodigoAcceso()
  await service.from('evento_codigos_acceso').insert({
    tenant_id: tenantId,
    evento_id: eventoId,
    codigo: codigoAcceso,
    tipo_generacion: input.codigo_acceso_manual ? 'manual' : 'automatico',
    generado_por: persona.id,
  })

  // 3. Generate registration link
  const { data: linkData } = await service
    .from('evento_link_registro')
    .insert({
      tenant_id: tenantId,
      evento_id: eventoId,
    })
    .select('link_uuid')
    .single()

  // 4. Expand invitados (equipo -> personas del equipo, etc.)
  const invitadosExpandidos = await expandirInvitados(service, tenantId, input.invitados)

  // 5. Create invitations with tokens
  const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  for (const inv of invitadosExpandidos) {
    const token = generateToken()

    await service.from('evento_invitados').insert({
      tenant_id: tenantId,
      evento_id: eventoId,
      persona_id: inv.persona_id ?? null,
      equipo_id: inv.equipo_id ?? null,
      entidad_id: inv.entidad_id ?? null,
      email_externo: inv.email_externo ?? null,
      invitado_tipo: inv.invitado_tipo,
      invitado_ref_id: inv.invitado_ref_id ?? null,
      estado_invitacion: 'pendiente',
      origen: 'manual',
      token_respuesta: token,
      token_expira_at: tokenExpiry,
    })

    // 6. Create notification for each persona invitada
    if (inv.persona_id) {
      await crearNotificacion({
        tenant_id: tenantId,
        destinatario_persona_id: inv.persona_id,
        tipo: 'invitacion_evento' as never,
        titulo: `Invitacion a: ${d.titulo}`,
        mensaje: `Fuiste invitado al evento "${d.titulo}" el ${d.fecha_inicio}. Acepta o rechaza la invitacion.`,
        link_accion: `/admin/${tenantId}/calendario`,
        prioridad: 'media',
        origen_tabla: 'evento_invitados',
        origen_registro_id: eventoId,
        origen_evento: 'invitacion_evento',
        generada_por_persona_id: persona.id,
      })
    }
  }

  revalidatePath(`/admin/${tenantId}/calendario`)

  return {
    ok: true,
    data: {
      evento_id: eventoId,
      codigo_acceso: codigoAcceso,
      link_registro: linkData?.link_uuid ?? null,
    },
  }
}

// ── Expand invitados: equipo -> individual personas ──

type ExpandedInvitado = {
  persona_id: string | null
  equipo_id: string | null
  entidad_id: string | null
  email_externo: string | null
  invitado_tipo: string
  invitado_ref_id: string | null
}

async function expandirInvitados(
  supabase: ReturnType<typeof createServiceRoleClient>,
  tenantId: string,
  invitados: InvitadoInput[]
): Promise<ExpandedInvitado[]> {
  const result: ExpandedInvitado[] = []
  const seenPersonaIds = new Set<string>()

  for (const inv of invitados) {
    switch (inv.tipo) {
      case 'persona': {
        if (inv.ref_id && !seenPersonaIds.has(inv.ref_id)) {
          seenPersonaIds.add(inv.ref_id)
          result.push({
            persona_id: inv.ref_id,
            equipo_id: null,
            entidad_id: null,
            email_externo: null,
            invitado_tipo: 'persona',
            invitado_ref_id: inv.ref_id,
          })
        }
        break
      }
      case 'equipo': {
        if (!inv.ref_id) break
        // Get all personas in this equipo
        const { data: miembros } = await supabase
          .from('personas_equipos')
          .select('persona_id')
          .eq('equipo_id', inv.ref_id)
          .eq('activo', true)

        for (const m of miembros ?? []) {
          if (!seenPersonaIds.has(m.persona_id)) {
            seenPersonaIds.add(m.persona_id)
            result.push({
              persona_id: m.persona_id,
              equipo_id: inv.ref_id,
              entidad_id: null,
              email_externo: null,
              invitado_tipo: 'equipo',
              invitado_ref_id: inv.ref_id,
            })
          }
        }
        break
      }
      case 'entidad': {
        if (inv.ref_id) {
          result.push({
            persona_id: null,
            equipo_id: null,
            entidad_id: inv.ref_id,
            email_externo: null,
            invitado_tipo: 'entidad',
            invitado_ref_id: inv.ref_id,
          })
        }
        break
      }
      case 'email_externo': {
        if (inv.email) {
          result.push({
            persona_id: null,
            equipo_id: null,
            entidad_id: null,
            email_externo: inv.email,
            invitado_tipo: 'email_externo',
            invitado_ref_id: null,
          })
        }
        break
      }
    }
  }

  return result
}

// ── Aceptar invitacion via token (no auth required) ──

export async function aceptarInvitacionAction(
  token: string
): Promise<ActionResult<{ evento_id: string }>> {
  const service = createServiceRoleClient()

  const { data: inv, error: findErr } = await service
    .from('evento_invitados')
    .select('id, evento_id, persona_id, tenant_id, estado_invitacion, token_expira_at')
    .eq('token_respuesta', token)
    .is('deleted_at', null)
    .maybeSingle()

  if (findErr || !inv) return { ok: false, error: 'Token invalido o invitacion no encontrada' }

  if (inv.token_expira_at && new Date(inv.token_expira_at) < new Date()) {
    return { ok: false, error: 'El token ha expirado' }
  }

  if (inv.estado_invitacion === 'aceptado') {
    return { ok: true, data: { evento_id: inv.evento_id } }
  }

  const { error: updateErr } = await service
    .from('evento_invitados')
    .update({
      estado_invitacion: 'aceptado',
      respuesta_at: new Date().toISOString(),
    })
    .eq('id', inv.id)

  if (updateErr) return { ok: false, error: updateErr.message }

  // Update notification
  if (inv.persona_id) {
    await crearNotificacion({
      tenant_id: inv.tenant_id,
      destinatario_persona_id: inv.persona_id,
      tipo: 'evento_confirmado' as never,
      titulo: 'Invitacion aceptada',
      mensaje: 'Confirmaste tu asistencia al evento.',
      link_accion: `/admin/${inv.tenant_id}/calendario`,
      prioridad: 'baja',
      origen_tabla: 'evento_invitados',
      origen_registro_id: inv.evento_id,
      origen_evento: 'evento_confirmado',
    })
  }

  return { ok: true, data: { evento_id: inv.evento_id } }
}

// ── Rechazar invitacion via token (no auth required) ──

export async function rechazarInvitacionAction(
  token: string
): Promise<ActionResult<{ evento_id: string }>> {
  const service = createServiceRoleClient()

  const { data: inv, error: findErr } = await service
    .from('evento_invitados')
    .select('id, evento_id, persona_id, tenant_id, estado_invitacion, token_expira_at')
    .eq('token_respuesta', token)
    .is('deleted_at', null)
    .maybeSingle()

  if (findErr || !inv) return { ok: false, error: 'Token invalido o invitacion no encontrada' }

  if (inv.token_expira_at && new Date(inv.token_expira_at) < new Date()) {
    return { ok: false, error: 'El token ha expirado' }
  }

  if (inv.estado_invitacion === 'rechazado') {
    return { ok: true, data: { evento_id: inv.evento_id } }
  }

  const { error: updateErr } = await service
    .from('evento_invitados')
    .update({
      estado_invitacion: 'rechazado',
      respuesta_at: new Date().toISOString(),
    })
    .eq('id', inv.id)

  if (updateErr) return { ok: false, error: updateErr.message }

  if (inv.persona_id) {
    await crearNotificacion({
      tenant_id: inv.tenant_id,
      destinatario_persona_id: inv.persona_id,
      tipo: 'evento_rechazado' as never,
      titulo: 'Invitacion rechazada',
      mensaje: 'Rechazaste la invitacion al evento.',
      link_accion: `/admin/${inv.tenant_id}/calendario`,
      prioridad: 'baja',
      origen_tabla: 'evento_invitados',
      origen_registro_id: inv.evento_id,
      origen_evento: 'evento_rechazado',
    })
  }

  return { ok: true, data: { evento_id: inv.evento_id } }
}

// ── Generar codigo de acceso ──

export async function generarCodigoAccesoAction(
  eventoId: string
): Promise<ActionResult<{ codigo: string }>> {
  const persona = await getAuthedPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const service = createServiceRoleClient()

  // Check if already exists
  const { data: existing } = await service
    .from('evento_codigos_acceso')
    .select('codigo')
    .eq('evento_id', eventoId)
    .maybeSingle()

  if (existing) return { ok: false, error: 'Ya existe un codigo para este evento' }

  const codigo = generateCodigoAcceso()
  const { error } = await service.from('evento_codigos_acceso').insert({
    tenant_id: persona.tenant_id,
    evento_id: eventoId,
    codigo,
    tipo_generacion: 'automatico',
    generado_por: persona.id,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: { codigo } }
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

  if (typeof changes.hora_inicio === 'string' && (changes.hora_inicio as string).length === 5) {
    changes.hora_inicio = changes.hora_inicio + ':00'
  }
  if (typeof changes.hora_fin === 'string' && (changes.hora_fin as string).length === 5) {
    changes.hora_fin = changes.hora_fin + ':00'
  }

  if (changes.fecha_inicio) {
    const fechaDate = new Date(changes.fecha_inicio as string + 'T00:00:00')
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

// ── Agregar invitado a evento ──

export async function agregarInvitadoAction(input: {
  evento_id: string
  persona_id?: string
  email_externo?: string
}): Promise<ActionResult<{ id: string }>> {
  const persona = await getAuthedPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  if (!input.persona_id && !input.email_externo) {
    return { ok: false, error: 'Se requiere persona_id o email_externo' }
  }
  if (input.persona_id && input.email_externo) {
    return { ok: false, error: 'Solo uno: persona_id o email_externo' }
  }

  const token = generateToken()
  const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const service = createServiceRoleClient()
  const { data, error } = await service
    .from('evento_invitados')
    .insert({
      tenant_id: persona.tenant_id,
      evento_id: input.evento_id,
      persona_id: input.persona_id ?? null,
      email_externo: input.email_externo ?? null,
      invitado_tipo: input.persona_id ? 'persona' : 'email_externo',
      estado_invitacion: 'pendiente',
      origen: 'manual',
      token_respuesta: token,
      token_expira_at: tokenExpiry,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error agregando invitado' }

  // Notification for persona
  if (input.persona_id) {
    const { data: ev } = await service
      .from('eventos')
      .select('titulo')
      .eq('id', input.evento_id)
      .single()

    await crearNotificacion({
      tenant_id: persona.tenant_id,
      destinatario_persona_id: input.persona_id,
      tipo: 'invitacion_evento' as never,
      titulo: `Invitacion a: ${ev?.titulo ?? 'Evento'}`,
      mensaje: 'Fuiste invitado a un evento. Acepta o rechaza la invitacion.',
      link_accion: `/admin/${persona.tenant_id}/calendario`,
      prioridad: 'media',
      origen_tabla: 'evento_invitados',
      origen_registro_id: input.evento_id,
      origen_evento: 'invitacion_evento',
      generada_por_persona_id: persona.id,
    })
  }

  return { ok: true, data: { id: data.id } }
}

// ── Responder invitacion (authenticated) ──

export async function responderInvitacionAction(input: {
  evento_invitado_id: string
  estado: EstadoInvitacion
}): Promise<ActionResult<null>> {
  const persona = await getAuthedPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const parsed = ResponderInvitacionSchema.safeParse({ estado: input.estado })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase
    .from('evento_invitados')
    .update({
      estado_invitacion: parsed.data.estado,
      respuesta_at: new Date().toISOString(),
    })
    .eq('id', input.evento_invitado_id)
    .eq('persona_id', persona.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/${persona.tenant_id}/calendario`)
  return { ok: true, data: null }
}

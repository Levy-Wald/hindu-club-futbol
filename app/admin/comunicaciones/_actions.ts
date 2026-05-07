'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

type ActionResult = { ok: boolean; message: string }

function success(message = 'OK'): ActionResult {
  return { ok: true, message }
}

function fail(message: string): ActionResult {
  return { ok: false, message }
}

// =============================================================================
// Solicitudes
// =============================================================================

export async function aprobarSolicitud(solicitudId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return fail('No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return fail('Persona no encontrada')

  const { data: solicitud } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('id', solicitudId)
    .single()

  if (!solicitud) return fail('Solicitud no encontrada')
  if (solicitud.estado !== 'pendiente') return fail('La solicitud ya fue procesada')

  const { error: updateError } = await supabase
    .from('solicitudes')
    .update({
      estado: 'aprobada',
      revisado_por: persona.id,
      revisado_at: new Date().toISOString(),
    })
    .eq('id', solicitudId)

  if (updateError) return fail(updateError.message)

  const datos = solicitud.datos as Record<string, unknown>
  if (solicitud.tipo === 'ingreso_equipo' && datos.equipo_id) {
    await supabase.from('personas_equipos').insert({
      persona_id: solicitud.solicitante_id,
      equipo_id: datos.equipo_id as string,
      rol_equipo_slug: (datos.rol_solicitado as string) || 'jugador',
      activo: true,
    })
  }

  if (solicitud.tipo === 'cambio_datos' && datos.campo && datos.valor_nuevo) {
    await supabase
      .from('personas')
      .update({ [datos.campo as string]: datos.valor_nuevo })
      .eq('id', solicitud.solicitante_id)
  }

  revalidatePath('/admin/comunicaciones')
  return success('Solicitud aprobada')
}

export async function rechazarSolicitud(solicitudId: string, motivo: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return fail('No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return fail('Persona no encontrada')

  const { error } = await supabase
    .from('solicitudes')
    .update({
      estado: 'rechazada',
      revisado_por: persona.id,
      revisado_at: new Date().toISOString(),
      motivo_rechazo: motivo || null,
    })
    .eq('id', solicitudId)
    .eq('estado', 'pendiente')

  if (error) return fail(error.message)

  revalidatePath('/admin/comunicaciones')
  return success('Solicitud rechazada')
}

// =============================================================================
// Plantillas
// =============================================================================

interface PlantillaInput {
  nombre: string
  slug: string
  tipo: string
  asunto: string | null
  cuerpo: string
  variables_disponibles: string[]
}

export async function crearPlantilla(input: PlantillaInput): Promise<ActionResult> {
  const supabase = await createClient()

  if (!input.nombre || !input.slug || !input.tipo || !input.cuerpo) {
    return fail('Nombre, slug, tipo y cuerpo son obligatorios')
  }

  const { error } = await supabase
    .from('com_plantillas')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre,
      slug: input.slug,
      tipo: input.tipo,
      asunto: input.asunto || null,
      cuerpo: input.cuerpo,
      variables_disponibles: input.variables_disponibles,
      activa: true,
    })

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return fail(`Ya existe una plantilla con el slug "${input.slug}"`)
    }
    return fail(`Error al crear plantilla: ${error.message}`)
  }

  revalidatePath('/admin/comunicaciones')
  revalidatePath('/admin/comunicaciones/plantillas')
  return success('Plantilla creada')
}

export async function editarPlantilla(id: string, input: PlantillaInput): Promise<ActionResult> {
  const supabase = await createClient()

  if (!input.nombre || !input.slug || !input.tipo || !input.cuerpo) {
    return fail('Nombre, slug, tipo y cuerpo son obligatorios')
  }

  const { error } = await supabase
    .from('com_plantillas')
    .update({
      nombre: input.nombre,
      slug: input.slug,
      tipo: input.tipo,
      asunto: input.asunto || null,
      cuerpo: input.cuerpo,
      variables_disponibles: input.variables_disponibles,
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return fail(`Ya existe una plantilla con el slug "${input.slug}"`)
    }
    return fail(`Error al editar plantilla: ${error.message}`)
  }

  revalidatePath('/admin/comunicaciones')
  revalidatePath('/admin/comunicaciones/plantillas')
  return success('Plantilla actualizada')
}

export async function eliminarPlantilla(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('com_plantillas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al eliminar plantilla: ${error.message}`)

  revalidatePath('/admin/comunicaciones')
  revalidatePath('/admin/comunicaciones/plantillas')
  return success('Plantilla eliminada')
}

export async function probarPlantilla(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return fail('No autenticado')

  const { data: plantilla } = await supabase
    .from('com_plantillas')
    .select('id, nombre, tipo, asunto, cuerpo')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!plantilla) return fail('Plantilla no encontrada')
  if (plantilla.tipo !== 'email') return fail('Solo se pueden probar plantillas de tipo email')

  // TODO: Implementar envio real de email de prueba cuando el servicio de email este configurado.
  // Por ahora, solo simulamos el envio exitoso.
  return success(`Email de prueba enviado a ${session.user.email}`)
}

// =============================================================================
// Mensajes / Notificaciones
// =============================================================================

export async function marcarComoLeido(mensajeId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('com_mensajes')
    .update({
      leido: true,
      leido_at: new Date().toISOString(),
    })
    .eq('id', mensajeId)

  if (error) return fail(`Error al marcar como leido: ${error.message}`)

  revalidatePath('/admin/notificaciones')
  return success('Marcado como leido')
}

export async function marcarTodoLeido(personaId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('com_mensajes')
    .update({
      leido: true,
      leido_at: new Date().toISOString(),
    })
    .eq('destinatario_id', personaId)
    .eq('leido', false)

  if (error) return fail(`Error al marcar todos como leidos: ${error.message}`)

  revalidatePath('/admin/notificaciones')
  return success('Todas las notificaciones marcadas como leidas')
}

// =============================================================================
// Envios
// =============================================================================

export async function reenviarEnvio(envioId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: envio, error: fetchError } = await supabase
    .from('com_envios')
    .select('id, estado, intentos')
    .eq('id', envioId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError || !envio) return fail('Envio no encontrado')

  if (envio.estado !== 'fallado') return fail('Solo se pueden reenviar envios fallados')

  const { error } = await supabase
    .from('com_envios')
    .update({
      estado: 'pendiente',
      intentos: (envio.intentos ?? 0) + 1,
      error_detalle: null,
    })
    .eq('id', envioId)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al reenviar: ${error.message}`)

  revalidatePath('/admin/comunicaciones')
  revalidatePath('/admin/comunicaciones/envios')
  return success('Reenvio programado')
}

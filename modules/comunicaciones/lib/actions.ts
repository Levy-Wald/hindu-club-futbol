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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
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

import { sincronizarVariablesDisponibles } from './plantillas/parser'

interface PlantillaInput {
  nombre: string
  slug: string
  tipo: string
  descripcion?: string | null
  asunto: string | null
  cuerpo: string
  variables_disponibles: string[]
}

type PlantillaActionResult = { ok: boolean; message: string; plantillaId?: string }

export async function crearPlantilla(input: PlantillaInput): Promise<PlantillaActionResult> {
  const supabase = await createClient()

  if (!input.nombre || !input.slug || !input.tipo || !input.cuerpo) {
    return { ok: false, message: 'Nombre, slug, tipo y cuerpo son obligatorios' }
  }

  const variables = sincronizarVariablesDisponibles(
    input.asunto,
    input.cuerpo,
    input.variables_disponibles
  )

  const { data, error } = await supabase
    .from('com_plantillas')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre,
      slug: input.slug,
      tipo: input.tipo,
      descripcion: input.descripcion || null,
      asunto: input.asunto || null,
      cuerpo: input.cuerpo,
      variables_disponibles: variables,
      activa: true,
      metadata: { es_sistema: false },
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return { ok: false, message: `Ya existe una plantilla con el slug "${input.slug}"` }
    }
    return { ok: false, message: `Error al crear plantilla: ${error.message}` }
  }

  revalidatePath('/admin/comunicaciones')
  revalidatePath('/admin/comunicaciones/plantillas')
  return { ok: true, message: 'Plantilla creada', plantillaId: data?.id }
}

export async function actualizarPlantilla(
  id: string,
  input: Partial<PlantillaInput> & { activa?: boolean }
): Promise<ActionResult> {
  const supabase = await createClient()

  // Fetch current to enforce es_sistema rules
  const { data: current } = await supabase
    .from('com_plantillas')
    .select('slug, tipo, metadata')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!current) return fail('Plantilla no encontrada')

  const esSistema = (current.metadata as Record<string, unknown>)?.es_sistema === true

  // Build update payload
  const update: Record<string, unknown> = {}

  if (input.nombre !== undefined) update.nombre = input.nombre
  if (input.descripcion !== undefined) update.descripcion = input.descripcion || null
  if (input.asunto !== undefined) update.asunto = input.asunto || null
  if (input.cuerpo !== undefined) update.cuerpo = input.cuerpo
  if (input.activa !== undefined) update.activa = input.activa

  // Protect sistema fields
  if (esSistema) {
    if (input.slug !== undefined && input.slug !== current.slug) {
      return fail('No se puede cambiar el slug de una plantilla del sistema')
    }
    if (input.tipo !== undefined && input.tipo !== current.tipo) {
      return fail('No se puede cambiar el tipo de una plantilla del sistema')
    }
  } else {
    if (input.slug !== undefined) update.slug = input.slug
    if (input.tipo !== undefined) update.tipo = input.tipo
  }

  // Auto-sync variables
  if (input.cuerpo !== undefined || input.asunto !== undefined) {
    const cuerpo = input.cuerpo ?? ''
    const asunto = input.asunto ?? null
    const actuales = input.variables_disponibles ?? []
    update.variables_disponibles = sincronizarVariablesDisponibles(asunto, cuerpo, actuales)
  } else if (input.variables_disponibles !== undefined) {
    update.variables_disponibles = input.variables_disponibles
  }

  const { error } = await supabase
    .from('com_plantillas')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return fail(`Ya existe una plantilla con el slug "${input.slug}"`)
    }
    return fail(`Error al actualizar: ${error.message}`)
  }

  revalidatePath('/admin/comunicaciones')
  revalidatePath('/admin/comunicaciones/plantillas')
  return success('Plantilla actualizada')
}

export async function softDeletePlantilla(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: plantilla } = await supabase
    .from('com_plantillas')
    .select('metadata')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!plantilla) return fail('Plantilla no encontrada')

  const esSistema = (plantilla.metadata as Record<string, unknown>)?.es_sistema === true
  if (esSistema) return fail('No se puede eliminar una plantilla del sistema')

  const { error } = await supabase
    .from('com_plantillas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error al eliminar: ${error.message}`)

  revalidatePath('/admin/comunicaciones')
  revalidatePath('/admin/comunicaciones/plantillas')
  return success('Plantilla eliminada')
}

export async function duplicarPlantilla(
  id: string,
  nuevoSlug: string
): Promise<PlantillaActionResult> {
  const supabase = await createClient()

  const { data: original } = await supabase
    .from('com_plantillas')
    .select('nombre, descripcion, tipo, asunto, cuerpo, variables_disponibles')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!original) return { ok: false, message: 'Plantilla no encontrada' }

  const { data, error } = await supabase
    .from('com_plantillas')
    .insert({
      tenant_id: TENANT_ID,
      slug: nuevoSlug,
      nombre: `${original.nombre} (copia)`,
      descripcion: original.descripcion,
      tipo: original.tipo,
      asunto: original.asunto,
      cuerpo: original.cuerpo,
      variables_disponibles: original.variables_disponibles,
      activa: true,
      metadata: { es_sistema: false },
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return { ok: false, message: `Ya existe una plantilla con el slug "${nuevoSlug}"` }
    }
    return { ok: false, message: `Error al duplicar: ${error.message}` }
  }

  revalidatePath('/admin/comunicaciones')
  revalidatePath('/admin/comunicaciones/plantillas')
  return { ok: true, message: 'Plantilla duplicada', plantillaId: data?.id }
}

export async function toggleActivaPlantilla(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: plantilla } = await supabase
    .from('com_plantillas')
    .select('activa')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!plantilla) return fail('Plantilla no encontrada')

  const { error } = await supabase
    .from('com_plantillas')
    .update({ activa: !plantilla.activa })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(`Error: ${error.message}`)

  revalidatePath('/admin/comunicaciones')
  revalidatePath('/admin/comunicaciones/plantillas')
  return success(plantilla.activa ? 'Plantilla desactivada' : 'Plantilla activada')
}

// Keep old name as alias for backward compat with plantillas-client.tsx
export async function editarPlantilla(id: string, input: PlantillaInput): Promise<ActionResult> {
  return actualizarPlantilla(id, input)
}

export async function eliminarPlantilla(id: string): Promise<ActionResult> {
  return softDeletePlantilla(id)
}

export async function probarPlantilla(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return fail('Persona no encontrada')

  const { data: plantilla } = await supabase
    .from('com_plantillas')
    .select('id, nombre, slug, tipo, asunto, cuerpo, variables_disponibles')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!plantilla) return fail('Plantilla no encontrada')

  // Build sample variables
  const sampleVars: Record<string, string> = {}
  for (const v of plantilla.variables_disponibles ?? []) {
    sampleVars[v] = `[${v}]`
  }

  const { enviarComunicacion } = await import('./cliente')
  const result = await enviarComunicacion({
    personaId: persona.id,
    plantillaSlug: plantilla.slug,
    variables: sampleVars,
    canal: plantilla.tipo as 'email' | 'inapp',
  })

  if (!result.ok) return fail(result.error || 'Error al enviar prueba')

  revalidatePath('/admin/comunicaciones')
  return success(`Prueba enviada (${plantilla.tipo})`)
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

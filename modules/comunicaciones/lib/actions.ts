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
  input: Partial<PlantillaInput> & { activa?: boolean; body_html?: string }
): Promise<ActionResult> {
  const supabase = await createClient()

  // Fetch current to enforce es_sistema rules
  const { data: current } = await supabase
    .from('com_plantillas')
    .select('slug, tipo, metadata, version')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!current) return fail('Plantilla no encontrada')

  const esSistema = (current.metadata as Record<string, unknown>)?.es_sistema === true
  const newVersion = (current.version ?? 1) + 1

  // Build update payload
  const update: Record<string, unknown> = {}

  if (input.nombre !== undefined) update.nombre = input.nombre
  if (input.descripcion !== undefined) update.descripcion = input.descripcion || null
  if (input.asunto !== undefined) update.asunto = input.asunto || null
  if (input.cuerpo !== undefined) update.cuerpo = input.cuerpo
  if (input.body_html !== undefined) update.body_html = input.body_html
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

  // Bump version
  update.version = newVersion

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

  // Save version snapshot
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('com_plantilla_versiones').insert({
    plantilla_id: id,
    version: newVersion,
    subject: input.asunto ?? null,
    body_html: input.body_html ?? null,
    body_text: input.cuerpo ?? null,
    guardado_por_user_id: user?.id ?? null,
  })

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
// Envíos masivos
// =============================================================================

import type { SegmentoConfig } from './segmentos/tipos'
import type { EnvioMasivoResultado } from './cliente'

type EnvioMasivoActionResult = {
  ok: boolean
  message: string
  resultado?: EnvioMasivoResultado
}

export async function ejecutarEnvioMasivo(input: {
  plantillaSlug: string
  canal: 'email' | 'inapp'
  segmento: SegmentoConfig
}): Promise<EnvioMasivoActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'No autenticado' }

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!persona) return { ok: false, message: 'Persona no encontrada' }

  // Check permissions
  const { data: attrs } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona.id)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)

  const atributos = (attrs ?? []).map(a => a.atributo_slug)
  const tienePermiso = atributos.includes('sistema.admin') ||
    atributos.includes('tenant.admin') ||
    atributos.includes('comunicaciones.admin')

  if (!tienePermiso) return { ok: false, message: 'Sin permisos para envíos masivos' }

  try {
    const { enviarComunicacionMasiva } = await import('./cliente')
    const resultado = await enviarComunicacionMasiva({
      tenantId: TENANT_ID,
      plantillaSlug: input.plantillaSlug,
      canal: input.canal,
      segmento: input.segmento,
    })

    revalidatePath('/admin/comunicaciones')
    return { ok: true, message: 'Envío masivo completado', resultado }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return { ok: false, message: msg }
  }
}

// =============================================================================
// Automatizaciones (triggers manuales)
// =============================================================================

import { createServiceRoleClient } from '@/lib/supabase/service-role'

const VALID_TRIGGERS = ['apto_vence_7d', 'cuota_vence_7d', 'cuota_vencida_7d'] as const

export async function ejecutarTriggerManual(jobSlug: string): Promise<ActionResult> {
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

  const { data: attrs } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona.id)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)

  const atributos = (attrs ?? []).map(a => a.atributo_slug)
  const tienePermiso = atributos.includes('sistema.admin') ||
    atributos.includes('tenant.admin') ||
    atributos.includes('comunicaciones.admin')
  if (!tienePermiso) return fail('Sin permisos para ejecutar automatizaciones')

  if (!VALID_TRIGGERS.includes(jobSlug as typeof VALID_TRIGGERS[number])) {
    return fail(`Trigger desconocido: ${jobSlug}`)
  }

  const serviceRole = createServiceRoleClient()
  const jobId = crypto.randomUUID()

  await serviceRole.from('com_jobs_log').insert({
    id: jobId,
    tenant_id: TENANT_ID,
    job_slug: jobSlug,
    status: 'running',
  })

  try {
    let result
    if (jobSlug === 'apto_vence_7d') {
      const { ejecutarAptoVence7d } = await import('./triggers/apto-vence-7d')
      result = await ejecutarAptoVence7d(serviceRole, TENANT_ID, jobId)
    } else if (jobSlug === 'cuota_vence_7d') {
      const { ejecutarCuotaVence7d } = await import('./triggers/cuota-vence-7d')
      result = await ejecutarCuotaVence7d(serviceRole, TENANT_ID, jobId)
    } else {
      const { ejecutarCuotaVencida7d } = await import('./triggers/cuota-vencida-7d')
      result = await ejecutarCuotaVencida7d(serviceRole, TENANT_ID, jobId)
    }

    await serviceRole.from('com_jobs_log').update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      personas_encontradas: result.personas_encontradas,
      personas_notificadas: result.personas_notificadas,
      personas_dedup: result.personas_dedup,
      errores: result.errores,
      metadata: { lote_id: result.lote_id, detalles: result.detalles },
    }).eq('id', jobId)

    revalidatePath('/admin/comunicaciones')
    return success(`Trigger ${jobSlug} ejecutado: ${result.personas_notificadas} notificadas`)
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Error desconocido'
    await serviceRole.from('com_jobs_log').update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      metadata: { error: errorMsg },
    }).eq('id', jobId)

    return fail(`Error ejecutando trigger: ${errorMsg}`)
  }
}

// =============================================================================
// Test Send (plantilla a persona específica, mock-first ADR-035)
// =============================================================================

export async function testSendPlantilla(
  plantillaId: string,
  personaId?: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail('No autenticado')

  // If no persona specified, use current user's persona
  let targetPersonaId: string = personaId ?? ''
  if (!targetPersonaId) {
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()
    if (!persona) return fail('Persona no encontrada')
    targetPersonaId = persona.id
  }

  const { data: plantilla } = await supabase
    .from('com_plantillas')
    .select('id, nombre, slug, tipo, asunto, cuerpo, variables_disponibles')
    .eq('id', plantillaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!plantilla) return fail('Plantilla no encontrada')

  const sampleVars: Record<string, string> = {}
  for (const v of plantilla.variables_disponibles ?? []) {
    sampleVars[v] = `[${v}]`
  }

  const { enviarComunicacion } = await import('./cliente')
  const result = await enviarComunicacion({
    personaId: targetPersonaId,
    plantillaSlug: plantilla.slug,
    variables: sampleVars,
    canal: plantilla.tipo as 'email' | 'inapp',
  })

  if (!result.ok) return fail(result.error || 'Error al enviar prueba')

  revalidatePath('/admin/comunicaciones')
  return success(`Test enviado (${plantilla.tipo}) a persona ${targetPersonaId.slice(0, 8)}...`)
}

// =============================================================================
// Automatizaciones CRUD (com_automatizaciones + com_automatizaciones_pasos)
// =============================================================================

interface AutomatizacionInput {
  nombre: string
  slug: string
  trigger_evento: string
  descripcion?: string | null
  condiciones_json?: Record<string, unknown> | null
  activo?: boolean
}

export async function crearAutomatizacion(
  input: AutomatizacionInput
): Promise<{ ok: boolean; message: string; id?: string }> {
  const supabase = await createClient()

  if (!input.nombre || !input.slug || !input.trigger_evento) {
    return { ok: false, message: 'Nombre, slug y trigger son obligatorios' }
  }

  const { data, error } = await supabase
    .from('com_automatizaciones')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre,
      slug: input.slug,
      trigger_evento: input.trigger_evento,
      descripcion: input.descripcion || null,
      condiciones_json: input.condiciones_json || null,
      activo: input.activo ?? false,
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return { ok: false, message: `Ya existe una automatizacion con slug "${input.slug}"` }
    }
    return { ok: false, message: error.message }
  }

  revalidatePath('/admin/comunicaciones')
  return { ok: true, message: 'Automatizacion creada', id: data?.id }
}

export async function actualizarAutomatizacion(
  id: string,
  input: Partial<AutomatizacionInput>
): Promise<ActionResult> {
  const supabase = await createClient()

  const update: Record<string, unknown> = {}
  if (input.nombre !== undefined) update.nombre = input.nombre
  if (input.descripcion !== undefined) update.descripcion = input.descripcion || null
  if (input.trigger_evento !== undefined) update.trigger_evento = input.trigger_evento
  if (input.condiciones_json !== undefined) update.condiciones_json = input.condiciones_json
  if (input.activo !== undefined) update.activo = input.activo

  const { error } = await supabase
    .from('com_automatizaciones')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(error.message)

  revalidatePath('/admin/comunicaciones')
  return success('Automatizacion actualizada')
}

export async function toggleActivoAutomatizacion(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('com_automatizaciones')
    .select('activo')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!data) return fail('Automatizacion no encontrada')

  const { error } = await supabase
    .from('com_automatizaciones')
    .update({ activo: !data.activo })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(error.message)

  revalidatePath('/admin/comunicaciones')
  return success(data.activo ? 'Automatizacion desactivada' : 'Automatizacion activada')
}

export async function softDeleteAutomatizacion(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('com_automatizaciones')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(error.message)

  revalidatePath('/admin/comunicaciones')
  return success('Automatizacion eliminada')
}

interface PasoInput {
  automatizacion_id: string
  tipo_paso: string
  config_json: Record<string, unknown>
  orden: number
}

export async function crearPaso(input: PasoInput): Promise<{ ok: boolean; message: string; id?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('com_automatizaciones_pasos')
    .insert({
      automatizacion_id: input.automatizacion_id,
      tipo_paso: input.tipo_paso,
      config_json: input.config_json,
      orden: input.orden,
    })
    .select('id')
    .single()

  if (error) return { ok: false, message: error.message }

  revalidatePath('/admin/comunicaciones')
  return { ok: true, message: 'Paso creado', id: data?.id }
}

export async function actualizarPaso(
  id: string,
  input: Partial<{ tipo_paso: string; config_json: Record<string, unknown>; orden: number }>
): Promise<ActionResult> {
  const supabase = await createClient()

  const update: Record<string, unknown> = {}
  if (input.tipo_paso !== undefined) update.tipo_paso = input.tipo_paso
  if (input.config_json !== undefined) update.config_json = input.config_json
  if (input.orden !== undefined) update.orden = input.orden

  const { error } = await supabase
    .from('com_automatizaciones_pasos')
    .update(update)
    .eq('id', id)

  if (error) return fail(error.message)

  revalidatePath('/admin/comunicaciones')
  return success('Paso actualizado')
}

export async function reordenarPasos(
  automatizacionId: string,
  orderedIds: string[]
): Promise<ActionResult> {
  const supabase = await createClient()

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('com_automatizaciones_pasos')
      .update({ orden: i + 1 })
      .eq('id', orderedIds[i])
      .eq('automatizacion_id', automatizacionId)
    if (error) return fail(error.message)
  }

  revalidatePath('/admin/comunicaciones')
  return success('Pasos reordenados')
}

export async function eliminarPaso(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('com_automatizaciones_pasos')
    .delete()
    .eq('id', id)

  if (error) return fail(error.message)

  revalidatePath('/admin/comunicaciones')
  return success('Paso eliminado')
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

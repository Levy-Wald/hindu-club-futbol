'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { EstadoProyecto, EstadoTarea, Prioridad, RolMiembro } from './tipos'
import { TENANT_ID } from '@/lib/tenant'


type ActionResult = { ok: boolean; message: string; id?: string }

function success(message = 'OK', id?: string): ActionResult {
  return { ok: true, message, id }
}

function fail(message: string): ActionResult {
  return { ok: false, message }
}

// =============================================================================
// Proyectos
// =============================================================================

export async function crearProyecto(input: {
  nombre: string
  descripcion?: string
  codigo?: string
  responsable_persona_id?: string
  cliente_persona_id?: string
  cliente_entidad_id?: string
  fecha_inicio?: string
  fecha_fin_estimada?: string
  estado?: EstadoProyecto
  presupuesto_total?: number
  moneda?: string
  color?: string
}): Promise<ActionResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proyectos')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre,
      descripcion: input.descripcion || null,
      codigo: input.codigo || null,
      responsable_persona_id: input.responsable_persona_id || null,
      cliente_persona_id: input.cliente_persona_id || null,
      cliente_entidad_id: input.cliente_entidad_id || null,
      fecha_inicio: input.fecha_inicio || null,
      fecha_fin_estimada: input.fecha_fin_estimada || null,
      estado: input.estado ?? 'planificado',
      presupuesto_total: input.presupuesto_total ?? null,
      moneda: input.moneda ?? 'ARS',
      color: input.color ?? '#475569',
    })
    .select('id')
    .single()

  if (error) return fail(error.message)

  // Add responsable as member if set
  if (input.responsable_persona_id && data) {
    await supabase.from('proyecto_miembros').upsert({
      proyecto_id: data.id,
      persona_id: input.responsable_persona_id,
      rol: 'responsable' as RolMiembro,
    })
  }

  revalidatePath('/admin/proyectos')
  return success('Proyecto creado', data.id)
}

export async function actualizarProyecto(id: string, input: {
  nombre?: string
  descripcion?: string
  codigo?: string
  responsable_persona_id?: string | null
  cliente_persona_id?: string | null
  cliente_entidad_id?: string | null
  fecha_inicio?: string | null
  fecha_fin_estimada?: string | null
  fecha_fin_real?: string | null
  estado?: EstadoProyecto
  presupuesto_total?: number | null
  moneda?: string
  color?: string
}): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('proyectos')
    .update(input)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(error.message)

  revalidatePath(`/admin/proyectos/${id}`)
  revalidatePath('/admin/proyectos')
  return success('Proyecto actualizado')
}

export async function softDeleteProyecto(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('proyectos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return fail(error.message)

  revalidatePath('/admin/proyectos')
  return success('Proyecto eliminado')
}

// =============================================================================
// Tareas
// =============================================================================

export async function crearTarea(input: {
  proyecto_id: string
  titulo: string
  descripcion?: string
  estado_slug?: EstadoTarea
  asignado_persona_id?: string
  prioridad?: Prioridad
  fecha_limite?: string
  parent_tarea_id?: string
  tiempo_estimado_horas?: number
  tags?: string[]
}): Promise<ActionResult> {
  const supabase = await createClient()

  // Get max posicion for the target estado
  const estado = input.estado_slug ?? 'backlog'
  const { data: maxPos } = await supabase
    .from('proyecto_tareas')
    .select('posicion_kanban')
    .eq('proyecto_id', input.proyecto_id)
    .eq('estado_slug', estado)
    .is('deleted_at', null)
    .order('posicion_kanban', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPos = ((maxPos as { posicion_kanban: number } | null)?.posicion_kanban ?? 0) + 1000

  const { data, error } = await supabase
    .from('proyecto_tareas')
    .insert({
      proyecto_id: input.proyecto_id,
      titulo: input.titulo,
      descripcion: input.descripcion || null,
      estado_slug: estado,
      asignado_persona_id: input.asignado_persona_id || null,
      prioridad: input.prioridad ?? 'media',
      fecha_limite: input.fecha_limite || null,
      parent_tarea_id: input.parent_tarea_id || null,
      tiempo_estimado_horas: input.tiempo_estimado_horas ?? null,
      tags: input.tags ?? [],
      posicion_kanban: nextPos,
    })
    .select('id')
    .single()

  if (error) return fail(error.message)

  revalidatePath(`/admin/proyectos/${input.proyecto_id}`)
  return success('Tarea creada', data.id)
}

export async function actualizarTarea(id: string, proyectoId: string, input: {
  titulo?: string
  descripcion?: string | null
  estado_slug?: EstadoTarea
  asignado_persona_id?: string | null
  prioridad?: Prioridad
  fecha_limite?: string | null
  tiempo_estimado_horas?: number | null
  tiempo_real_horas?: number | null
  tags?: string[]
}): Promise<ActionResult> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { ...input }

  // If marking as done, set fecha_completada
  if (input.estado_slug === 'hecho') {
    updateData.fecha_completada = new Date().toISOString()
  } else if (input.estado_slug) {
    updateData.fecha_completada = null
  }

  const { error } = await supabase
    .from('proyecto_tareas')
    .update(updateData)
    .eq('id', id)

  if (error) return fail(error.message)

  revalidatePath(`/admin/proyectos/${proyectoId}`)
  return success('Tarea actualizada')
}

export async function actualizarEstadoTarea(id: string, proyectoId: string, nuevoEstado: EstadoTarea): Promise<ActionResult> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { estado_slug: nuevoEstado }
  if (nuevoEstado === 'hecho') {
    updateData.fecha_completada = new Date().toISOString()
  } else {
    updateData.fecha_completada = null
  }

  // Get max position in target column
  const { data: maxPos } = await supabase
    .from('proyecto_tareas')
    .select('posicion_kanban')
    .eq('proyecto_id', proyectoId)
    .eq('estado_slug', nuevoEstado)
    .is('deleted_at', null)
    .order('posicion_kanban', { ascending: false })
    .limit(1)
    .maybeSingle()

  updateData.posicion_kanban = ((maxPos as { posicion_kanban: number } | null)?.posicion_kanban ?? 0) + 1000

  const { error } = await supabase
    .from('proyecto_tareas')
    .update(updateData)
    .eq('id', id)

  if (error) return fail(error.message)

  revalidatePath(`/admin/proyectos/${proyectoId}`)
  return success('Estado actualizado')
}

export async function actualizarPosicionKanban(id: string, proyectoId: string, nuevaPosicion: number, nuevoEstado?: EstadoTarea): Promise<ActionResult> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { posicion_kanban: nuevaPosicion }
  if (nuevoEstado) {
    updateData.estado_slug = nuevoEstado
    if (nuevoEstado === 'hecho') {
      updateData.fecha_completada = new Date().toISOString()
    } else {
      updateData.fecha_completada = null
    }
  }

  const { error } = await supabase
    .from('proyecto_tareas')
    .update(updateData)
    .eq('id', id)

  if (error) return fail(error.message)

  revalidatePath(`/admin/proyectos/${proyectoId}`)
  return success('Posición actualizada')
}

export async function softDeleteTarea(id: string, proyectoId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('proyecto_tareas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return fail(error.message)

  revalidatePath(`/admin/proyectos/${proyectoId}`)
  return success('Tarea eliminada')
}

// =============================================================================
// Miembros
// =============================================================================

export async function agregarMiembro(proyectoId: string, personaId: string, rol: RolMiembro = 'miembro'): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('proyecto_miembros')
    .upsert({
      proyecto_id: proyectoId,
      persona_id: personaId,
      rol,
    })

  if (error) return fail(error.message)

  revalidatePath(`/admin/proyectos/${proyectoId}`)
  return success('Miembro agregado')
}

export async function actualizarRolMiembro(proyectoId: string, personaId: string, rol: RolMiembro): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('proyecto_miembros')
    .update({ rol })
    .eq('proyecto_id', proyectoId)
    .eq('persona_id', personaId)

  if (error) return fail(error.message)

  revalidatePath(`/admin/proyectos/${proyectoId}`)
  return success('Rol actualizado')
}

export async function eliminarMiembro(proyectoId: string, personaId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('proyecto_miembros')
    .delete()
    .eq('proyecto_id', proyectoId)
    .eq('persona_id', personaId)

  if (error) return fail(error.message)

  revalidatePath(`/admin/proyectos/${proyectoId}`)
  return success('Miembro eliminado')
}

// =============================================================================
// Comentarios
// =============================================================================

export async function crearComentario(input: {
  proyecto_id: string
  tarea_id?: string
  texto: string
  menciones?: unknown[]
}): Promise<ActionResult> {
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
    .from('proyecto_comentarios')
    .insert({
      proyecto_id: input.proyecto_id,
      tarea_id: input.tarea_id || null,
      persona_id: persona.id,
      texto: input.texto,
      menciones: input.menciones ?? [],
    })

  if (error) return fail(error.message)

  revalidatePath(`/admin/proyectos/${input.proyecto_id}`)
  return success('Comentario agregado')
}

export async function eliminarComentario(id: string, proyectoId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('proyecto_comentarios')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return fail(error.message)

  revalidatePath(`/admin/proyectos/${proyectoId}`)
  return success('Comentario eliminado')
}

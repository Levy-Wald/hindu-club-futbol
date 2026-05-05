'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

// --- CREAR EQUIPO ---

export async function crearEquipo(input: {
  nombre: string
  categoria_equipo_id: string | null
  disciplina_slug: string
  modalidad?: string
}) {
  const supabase = await createClient()

  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio.')
  }
  if (!input.disciplina_slug) {
    return formatResult(false, 'La disciplina es obligatoria.')
  }

  const { data, error } = await supabase
    .from('equipos')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre.trim(),
      categoria_id: input.categoria_equipo_id || null,
      disciplina_slug: input.disciplina_slug,
      modalidad: input.modalidad || null,
    })
    .select('id')
    .single()

  if (error) {
    return formatResult(false, `Error al crear equipo: ${error.message}`)
  }

  revalidatePath('/admin/equipos')
  return formatResult(true, 'Equipo creado correctamente.', data)
}

// --- EDITAR EQUIPO ---

export async function editarEquipo(
  id: string,
  input: {
    nombre?: string
    categoria_equipo_id?: string | null
    disciplina_slug?: string
    modalidad?: string
    activo?: boolean
  }
) {
  const supabase = await createClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.nombre !== undefined) updates.nombre = input.nombre.trim()
  if (input.categoria_equipo_id !== undefined) updates.categoria_id = input.categoria_equipo_id || null
  if (input.disciplina_slug !== undefined) updates.disciplina_slug = input.disciplina_slug
  if (input.modalidad !== undefined) updates.modalidad = input.modalidad || null
  if (input.activo !== undefined) updates.activo = input.activo

  const { error } = await supabase
    .from('equipos')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al editar equipo: ${error.message}`)
  }

  revalidatePath('/admin/equipos')
  revalidatePath(`/admin/equipos/${id}`)
  return formatResult(true, 'Equipo actualizado correctamente.')
}

// --- AGREGAR MIEMBRO ---

export async function agregarMiembro(input: {
  equipo_id: string
  persona_id: string
  rol_equipo_slug: string
  dorsal?: number | null
  posicion?: string | null
}) {
  const supabase = await createClient()

  if (!input.persona_id || !input.rol_equipo_slug) {
    return formatResult(false, 'Persona y rol son obligatorios.')
  }

  const { error } = await supabase
    .from('personas_equipos')
    .insert({
      tenant_id: TENANT_ID,
      equipo_id: input.equipo_id,
      persona_id: input.persona_id,
      rol_equipo_slug: input.rol_equipo_slug,
      dorsal: input.dorsal ?? null,
      posicion: input.posicion?.trim() || null,
    })

  if (error) {
    if (error.code === '23505') {
      return formatResult(false, 'Esta persona ya tiene ese rol en el equipo.')
    }
    return formatResult(false, `Error al agregar miembro: ${error.message}`)
  }

  revalidatePath(`/admin/equipos/${input.equipo_id}`)
  return formatResult(true, 'Miembro agregado correctamente.')
}

// --- QUITAR MIEMBRO (soft delete) ---

export async function quitarMiembro(personaEquipoId: string, equipoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('personas_equipos')
    .update({ activo: false, fecha_fin: new Date().toISOString().split('T')[0] })
    .eq('id', personaEquipoId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al quitar miembro: ${error.message}`)
  }

  revalidatePath(`/admin/equipos/${equipoId}`)
  return formatResult(true, 'Miembro desvinculado correctamente.')
}

// --- CREAR HORARIO ---

export async function crearHorario(input: {
  equipo_id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  tipo_actividad: string
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('equipos_horarios')
    .insert({
      tenant_id: TENANT_ID,
      equipo_id: input.equipo_id,
      dia_semana: input.dia_semana,
      hora_inicio: input.hora_inicio,
      hora_fin: input.hora_fin,
      tipo_actividad: input.tipo_actividad,
    })

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/equipos/${input.equipo_id}`)
  return formatResult(true, 'Horario creado')
}

// --- ELIMINAR HORARIO ---

export async function eliminarHorario(horarioId: string, equipoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('equipos_horarios')
    .delete()
    .eq('id', horarioId)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/equipos/${equipoId}`)
  return formatResult(true, 'Horario eliminado')
}

// --- BUSCAR PERSONAS ---

export async function buscarPersonas(query: string) {
  if (!query || query.trim().length < 2) {
    return { ok: true, data: [] }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento')
    .is('deleted_at', null)
    .or(
      `nombre.ilike.%${query.trim()}%,apellido.ilike.%${query.trim()}%,numero_documento.ilike.%${query.trim()}%`
    )
    .limit(8)

  if (error) {
    return { ok: false, data: [] }
  }

  return { ok: true, data: data ?? [] }
}

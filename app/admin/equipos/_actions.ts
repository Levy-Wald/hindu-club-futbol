'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

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
    color_principal?: string
    color_secundario?: string
    entidad_id?: string | null
    torneo?: string | null
  }
) {
  const supabase = await createClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.nombre !== undefined) updates.nombre = input.nombre.trim()
  if (input.categoria_equipo_id !== undefined) updates.categoria_id = input.categoria_equipo_id || null
  if (input.disciplina_slug !== undefined) updates.disciplina_slug = input.disciplina_slug
  if (input.modalidad !== undefined) updates.modalidad = input.modalidad || null
  if (input.activo !== undefined) updates.activo = input.activo
  if (input.color_principal !== undefined) updates.color_principal = input.color_principal || null
  if (input.color_secundario !== undefined) updates.color_secundario = input.color_secundario || null
  if (input.entidad_id !== undefined) updates.entidad_id = input.entidad_id || null
  if (input.torneo !== undefined) updates.torneo = input.torneo || null

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

// --- EDITAR MIEMBRO ---

export async function editarMiembroEquipo(
  personaEquipoId: string,
  equipoId: string,
  input: {
    rol_equipo_slug: string
  }
) {
  const supabase = await createClient()

  if (!input.rol_equipo_slug) {
    return formatResult(false, 'El rol es obligatorio.')
  }

  // Obtener el miembro actual para saber persona_id y rol anterior
  const { data: current } = await supabase
    .from('personas_equipos')
    .select('persona_id, rol_equipo_slug')
    .eq('id', personaEquipoId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!current) {
    return formatResult(false, 'Miembro no encontrado.')
  }

  // Si el rol no cambió, no hacer nada
  if (current.rol_equipo_slug === input.rol_equipo_slug) {
    return formatResult(true, 'Sin cambios.')
  }

  // Desactivar cualquier registro existente con el nuevo rol para esta persona+equipo
  await supabase
    .from('personas_equipos')
    .update({ activo: false, fecha_fin: new Date().toISOString().split('T')[0] })
    .eq('persona_id', current.persona_id)
    .eq('equipo_id', equipoId)
    .eq('rol_equipo_slug', input.rol_equipo_slug)
    .eq('activo', true)
    .eq('tenant_id', TENANT_ID)
    .neq('id', personaEquipoId)

  const { error } = await supabase
    .from('personas_equipos')
    .update({
      rol_equipo_slug: input.rol_equipo_slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', personaEquipoId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al editar miembro: ${error.message}`)
  }

  revalidatePath(`/admin/equipos/${equipoId}`)
  revalidatePath('/admin/mi-equipo')
  return formatResult(true, 'Rol actualizado correctamente.')
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

// --- CREAR EVENTO ---

export async function crearEvento(input: {
  equipo_id: string
  fecha: string  // YYYY-MM-DD
  hora_inicio: string
  hora_fin: string
  tipo_actividad: string
  titulo?: string | null
  sede_id?: string | null
  cancha_id?: string | null
  hora_citacion?: string | null
  descripcion?: string | null
}) {
  const supabase = await createClient()

  // Compute dia_semana from fecha for backward compat
  const fechaDate = new Date(input.fecha + 'T00:00:00')
  const jsDay = fechaDate.getDay()
  const diaSemana = jsDay === 0 ? 7 : jsDay

  const { error } = await supabase
    .from('equipos_horarios')
    .insert({
      tenant_id: TENANT_ID,
      equipo_id: input.equipo_id,
      fecha: input.fecha,
      dia_semana: diaSemana,
      hora_inicio: input.hora_inicio,
      hora_fin: input.hora_fin,
      tipo_actividad: input.tipo_actividad,
      titulo: input.titulo?.trim() || null,
      sede_id: input.sede_id || null,
      cancha_id: input.cancha_id || null,
      hora_citacion: input.hora_citacion || null,
      descripcion: input.descripcion?.trim() || null,
    })

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/equipos/${input.equipo_id}`)
  revalidatePath('/admin/mi-equipo')
  return formatResult(true, 'Evento creado')
}

// --- EDITAR EVENTO ---

export async function editarEvento(
  eventoId: string,
  equipoId: string,
  input: {
    fecha?: string
    hora_inicio?: string
    hora_fin?: string
    tipo_actividad?: string
    titulo?: string | null
    sede_id?: string | null
    cancha_id?: string | null
    hora_citacion?: string | null
    descripcion?: string | null
  }
) {
  const supabase = await createClient()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (input.fecha !== undefined) {
    updates.fecha = input.fecha
    const fechaDate = new Date(input.fecha + 'T00:00:00')
    const jsDay = fechaDate.getDay()
    updates.dia_semana = jsDay === 0 ? 7 : jsDay
  }
  if (input.hora_inicio !== undefined) updates.hora_inicio = input.hora_inicio
  if (input.hora_fin !== undefined) updates.hora_fin = input.hora_fin
  if (input.tipo_actividad !== undefined) updates.tipo_actividad = input.tipo_actividad
  if (input.titulo !== undefined) updates.titulo = input.titulo?.trim() || null
  if (input.sede_id !== undefined) updates.sede_id = input.sede_id || null
  if (input.cancha_id !== undefined) updates.cancha_id = input.cancha_id || null
  if (input.hora_citacion !== undefined) updates.hora_citacion = input.hora_citacion || null
  if (input.descripcion !== undefined) updates.descripcion = input.descripcion?.trim() || null

  const { error } = await supabase
    .from('equipos_horarios')
    .update(updates)
    .eq('id', eventoId)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, `Error al editar evento: ${error.message}`)

  revalidatePath(`/admin/equipos/${equipoId}`)
  revalidatePath('/admin/mi-equipo')
  return formatResult(true, 'Evento actualizado')
}

// --- ELIMINAR EVENTO ---

export async function eliminarEvento(eventoId: string, equipoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('equipos_horarios')
    .delete()
    .eq('id', eventoId)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/equipos/${equipoId}`)
  revalidatePath('/admin/mi-equipo')
  return formatResult(true, 'Evento eliminado')
}

// --- BACKWARD COMPAT: CREAR HORARIO ---

export async function crearHorario(input: {
  equipo_id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  tipo_actividad: string
  sede_id?: string | null
  cancha_id?: string | null
  hora_citacion?: string | null
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
      sede_id: input.sede_id || null,
      cancha_id: input.cancha_id || null,
      metadata: input.hora_citacion ? { hora_citacion: input.hora_citacion } : {},
    })

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/equipos/${input.equipo_id}`)
  revalidatePath('/admin/mi-equipo')
  return formatResult(true, 'Horario creado')
}

// --- BACKWARD COMPAT: ELIMINAR HORARIO ---

export async function eliminarHorario(horarioId: string, equipoId: string) {
  return eliminarEvento(horarioId, equipoId)
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

// --- UPLOAD FOTO INDUMENTARIA ---

export async function uploadIndumentariaFoto(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File | null
  const equipoId = formData.get('equipoId') as string | null
  const tipo = formData.get('tipo') as string | null

  if (!file || !equipoId || !tipo) {
    return formatResult(false, 'Faltan datos: archivo, equipoId o tipo.')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
  if (!allowedExts.includes(ext)) {
    return formatResult(false, `Extension no permitida: .${ext}`)
  }

  const path = `equipos/${equipoId}/indumentaria/${tipo}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('public-assets')
    .upload(path, file, { upsert: true })

  if (uploadError) {
    return formatResult(false, `Error al subir archivo: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('public-assets')
    .getPublicUrl(path)

  return formatResult(true, 'Foto subida correctamente.', { url: urlData.publicUrl })
}

// --- UPLOAD FOTO EQUIPO ---

export async function uploadFotoEquipo(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File | null
  const equipoId = formData.get('equipoId') as string | null

  if (!file || !equipoId) {
    return formatResult(false, 'Faltan datos: archivo o equipoId.')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']
  if (!allowedExts.includes(ext)) {
    return formatResult(false, `Extension no permitida: .${ext}`)
  }

  const path = `equipos/${equipoId}/foto-equipo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('public-assets')
    .upload(path, file, { upsert: true })

  if (uploadError) {
    return formatResult(false, `Error al subir archivo: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('public-assets')
    .getPublicUrl(path)

  // Tambien actualizar el campo en la tabla
  await supabase
    .from('equipos')
    .update({ foto_equipo_url: urlData.publicUrl })
    .eq('id', equipoId)
    .eq('tenant_id', TENANT_ID)

  revalidatePath(`/admin/equipos/${equipoId}`)
  return formatResult(true, 'Foto del equipo subida correctamente.', { url: urlData.publicUrl })
}

// --- ACTUALIZAR INDUMENTARIA ---

export async function actualizarIndumentaria(
  equipoId: string,
  indumentaria: Record<string, { descripcion?: string; foto_url?: string }>
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('equipos')
    .update({ indumentaria })
    .eq('id', equipoId)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/equipos/${equipoId}`)
  return formatResult(true, 'Indumentaria actualizada')
}

// --- ACTUALIZAR FOTO EQUIPO ---

export async function actualizarFotoEquipo(equipoId: string, fotoUrl: string | null) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('equipos')
    .update({ foto_equipo_url: fotoUrl })
    .eq('id', equipoId)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/equipos/${equipoId}`)
  return formatResult(true, 'Foto del equipo actualizada')
}

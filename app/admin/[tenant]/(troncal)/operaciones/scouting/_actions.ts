'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

const ESTADOS_VALIDOS = [
  'observado',
  'contactado',
  'en_negociacion',
  'descartado',
  'incorporado',
] as const

// --- CREAR FICHA ---

export interface CrearScoutingInput {
  nombre: string
  apellido: string
  fecha_nacimiento?: string
  posicion?: string
  club_actual?: string
  contacto?: string
  estado?: string
  observaciones?: string
  evaluacion?: number
  equipo_id?: string
  scout_id?: string
}

export async function crearScoutingFicha(input: CrearScoutingInput) {
  if (!input.nombre?.trim()) {
    return formatResult(false, 'El nombre es obligatorio.')
  }
  if (!input.apellido?.trim()) {
    return formatResult(false, 'El apellido es obligatorio.')
  }

  const estado = input.estado || 'observado'
  if (!ESTADOS_VALIDOS.includes(estado as (typeof ESTADOS_VALIDOS)[number])) {
    return formatResult(false, 'Estado inválido.')
  }

  if (input.evaluacion !== undefined && (input.evaluacion < 1 || input.evaluacion > 5)) {
    return formatResult(false, 'La evaluación debe ser entre 1 y 5.')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('scouting_fichas')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      fecha_nacimiento: input.fecha_nacimiento || null,
      posicion: input.posicion?.trim() || null,
      club_actual: input.club_actual?.trim() || null,
      contacto: input.contacto?.trim() || null,
      estado,
      observaciones: input.observaciones?.trim() || null,
      evaluacion: input.evaluacion || null,
      equipo_id: input.equipo_id || null,
      scout_id: input.scout_id || null,
    })
    .select('id')
    .single()

  if (error) {
    return formatResult(false, `Error al crear ficha: ${error.message}`)
  }

  revalidatePath('/admin/operaciones/scouting')
  return formatResult(true, 'Ficha de scouting creada.', data)
}

// --- EDITAR FICHA ---

export interface EditarScoutingInput {
  nombre?: string
  apellido?: string
  fecha_nacimiento?: string | null
  posicion?: string | null
  club_actual?: string | null
  contacto?: string | null
  estado?: string
  observaciones?: string | null
  evaluacion?: number | null
  equipo_id?: string | null
  scout_id?: string | null
}

export async function editarScoutingFicha(id: string, input: EditarScoutingInput) {
  if (!id) {
    return formatResult(false, 'ID de ficha requerido.')
  }

  if (input.estado && !ESTADOS_VALIDOS.includes(input.estado as (typeof ESTADOS_VALIDOS)[number])) {
    return formatResult(false, 'Estado inválido.')
  }

  if (input.evaluacion !== undefined && input.evaluacion !== null && (input.evaluacion < 1 || input.evaluacion > 5)) {
    return formatResult(false, 'La evaluación debe ser entre 1 y 5.')
  }

  const supabase = await createClient()

  const clean: Record<string, unknown> = {}

  if (input.nombre !== undefined) clean.nombre = input.nombre.trim()
  if (input.apellido !== undefined) clean.apellido = input.apellido.trim()
  if (input.fecha_nacimiento !== undefined) clean.fecha_nacimiento = input.fecha_nacimiento || null
  if (input.posicion !== undefined) clean.posicion = input.posicion?.trim() || null
  if (input.club_actual !== undefined) clean.club_actual = input.club_actual?.trim() || null
  if (input.contacto !== undefined) clean.contacto = input.contacto?.trim() || null
  if (input.estado !== undefined) clean.estado = input.estado
  if (input.observaciones !== undefined) clean.observaciones = input.observaciones?.trim() || null
  if (input.evaluacion !== undefined) clean.evaluacion = input.evaluacion
  if (input.equipo_id !== undefined) clean.equipo_id = input.equipo_id || null
  if (input.scout_id !== undefined) clean.scout_id = input.scout_id || null

  if (Object.keys(clean).length === 0) {
    return formatResult(false, 'No hay cambios para guardar.')
  }

  const { error } = await supabase
    .from('scouting_fichas')
    .update(clean)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al editar ficha: ${error.message}`)
  }

  revalidatePath('/admin/operaciones/scouting')
  revalidatePath(`/admin/operaciones/scouting/${id}`)
  return formatResult(true, 'Ficha actualizada.')
}

// --- ELIMINAR FICHA ---

export async function eliminarScoutingFicha(id: string) {
  if (!id) {
    return formatResult(false, 'ID de ficha requerido.')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('scouting_fichas')
    .delete()
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al eliminar ficha: ${error.message}`)
  }

  revalidatePath('/admin/operaciones/scouting')
  return formatResult(true, 'Ficha eliminada.')
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface DireccionInput {
  calle?: string
  numero?: string
  ciudad?: string
  provincia?: string
  codigo_postal?: string
  pais?: string
}

interface CrearEntidadInput {
  tipo: string
  nombre: string
  telefono?: string
  email?: string
  sitio_web?: string
  cuit?: string
  razon_social?: string
  direccion?: DireccionInput
  entidad_padre_id?: string
}

export async function crearEntidad(input: CrearEntidadInput) {
  const supabase = await createClient()

  const slug = slugify(input.nombre)

  const { data, error } = await supabase
    .from('entidades')
    .insert({
      tenant_id: TENANT_ID,
      tipo: input.tipo,
      nombre: input.nombre.trim(),
      slug,
      telefono: input.telefono?.trim() || null,
      email: input.email?.trim() || null,
      sitio_web: input.sitio_web?.trim() || null,
      cuit: input.cuit?.trim() || null,
      razon_social: input.razon_social?.trim() || null,
      direccion: input.direccion ?? null,
      entidad_padre_id: input.entidad_padre_id || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505' && error.message.includes('slug')) {
      return formatResult(false, 'Ya existe una entidad con ese nombre.')
    }
    return formatResult(false, error.message)
  }

  revalidatePath('/admin/externos')
  return formatResult(true, 'Entidad creada', data)
}

interface EditarEntidadInput {
  tipo?: string
  nombre?: string
  telefono?: string
  email?: string
  sitio_web?: string
  cuit?: string
  razon_social?: string
  direccion?: DireccionInput
  entidad_padre_id?: string | null
}

export async function editarEntidad(id: string, input: EditarEntidadInput) {
  const supabase = await createClient()

  const clean: Record<string, unknown> = {}
  if (input.tipo) clean.tipo = input.tipo
  if (input.nombre) {
    clean.nombre = input.nombre.trim()
    clean.slug = slugify(input.nombre)
  }
  if (input.telefono !== undefined) clean.telefono = input.telefono.trim() || null
  if (input.email !== undefined) clean.email = input.email.trim() || null
  if (input.sitio_web !== undefined) clean.sitio_web = input.sitio_web.trim() || null
  if (input.cuit !== undefined) clean.cuit = input.cuit.trim() || null
  if (input.razon_social !== undefined) clean.razon_social = input.razon_social.trim() || null
  if (input.direccion !== undefined) clean.direccion = input.direccion
  if (input.entidad_padre_id !== undefined) clean.entidad_padre_id = input.entidad_padre_id || null

  const { error } = await supabase
    .from('entidades')
    .update(clean)
    .eq('id', id)

  if (error) {
    if (error.code === '23505' && error.message.includes('slug')) {
      return formatResult(false, 'Ya existe una entidad con ese nombre.')
    }
    return formatResult(false, error.message)
  }

  revalidatePath('/admin/externos')
  revalidatePath(`/admin/externos/${id}`)
  return formatResult(true, 'Entidad actualizada')
}

export async function toggleActivoEntidad(id: string) {
  const supabase = await createClient()

  const { data: entidad, error: fetchError } = await supabase
    .from('entidades')
    .select('activo')
    .eq('id', id)
    .single()

  if (fetchError) return formatResult(false, fetchError.message)

  const { error } = await supabase
    .from('entidades')
    .update({ activo: !entidad.activo })
    .eq('id', id)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/externos')
  return formatResult(true, entidad.activo ? 'Entidad desactivada' : 'Entidad activada')
}

interface AsignarRepresentanteInput {
  entidad_id: string
  persona_id: string
  rol: string
  rol_custom?: string
}

export async function asignarRepresentante(input: AsignarRepresentanteInput) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('entidades_representantes')
    .insert({
      tenant_id: TENANT_ID,
      entidad_id: input.entidad_id,
      persona_id: input.persona_id,
      rol: input.rol,
      rol_custom: input.rol === 'otro' ? (input.rol_custom?.trim() || null) : null,
    })

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/externos/${input.entidad_id}`)
  return formatResult(true, 'Representante asignado')
}

export async function quitarRepresentante(id: string, entidadId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('entidades_representantes')
    .update({ activo: false, fecha_fin: new Date().toISOString().split('T')[0] })
    .eq('id', id)

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/externos/${entidadId}`)
  return formatResult(true, 'Representante removido')
}

export async function eliminarEntidad(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('entidades')
    .update({ deleted_at: new Date().toISOString(), activo: false })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/externos')
  return formatResult(true, 'Entidad eliminada')
}

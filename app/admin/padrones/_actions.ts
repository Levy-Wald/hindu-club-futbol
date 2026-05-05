'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

export interface CrearPadronInput {
  nombre: string
  slug: string
  tipo: string
}

export async function crearPadron(input: CrearPadronInput) {
  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }
  if (!input.slug.trim()) {
    return formatResult(false, 'El slug es obligatorio')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('padrones')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre.trim(),
      slug: input.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      tipo: input.tipo || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return formatResult(false, 'Ya existe un padrón con ese slug.')
    }
    return formatResult(false, error.message)
  }

  revalidatePath('/admin/padrones')
  return formatResult(true, 'Padrón creado', data)
}

export interface EditarPadronInput {
  nombre: string
  tipo: string
  activo: boolean
}

export async function editarPadron(id: string, input: EditarPadronInput) {
  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('padrones')
    .update({
      nombre: input.nombre.trim(),
      tipo: input.tipo || null,
      activo: input.activo,
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/padrones')
  revalidatePath(`/admin/padrones/${id}`)
  return formatResult(true, 'Padrón actualizado')
}

export async function toggleActivoPadron(id: string) {
  const supabase = await createClient()

  // Fetch current state
  const { data: current, error: fetchError } = await supabase
    .from('padrones')
    .select('activo')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError) return formatResult(false, fetchError.message)

  const { error } = await supabase
    .from('padrones')
    .update({ activo: !current.activo })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/padrones')
  revalidatePath(`/admin/padrones/${id}`)
  return formatResult(true, current.activo ? 'Padrón desactivado' : 'Padrón activado')
}

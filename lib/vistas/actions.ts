'use server'

import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

export interface Vista {
  id: string
  nombre: string
  modulo: string
  columnas: string[]
  filtros: Record<string, unknown>
  es_default: boolean
}

export async function fetchVistas(modulo: string): Promise<Vista[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_vistas')
    .select('id, nombre, modulo, columnas, filtros, es_default')
    .eq('user_id', user.id)
    .eq('modulo', modulo)
    .order('nombre')

  if (error) return []
  return (data ?? []) as Vista[]
}

export async function guardarVista(input: {
  modulo: string
  nombre: string
  columnas: string[]
  filtros?: Record<string, unknown>
}): Promise<{ ok: boolean; message: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'No autenticado' }

  const { data, error } = await supabase
    .from('user_vistas')
    .insert({
      tenant_id: TENANT_ID,
      user_id: user.id,
      modulo: input.modulo,
      nombre: input.nombre.trim(),
      columnas: input.columnas,
      filtros: input.filtros ?? {},
    })
    .select('id')
    .single()

  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Vista guardada', id: data.id }
}

export async function eliminarVista(id: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('user_vistas').delete().eq('id', id)
  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Vista eliminada' }
}

export async function setVistaDefault(id: string, modulo: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'No autenticado' }

  // Remove current default
  await supabase
    .from('user_vistas')
    .update({ es_default: false })
    .eq('user_id', user.id)
    .eq('modulo', modulo)
    .eq('es_default', true)

  // Set new default
  const { error } = await supabase
    .from('user_vistas')
    .update({ es_default: true })
    .eq('id', id)

  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Vista por defecto actualizada' }
}

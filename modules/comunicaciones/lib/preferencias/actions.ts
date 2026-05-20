'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PreferenciasPersona } from './tipos'
import { PREFERENCIAS_DEFAULT } from './defaults'
import { TENANT_ID } from '@/lib/tenant'


type ActionResult = { ok: boolean; message: string }

async function verificarPermiso(): Promise<{ ok: true; personaId: string } | { ok: false; message: string }> {
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

  if (!tienePermiso) return { ok: false, message: 'Sin permisos' }
  return { ok: true, personaId: persona.id }
}

export async function obtenerPreferenciasPersona(personaId: string): Promise<PreferenciasPersona | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('personas_preferencias_comunicacion')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .maybeSingle()

  return data as PreferenciasPersona | null
}

export async function guardarPreferenciasPersona(
  personaId: string,
  datos: Partial<Omit<PreferenciasPersona, 'id' | 'tenant_id' | 'persona_id'>>
): Promise<ActionResult> {
  const auth = await verificarPermiso()
  if (!auth.ok) return auth

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('personas_preferencias_comunicacion')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('personas_preferencias_comunicacion')
      .update(datos)
      .eq('id', existing.id)
    if (error) return { ok: false, message: error.message }
  } else {
    const { error } = await supabase
      .from('personas_preferencias_comunicacion')
      .insert({ tenant_id: TENANT_ID, persona_id: personaId, ...datos })
    if (error) return { ok: false, message: error.message }
  }

  revalidatePath(`/admin/personas/${personaId}`)
  return { ok: true, message: 'Preferencias guardadas' }
}

export async function restablecerDefaultsPreferenciasPersona(personaId: string): Promise<ActionResult> {
  const auth = await verificarPermiso()
  if (!auth.ok) return auth

  const supabase = await createClient()

  const { error } = await supabase
    .from('personas_preferencias_comunicacion')
    .delete()
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)

  if (error) return { ok: false, message: error.message }

  revalidatePath(`/admin/personas/${personaId}`)
  return { ok: true, message: 'Preferencias restablecidas a defaults' }
}


'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCapability } from '@/lib/permissions/capabilities'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function asignarAtributoUsuario(personaId: string, atributoSlug: string) {
  const auth = await requireCapability('setup.users')
  if (!auth.ok) return { ok: false, error: auth.error }

  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('personas_atributos')
    .insert({
      tenant_id: TENANT_ID,
      persona_id: personaId,
      atributo_slug: atributoSlug,
      activo: true,
    })

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Este atributo ya está asignado' }
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/configuracion/usuarios')
  return { ok: true }
}

export async function removerAtributoUsuario(personaId: string, atributoSlug: string) {
  const auth = await requireCapability('setup.users')
  if (!auth.ok) return { ok: false, error: auth.error }

  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('personas_atributos')
    .update({ activo: false })
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .eq('atributo_slug', atributoSlug)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/configuracion/usuarios')
  return { ok: true }
}

export async function fetchCapabilitiesPersona(personaId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .rpc('get_user_capabilities', { p_persona_id: personaId })
  if (error) return []
  return data ?? []
}

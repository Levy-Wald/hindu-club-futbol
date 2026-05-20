'use server'

import { createClient } from '@/lib/supabase/server'
import { generateApiKey, hashApiKey } from '@/lib/api/auth'
import { revalidatePath } from 'next/cache'
import { TENANT_ID } from '@/lib/tenant'


export async function crearApiKey(formData: FormData) {
  const nombre = formData.get('nombre') as string
  const descripcion = formData.get('descripcion') as string | null
  const scopesRaw = formData.get('scopes') as string
  const rateLimitRaw = formData.get('rate_limit') as string | null
  const expiraAt = formData.get('expira_at') as string | null

  if (!nombre || !scopesRaw) {
    return { error: 'Nombre y scopes son requeridos' }
  }

  const scopes = scopesRaw.split(',').map((s) => s.trim()).filter(Boolean)
  const rateLimit = rateLimitRaw ? parseInt(rateLimitRaw) : 60

  const { key, prefix } = generateApiKey()
  const keyHash = await hashApiKey(key)

  const supabase = await createClient()

  // Get persona_id for created_by
  const { data: { user } } = await supabase.auth.getUser()
  let createdBy: string | null = null
  if (user) {
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    createdBy = persona?.id ?? null
  }

  const { error } = await supabase.from('api_keys').insert({
    tenant_id: TENANT_ID,
    nombre,
    descripcion: descripcion || null,
    key_hash: keyHash,
    key_prefix: prefix,
    scopes,
    rate_limit_por_minuto: rateLimit,
    expira_at: expiraAt || null,
    created_by: createdBy,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/integraciones')

  // Return the full key — this is the ONLY time it's shown
  return { success: true, key }
}

export async function toggleApiKey(id: string, activa: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('api_keys')
    .update({ activa })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { error: error.message }

  revalidatePath('/admin/integraciones')
  return { success: true }
}

export async function eliminarApiKey(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('api_keys')
    .update({ deleted_at: new Date().toISOString(), activa: false })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return { error: error.message }

  revalidatePath('/admin/integraciones')
  return { success: true }
}

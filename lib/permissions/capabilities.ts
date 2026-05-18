import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export type Capability = string

/**
 * Resolves the persona_id of the currently authenticated user.
 */
export async function getCurrentPersonaId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .maybeSingle()
  return persona?.id ?? null
}

export async function getUserCapabilities(personaId: string): Promise<Capability[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .rpc('get_user_capabilities', { p_persona_id: personaId })
  if (error) {
    console.error('getUserCapabilities error:', error)
    return []
  }
  return data ?? []
}

export async function hasCapability(personaId: string, capability: Capability): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .rpc('has_capability', { p_persona_id: personaId, p_capability: capability })
  return !error && data === true
}

export async function hasAnyCapability(personaId: string, capabilities: Capability[]): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .rpc('has_any_capability', { p_persona_id: personaId, p_capabilities: capabilities })
  return !error && data === true
}

/**
 * Checks the current user has the required capability.
 * Returns { ok: true, personaId } or { ok: false, error }.
 */
export async function requireCapability(capability: Capability): Promise<
  { ok: true; personaId: string } | { ok: false; error: string }
> {
  const personaId = await getCurrentPersonaId()
  if (!personaId) return { ok: false, error: 'No autenticado' }
  const allowed = await hasCapability(personaId, capability)
  if (!allowed) return { ok: false, error: `Sin permiso: ${capability}` }
  return { ok: true, personaId }
}

/**
 * Checks the current user has ALL required capabilities.
 */
export async function requireAllCapabilities(...capabilities: Capability[]): Promise<
  { ok: true; personaId: string } | { ok: false; error: string }
> {
  const personaId = await getCurrentPersonaId()
  if (!personaId) return { ok: false, error: 'No autenticado' }
  for (const cap of capabilities) {
    const allowed = await hasCapability(personaId, cap)
    if (!allowed) return { ok: false, error: `Sin permiso: ${cap}` }
  }
  return { ok: true, personaId }
}

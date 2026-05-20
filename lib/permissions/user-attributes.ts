import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


export async function getUserAttributes(personaId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', personaId)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
  return (data ?? []).map((d: { atributo_slug: string }) => d.atributo_slug)
}

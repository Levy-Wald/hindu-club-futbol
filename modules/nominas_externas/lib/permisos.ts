import { createServiceRoleClient } from '@/lib/supabase/service-role'

// AP-001 ✓ verificado: personas_atributos NO tiene deleted_at
export async function canAdministrarNominas(persona_id: string): Promise<boolean> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona_id)
    .in('atributo_slug', ['nominas.admin', 'tenant.admin'])
    .eq('activo', true)
  return Boolean(data && data.length > 0)
}

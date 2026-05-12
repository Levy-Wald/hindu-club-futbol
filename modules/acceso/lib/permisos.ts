'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Puede usar /admin/acceso si tiene atributo:
 * - acceso.guardia, OR
 * - tenant.admin
 *
 * AP-001: personas_atributos NO tiene deleted_at — no filtrar por ella.
 */
export async function canUsarPantallaAcceso(
  persona_id: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona_id)
    .in('atributo_slug', ['acceso.guardia', 'tenant.admin'])
    .eq('activo', true)

  return Boolean(data && data.length > 0)
}

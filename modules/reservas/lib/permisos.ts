'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * D56: tenant.admin O atributo reservas.gestor.
 */
export async function canGestionarReservas(
  persona_id: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { data: atrs } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona_id)
    .in('atributo_slug', ['tenant.admin', 'reservas.gestor'])
    .eq('activo', true)

  return (atrs && atrs.length > 0) ?? false
}

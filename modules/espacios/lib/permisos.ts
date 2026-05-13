'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function canAdminEspacios(personaId: string): Promise<boolean> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('personas_atributos')
    .select('id')
    .eq('persona_id', personaId)
    .in('atributo_slug', ['tenant.admin', 'configuracion.admin', 'espacios.admin'])
    .is('fecha_fin', null)
    .limit(1)
  return (data?.length ?? 0) > 0
}

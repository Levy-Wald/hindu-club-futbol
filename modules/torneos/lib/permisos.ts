'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function canAdministrarTorneos(
  persona_id: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { data: atrs } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona_id)
    .in('atributo_slug', ['tenant.admin', 'torneos.admin'])
    .eq('activo', true)

  return (atrs && atrs.length > 0) ?? false
}

export async function canCargarResultados(
  persona_id: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { data: atrs } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona_id)
    .in('atributo_slug', ['tenant.admin', 'torneos.admin', 'torneos.cargador', 'torneos.cargador_resultado'])
    .eq('activo', true)

  return (atrs && atrs.length > 0) ?? false
}

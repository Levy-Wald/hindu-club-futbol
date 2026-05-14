'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function canAdminPim(personaId: string): Promise<boolean> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('personas_atributos')
    .select('id')
    .eq('persona_id', personaId)
    .in('atributo_slug', ['tenant.admin', 'pim.admin'])
    .is('fecha_fin', null)
    .limit(1)
  return (data?.length ?? 0) > 0
}

export async function canEditPim(personaId: string): Promise<boolean> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('personas_atributos')
    .select('id')
    .eq('persona_id', personaId)
    .in('atributo_slug', ['tenant.admin', 'pim.admin', 'pim.editor'])
    .is('fecha_fin', null)
    .limit(1)
  return (data?.length ?? 0) > 0
}

export async function canViewPim(personaId: string): Promise<boolean> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('personas_atributos')
    .select('id')
    .eq('persona_id', personaId)
    .in('atributo_slug', ['tenant.admin', 'pim.admin', 'pim.editor', 'pim.viewer'])
    .is('fecha_fin', null)
    .limit(1)
  return (data?.length ?? 0) > 0
}

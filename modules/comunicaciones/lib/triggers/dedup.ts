import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Filtra personas que ya fueron notificadas en los últimos 7 días
 * para el mismo origen_modulo_slug + canal.
 * Usa el índice idx_com_envios_dedup_origen.
 */
export async function filtrarDuplicados(
  supabase: SupabaseClient,
  tenantId: string,
  personaIds: string[],
  origenModuloSlug: string,
  canal: 'email' | 'inapp'
): Promise<{ permitidos: string[]; descartados: number }> {
  if (personaIds.length === 0) {
    return { permitidos: [], descartados: 0 }
  }

  const hace7dias = new Date()
  hace7dias.setDate(hace7dias.getDate() - 7)

  const { data } = await supabase
    .from('com_envios')
    .select('persona_id')
    .eq('tenant_id', tenantId)
    .eq('origen_modulo_slug', origenModuloSlug)
    .eq('canal', canal)
    .in('persona_id', personaIds)
    .gte('created_at', hace7dias.toISOString())

  const yaNotificados = new Set((data ?? []).map(r => r.persona_id))
  const permitidos = personaIds.filter(id => !yaNotificados.has(id))

  return {
    permitidos,
    descartados: personaIds.length - permitidos.length,
  }
}

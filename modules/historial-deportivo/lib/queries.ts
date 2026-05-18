import { createClient } from '@/lib/supabase/server'
import type { TrayectoriaClub, Logro } from './tipos'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function fetchTrayectoriaPorPersona(personaId: string): Promise<TrayectoriaClub[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('persona_trayectoria_clubes')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .is('deleted_at', null)
    .order('fecha_desde', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data ?? []
}

export async function fetchLogrosPorPersona(personaId: string): Promise<Logro[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('persona_logros')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .is('deleted_at', null)
    .order('anio', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data ?? []
}

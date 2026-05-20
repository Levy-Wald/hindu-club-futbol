import { createClient } from '@/lib/supabase/server'
import type { TrayectoriaClub, Logro } from './tipos'
import { TENANT_ID } from '@/lib/tenant'


export async function fetchDistinctClubNombres(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('persona_trayectoria_clubes')
    .select('club_nombre')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .not('club_nombre', 'is', null)
    .order('club_nombre')
  const unique = (data ?? []).map((d: any) => String(d.club_nombre))
  return [...new Set(unique)] as string[]
}

export async function fetchDistinctTorneoNombres(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('persona_logros')
    .select('torneo_nombre')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .not('torneo_nombre', 'is', null)
    .order('torneo_nombre')
  const unique = (data ?? []).map((d: any) => String(d.torneo_nombre))
  return [...new Set(unique)] as string[]
}

export async function fetchDistinctEquipoNombresLogros(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('persona_logros')
    .select('equipo_nombre')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .not('equipo_nombre', 'is', null)
    .order('equipo_nombre')
  const unique = (data ?? []).map((d: any) => String(d.equipo_nombre))
  return [...new Set(unique)] as string[]
}

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

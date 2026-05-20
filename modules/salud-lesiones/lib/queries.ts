import { createClient } from '@/lib/supabase/server'
import type { TipoLesion, LesionadoActivo } from './tipos'
import { TENANT_ID } from '@/lib/tenant'


export async function fetchTiposLesion(): Promise<TipoLesion[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('tipos_lesion')
    .select('*')
    .eq('activo', true)
    .order('nombre')
  return data ?? []
}

export async function fetchLesionesPorPersona(personaId: string) {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('personas_lesiones')
    .select('*, tipos_lesion:tipo_lesion_slug(nombre), equipos:equipo_id(nombre)')
    .eq('tenant_id', TENANT_ID)
    .eq('persona_id', personaId)
    .is('deleted_at', null)
    .order('fecha_inicio', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchLesionadosActivosPorEquipo(equipoId: string): Promise<LesionadoActivo[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('v_personas_lesionadas_activas')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('equipo_id', equipoId)
  return data ?? []
}

export async function fetchLesionadosActivosTenant(): Promise<LesionadoActivo[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('v_personas_lesionadas_activas')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('fecha_inicio', { ascending: false })
  return data ?? []
}

export async function fetchPersonaIdsLesionados(personaIds: string[]): Promise<Set<string>> {
  if (personaIds.length === 0) return new Set()
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('personas_lesiones')
    .select('persona_id')
    .eq('tenant_id', TENANT_ID)
    .in('persona_id', personaIds)
    .is('deleted_at', null)
    .eq('recuperada', false)
    .eq('activo', true)
  return new Set((data ?? []).map((r: { persona_id: string }) => r.persona_id))
}

export async function fetchEquipos() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('equipos')
    .select('id, nombre')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')
  return data ?? []
}

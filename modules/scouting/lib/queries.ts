import { createClient } from '@/lib/supabase/server'
import type { Evaluacion } from './tipos'
import { TENANT_ID } from '@/lib/tenant'


export async function fetchEvaluacionesPorFicha(fichaId: string): Promise<Evaluacion[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('scouting_evaluaciones')
    .select('*, scout:personas!scout_persona_id(nombre, apellido)')
    .eq('tenant_id', TENANT_ID)
    .eq('ficha_id', fichaId)
    .is('deleted_at', null)
    .order('fecha_evaluacion', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r: any) => {
    const scout = r.scout as { nombre: string; apellido: string } | null
    return {
      ...r,
      scout: undefined,
      scout_nombre: scout ? `${scout.nombre} ${scout.apellido}` : null,
    }
  })
}

export async function fetchDimensiones() {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('scouting_dimensiones')
    .select('*')
    .eq('activo', true)
    .order('orden')
  return data ?? []
}

import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export interface StatsEquipo {
  equipo_id: string
  equipo_nombre: string
  disciplina_slug: string
  convocados_activos: number
  lesionados_activos: number
  asistencia_promedio_30d: number
  torneos_inscriptos_activos: number
}

export interface PerformanceJugador {
  persona_id: string
  nombre: string
  apellido: string
  equipo_id: string | null
  equipo_nombre: string | null
  partidos_90d: number
  asistencia_entrenamientos_pct_90d: number
  lesionado_activo: boolean
}

export interface ComparativaEquipo extends StatsEquipo {
  ranking_asistencia: number
  ratio_lesionados: number
}

export async function fetchStatsEquipos(): Promise<StatsEquipo[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('v_stats_equipo')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('equipo_nombre')
  if (error) throw error
  return data ?? []
}

export async function fetchPerformanceJugadores(equipoId?: string): Promise<PerformanceJugador[]> {
  const supabase = await createClient()
  let query = (supabase as any)
    .from('v_performance_jugadores')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('asistencia_entrenamientos_pct_90d', { ascending: false })
    .limit(100)

  if (equipoId) query = query.eq('equipo_id', equipoId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchComparativaEquipos(): Promise<ComparativaEquipo[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('v_comparativa_equipos')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('ranking_asistencia')
  if (error) throw error
  return data ?? []
}

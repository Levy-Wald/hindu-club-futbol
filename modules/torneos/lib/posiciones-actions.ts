'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'

export type FilaPosicion = {
  posicion: number
  equipo_id_propio: string | null
  equipo_externo_nombre: string | null
  equipo_display: string
  partidos_jugados: number
  ganados: number
  empatados: number
  perdidos: number
  goles_a_favor: number
  goles_en_contra: number
  diferencia_goles: number
  puntos: number
}

export async function obtenerTablaPosicionesAction(input: {
  torneo_id: string
  categoria_id?: string
}): Promise<{ ok: true; tabla: FilaPosicion[] } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  const sr = createServiceRoleClient()

  // Verify torneo belongs to tenant
  const { data: persona } = await supabase
    .from('personas')
    .select('tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  const tenant_id = persona?.tenant_id ?? TENANT_ID

  const { data: torneo } = await sr
    .from('torneos')
    .select('id')
    .eq('id', input.torneo_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!torneo) return { ok: false, error: 'Torneo no encontrado' }

  const { data, error } = await sr.rpc('calcular_tabla_posiciones', {
    p_torneo_id: input.torneo_id,
    p_categoria_id: input.categoria_id ?? null,
  })

  if (error) return { ok: false, error: error.message }

  return { ok: true, tabla: (data ?? []) as FilaPosicion[] }
}

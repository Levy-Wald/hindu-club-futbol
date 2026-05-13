import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function recalcularStatsPartido(
  partido_evento_id: string,
  tenant_id: string
): Promise<{ ok: boolean; stats_creadas: number; error?: string }> {
  const supabase = createServiceRoleClient()

  const { data: eventos } = await supabase
    .from('torneo_partidos_eventos')
    .select('*')
    .eq('partido_evento_id', partido_evento_id)
    .eq('tenant_id', tenant_id)

  if (!eventos) return { ok: false, stats_creadas: 0, error: 'No se pudieron leer eventos' }

  const statsPorPersona = new Map<
    string,
    {
      persona_id: string
      goles: number
      asistencias: number
      tarjetas_amarillas: number
      tarjetas_rojas: number
      minutos_jugados: number
    }
  >()

  function getOrCreate(pid: string) {
    if (!statsPorPersona.has(pid)) {
      statsPorPersona.set(pid, {
        persona_id: pid,
        goles: 0,
        asistencias: 0,
        tarjetas_amarillas: 0,
        tarjetas_rojas: 0,
        minutos_jugados: 0,
      })
    }
    return statsPorPersona.get(pid)!
  }

  for (const e of eventos) {
    if (!e.persona_id) continue
    const s = getOrCreate(e.persona_id)

    switch (e.tipo) {
      case 'gol':
        s.goles++
        // If there's an assist provider
        if (e.persona_relacionada_id) {
          getOrCreate(e.persona_relacionada_id).asistencias++
        }
        break
      case 'autogol':
        // autogol counts against the player, but no stat increment for own goals
        break
      case 'tarjeta_amarilla':
        s.tarjetas_amarillas++
        break
      case 'tarjeta_roja':
        s.tarjetas_rojas++
        break
      case 'cambio':
        // persona_id = enters, persona_relacionada_id = leaves
        // No stat change here — minutos_jugados managed separately
        break
    }
  }

  // S2 mitigation: DELETE + INSERT (idempotent)
  await supabase
    .from('partido_stats_jugador')
    .delete()
    .eq('partido_evento_id', partido_evento_id)

  if (statsPorPersona.size > 0) {
    const inserts = Array.from(statsPorPersona.values()).map((s) => ({
      ...s,
      tenant_id,
      partido_evento_id,
    }))

    const { error } = await supabase.from('partido_stats_jugador').insert(inserts)

    if (error) return { ok: false, stats_creadas: 0, error: error.message }
  }

  return { ok: true, stats_creadas: statsPorPersona.size }
}

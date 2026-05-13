'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { canCargarResultados } from './permisos'
import { recalcularStatsPartido } from './stats-calculator'
import type { TipoEventoPartido } from './resultado-types'

async function getPersonaConPermiso() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return null

  const puede = await canCargarResultados(persona.id)
  if (!puede) return null

  return { ...persona, tenant_id: persona.tenant_id ?? TENANT_ID }
}

export async function obtenerDatosPartidoAction(evento_id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'No autenticado' }

  const sr = createServiceRoleClient()

  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return { ok: false as const, error: 'Persona no encontrada' }
  const tenant_id = persona.tenant_id ?? TENANT_ID

  // Get partido_detalle
  const { data: partido } = await sr
    .from('partidos_detalle')
    .select('*')
    .eq('evento_id', evento_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!partido) return { ok: false as const, error: 'Partido no encontrado' }

  // Get evento
  const { data: evento } = await sr
    .from('eventos')
    .select('id, titulo, fecha, hora_inicio, equipo_id, estado')
    .eq('id', evento_id)
    .single()

  if (!evento) return { ok: false as const, error: 'Evento no encontrado' }

  // Get plantel propio (personas del equipo)
  let plantel: { persona_id: string; nombre: string; apellido: string; dorsal: number | null }[] =
    []
  if (evento.equipo_id) {
    const { data: miembros } = await sr
      .from('personas_equipos')
      .select('persona_id, dorsal')
      .eq('equipo_id', evento.equipo_id)
      .eq('activo', true)

    if (miembros && miembros.length > 0) {
      const personaIds = miembros.map((m) => m.persona_id)
      const { data: personas } = await sr
        .from('personas')
        .select('id, nombre, apellido')
        .in('id', personaIds)

      plantel = (personas ?? []).map((p) => {
        const miembro = miembros.find((m) => m.persona_id === p.id)
        return {
          persona_id: p.id,
          nombre: p.nombre ?? '',
          apellido: p.apellido ?? '',
          dorsal: miembro?.dorsal ?? null,
        }
      })

      plantel.sort((a, b) => {
        if (a.dorsal !== null && b.dorsal !== null) return a.dorsal - b.dorsal
        if (a.dorsal !== null) return -1
        if (b.dorsal !== null) return 1
        return (a.apellido ?? '').localeCompare(b.apellido ?? '')
      })
    }
  }

  // Get existing eventos del partido
  const { data: eventosPartido } = await sr
    .from('torneo_partidos_eventos')
    .select('*')
    .eq('partido_evento_id', evento_id)
    .eq('tenant_id', tenant_id)
    .order('minuto')

  // Get existing stats
  const { data: stats } = await sr
    .from('partido_stats_jugador')
    .select('*')
    .eq('partido_evento_id', evento_id)

  return {
    ok: true as const,
    partido,
    evento,
    plantel,
    eventosPartido: eventosPartido ?? [],
    stats: stats ?? [],
    tenant_id,
  }
}

export async function cargarEventoAction(input: {
  partido_evento_id: string
  minuto: number
  tipo: TipoEventoPartido
  persona_id?: string
  equipo_id?: string
  equipo_externo_nombre?: string
  persona_relacionada_id?: string
  descripcion?: string
}) {
  const persona = await getPersonaConPermiso()
  if (!persona) return { ok: false as const, error: 'Sin permiso' }

  const sr = createServiceRoleClient()

  const { data, error } = await sr
    .from('torneo_partidos_eventos')
    .insert({
      tenant_id: persona.tenant_id,
      partido_evento_id: input.partido_evento_id,
      minuto: input.minuto,
      tipo: input.tipo,
      persona_id: input.persona_id ?? null,
      equipo_id: input.equipo_id ?? null,
      equipo_externo_nombre: input.equipo_externo_nombre ?? null,
      persona_relacionada_id: input.persona_relacionada_id ?? null,
      descripcion: input.descripcion ?? null,
      created_by_persona_id: persona.id,
    })
    .select('id')
    .single()

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, id: data.id }
}

export async function eliminarEventoAction(evento_id: string) {
  const persona = await getPersonaConPermiso()
  if (!persona) return { ok: false as const, error: 'Sin permiso' }

  const sr = createServiceRoleClient()

  const { error } = await sr
    .from('torneo_partidos_eventos')
    .delete()
    .eq('id', evento_id)
    .eq('tenant_id', persona.tenant_id)

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}

export async function confirmarResultadoAction(input: {
  partido_evento_id: string
  marcador_local: number
  marcador_visitante: number
}) {
  const persona = await getPersonaConPermiso()
  if (!persona) return { ok: false as const, error: 'Sin permiso' }

  const sr = createServiceRoleClient()

  // Update partidos_detalle with final score + mark closed
  const { error: errPartido } = await sr
    .from('partidos_detalle')
    .update({
      marcador_local: input.marcador_local,
      marcador_visitante: input.marcador_visitante,
      convocatoria_cerrada: true,
    })
    .eq('evento_id', input.partido_evento_id)
    .eq('tenant_id', persona.tenant_id)

  if (errPartido) return { ok: false as const, error: errPartido.message }

  // Mark evento as completado
  await sr
    .from('eventos')
    .update({ estado: 'completado' })
    .eq('id', input.partido_evento_id)

  // Recalculate stats
  const statsResult = await recalcularStatsPartido(input.partido_evento_id, persona.tenant_id)

  return {
    ok: true as const,
    stats_creadas: statsResult.stats_creadas,
  }
}

'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { AmistosoCompleto, LogisticaAmistoso } from './types'

const LOGISTICA_DEFAULT: LogisticaAmistoso = {
  color_camiseta_home: null,
  color_camiseta_away: null,
  contacto_rival_nombre: null,
  contacto_rival_telefono: null,
  contacto_rival_email: null,
  club_rival_nombre: null,
  observaciones: null,
}

export async function obtenerAmistoso(
  evento_id: string,
  tenant_id: string
): Promise<AmistosoCompleto | null> {
  const supabase = createServiceRoleClient()

  // AP-003: queries separadas
  const { data: evento } = await supabase
    .from('eventos')
    .select('id, titulo, fecha, hora_inicio, hora_fin, cancha_id, equipo_id, metadata, tipo_evento_slug')
    .eq('id', evento_id)
    .eq('tenant_id', tenant_id)
    .eq('tipo_evento_slug', 'amistoso')
    .eq('activo', true)
    .single()

  if (!evento) return null

  // Hidratar cancha y equipo
  const [canchaRes, equipoRes] = await Promise.all([
    evento.cancha_id
      ? supabase.from('canchas').select('nombre').eq('id', evento.cancha_id).single()
      : Promise.resolve({ data: null }),
    evento.equipo_id
      ? supabase.from('equipos').select('nombre').eq('id', evento.equipo_id).single()
      : Promise.resolve({ data: null }),
  ])

  // Buscar nómina externa asociada
  const { data: nominas } = await supabase
    .from('nominas_externas')
    .select('id, token, estado')
    .eq('evento_id', evento_id)
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })
    .limit(1)

  const nomina = nominas?.[0] ?? null

  const metadata = evento.metadata as Record<string, unknown> | null
  const logistica: LogisticaAmistoso = {
    ...LOGISTICA_DEFAULT,
    ...((metadata?.logistica_amistoso as Partial<LogisticaAmistoso>) ?? {}),
  }

  return {
    evento: {
      id: evento.id,
      titulo: evento.titulo,
      fecha: evento.fecha,
      hora_inicio: evento.hora_inicio,
      hora_fin: evento.hora_fin,
      cancha_id: evento.cancha_id,
      cancha_nombre: canchaRes?.data?.nombre ?? null,
      equipo_id: evento.equipo_id,
      equipo_nombre: equipoRes?.data?.nombre ?? null,
    },
    logistica,
    nomina_externa_id: nomina?.id ?? null,
    nomina_externa_token: nomina?.token ?? null,
    nomina_externa_estado: nomina?.estado ?? null,
  }
}

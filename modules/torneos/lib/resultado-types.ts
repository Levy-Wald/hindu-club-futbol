export type TipoEventoPartido =
  | 'gol'
  | 'asistencia'
  | 'tarjeta_amarilla'
  | 'tarjeta_roja'
  | 'cambio'
  | 'penal_atajado'
  | 'penal_errado'
  | 'autogol'

export type EventoPartido = {
  id: string
  tenant_id: string
  partido_evento_id: string
  minuto: number
  tipo: TipoEventoPartido
  persona_id: string | null
  equipo_id: string | null
  equipo_externo_nombre: string | null
  persona_relacionada_id: string | null
  descripcion: string | null
  metadata: Record<string, unknown>
  created_at: string
  created_by_persona_id: string | null
}

export type StatsJugador = {
  id: string
  partido_evento_id: string
  persona_id: string
  minutos_jugados: number
  goles: number
  asistencias: number
  tarjetas_amarillas: number
  tarjetas_rojas: number
}

export type JugadorPlantel = {
  persona_id: string
  nombre: string
  apellido: string
  dorsal: number | null
  jugo: boolean
  minutos: number
}

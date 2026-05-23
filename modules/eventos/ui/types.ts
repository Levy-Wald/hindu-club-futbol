import type { EstadoInvitacion } from '../lib/types'

export type EventoCalendarioItem = {
  id: string
  titulo: string | null
  fecha_inicio: string
  fecha_fin: string
  hora_inicio: string | null
  hora_fin: string | null
  tipo_evento_slug: string
  equipo_id: string | null
  cancha_id: string | null
  sede_id: string | null
  color: string | null
  estado: string
  es_recurrente: boolean | null
  evento_padre_id: string | null
  serie_uuid: string | null
  modulo_origen: string
  espacio_virtual_tipo: string | null
  etiquetas: string[] | null
  responsables_persona_id: string[]
  periodicidad: string | null
  lugar_encuentro: string | null
  equipo_nombre: string | null
  cancha_nombre: string | null
  // A4.2: invitation state for the current user
  mi_invitacion?: EstadoInvitacion | null
}

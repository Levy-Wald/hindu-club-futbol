export type EventoCalendar = {
  id: string
  titulo: string
  start: Date
  end: Date
  resource: {
    tipo_evento_slug: string
    equipo_id: string | null
    equipo_nombre: string | null
    cancha_id: string | null
    cancha_nombre: string | null
    color: string | null
    es_recurrente: boolean
    evento_padre_id: string | null
    serie_uuid: string | null
    fecha: string
    estado: string
  }
}

export type MoverEventoScope = 'esta_ocurrencia' | 'toda_la_serie'

export type ConflictoOverlap = {
  cancha_id: string
  cancha_nombre: string
  eventos_en_conflicto: Array<{
    id: string
    titulo: string
    hora_inicio: string
    hora_fin: string
  }>
}

export type ResultadoMover =
  | { ok: true; evento_id: string; evento_nuevo_id?: string }
  | { ok: false; error: string; conflicto?: ConflictoOverlap }

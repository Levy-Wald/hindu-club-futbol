export type EventoCalendarioItem = {
  id: string
  titulo: string | null
  fecha: string
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
  equipo_nombre: string | null
  cancha_nombre: string | null
}

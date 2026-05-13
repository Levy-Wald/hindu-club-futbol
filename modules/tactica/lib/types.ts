import type { SlotFormacion } from './formaciones'

export type PosicionAsignada = {
  id: string
  posicion: string // slot.slug
  persona_id: string
  persona_nombre: string
  persona_apellido: string
  es_titular: boolean
  orden: number | null
}

export type EsquemaCompleto = {
  esquema: {
    id: string
    nombre: string
    formacion: string // slug de formación (e.g. '4-4-2')
    notas: string | null
  }
  posiciones: PosicionAsignada[]
}

export type JugadorPlantel = {
  persona_id: string
  nombre: string
  apellido: string
  numero_camiseta: string | null
  posicion_habitual: string | null
}

export type SlotConJugador = SlotFormacion & {
  jugador: JugadorPlantel | null
  posicion_id: string | null // id de esquema_posiciones row
}

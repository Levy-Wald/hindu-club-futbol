import type { FormatoTorneo } from '../types'

export type EquipoEnFixture = {
  id: string // torneo_equipos.id
  nombre: string
  grupo?: string // para grupos_playoff
}

export type PartidoEnFixture = {
  local: EquipoEnFixture
  visitante: EquipoEnFixture
  fecha_numero: number // jornada/ronda (1-indexed)
  fase: string // 'regular', 'ida', 'vuelta', 'grupo_A', 'cuartos', 'semis', 'final', etc.
  orden: number // orden dentro de la fecha
}

export type FixturePreview = {
  formato: FormatoTorneo
  partidos: PartidoEnFixture[]
  total_fechas: number
  total_partidos: number
  warnings: string[]
}

export type FixtureOptions = {
  ida_y_vuelta?: boolean // para liga
  incluir_tercer_puesto?: boolean // para eliminacion/grupos_playoff
  equipos_por_grupo?: number // para grupos_playoff
  num_rondas?: number // para suizo
}

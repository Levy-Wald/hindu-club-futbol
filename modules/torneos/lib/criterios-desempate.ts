export type CriterioDesempate =
  | 'puntos'
  | 'diferencia_goles'
  | 'goles_a_favor'
  | 'enfrentamiento_directo'
  | 'menos_tarjetas'
  | 'sorteo'

export const CRITERIOS_LABELS: Record<CriterioDesempate, string> = {
  puntos: 'Puntos',
  diferencia_goles: 'Diferencia de goles',
  goles_a_favor: 'Goles a favor',
  enfrentamiento_directo: 'Enfrentamiento directo',
  menos_tarjetas: 'Menos tarjetas',
  sorteo: 'Sorteo',
}

export const PRESET_ARGENTINA: CriterioDesempate[] = [
  'puntos',
  'diferencia_goles',
  'goles_a_favor',
  'enfrentamiento_directo',
]

export const PRESET_FIFA: CriterioDesempate[] = [
  'puntos',
  'enfrentamiento_directo',
  'diferencia_goles',
  'goles_a_favor',
]

export const PRESETS = {
  argentina: { label: 'Argentina (FACCMA/AIF)', criterios: PRESET_ARGENTINA },
  fifa: { label: 'FIFA', criterios: PRESET_FIFA },
}

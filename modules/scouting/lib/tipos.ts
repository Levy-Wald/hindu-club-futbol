export const DIMENSIONES = [
  { slug: 'control_balon', nombre: 'Control del balón', categoria: 'tecnica' },
  { slug: 'pase', nombre: 'Pase', categoria: 'tecnica' },
  { slug: 'definicion', nombre: 'Definición', categoria: 'tecnica' },
  { slug: '1vs1', nombre: '1 vs 1', categoria: 'tecnica' },
  { slug: 'velocidad', nombre: 'Velocidad', categoria: 'fisica' },
  { slug: 'resistencia', nombre: 'Resistencia', categoria: 'fisica' },
  { slug: 'fuerza', nombre: 'Fuerza', categoria: 'fisica' },
  { slug: 'mentalidad', nombre: 'Mentalidad', categoria: 'mental' },
  { slug: 'competitividad', nombre: 'Competitividad', categoria: 'mental' },
  { slug: 'vision_juego', nombre: 'Visión de juego', categoria: 'tactica' },
  { slug: 'posicionamiento', nombre: 'Posicionamiento', categoria: 'tactica' },
] as const

export const DIMENSION_COLS = [
  'control_balon', 'pase', 'definicion', 'uno_vs_uno',
  'velocidad', 'resistencia', 'fuerza',
  'mentalidad', 'competitividad',
  'vision_juego', 'posicionamiento',
] as const

export type DimensionCol = (typeof DIMENSION_COLS)[number]

export const RECOMENDACIONES = [
  { value: 'contratar_ya', label: 'Contratar ya' },
  { value: 'seguir_observando', label: 'Seguir observando' },
  { value: 'no_apto', label: 'No apto' },
  { value: 'volver_evaluar', label: 'Volver a evaluar' },
] as const

export interface Evaluacion {
  id: string
  tenant_id: string
  ficha_id: string
  scout_persona_id: string | null
  fecha_evaluacion: string
  contexto: string | null
  control_balon: number | null
  pase: number | null
  definicion: number | null
  uno_vs_uno: number | null
  velocidad: number | null
  resistencia: number | null
  fuerza: number | null
  mentalidad: number | null
  competitividad: number | null
  vision_juego: number | null
  posicionamiento: number | null
  promedio_tecnica: number | null
  promedio_fisica: number | null
  fortalezas: string | null
  debilidades: string | null
  observaciones_generales: string | null
  recomendacion: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  scout_nombre?: string | null
}

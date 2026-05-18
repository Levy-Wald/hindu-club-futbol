import { z } from 'zod'

const score = z.number().int().min(1).max(10).optional()

export const evaluacionInputSchema = z.object({
  ficha_id: z.string().uuid(),
  scout_persona_id: z.string().uuid().optional(),
  fecha_evaluacion: z.string().min(1, 'Indicá la fecha'),
  contexto: z.string().optional(),
  control_balon: score,
  pase: score,
  definicion: score,
  uno_vs_uno: score,
  velocidad: score,
  resistencia: score,
  fuerza: score,
  mentalidad: score,
  competitividad: score,
  vision_juego: score,
  posicionamiento: score,
  fortalezas: z.string().optional(),
  debilidades: z.string().optional(),
  observaciones_generales: z.string().optional(),
  recomendacion: z.enum(['contratar_ya', 'seguir_observando', 'no_apto', 'volver_evaluar']).optional(),
})

export const evaluacionUpdateSchema = evaluacionInputSchema.partial().omit({ ficha_id: true })

export type EvaluacionInput = z.infer<typeof evaluacionInputSchema>
export type EvaluacionUpdate = z.infer<typeof evaluacionUpdateSchema>

import { z } from 'zod'

export const lesionInputSchema = z.object({
  persona_id: z.string().uuid(),
  tipo_lesion_slug: z.string().min(1, 'Seleccioná un tipo de lesión'),
  tipo_lesion: z.string().optional(),
  zona_corporal: z.string().min(1, 'Indicá la zona corporal'),
  gravedad: z.enum(['leve', 'moderada', 'grave', 'muy_grave'], {
    message: 'Seleccioná la gravedad',
  }),
  fecha_inicio: z.string().min(1, 'Indicá la fecha'),
  equipo_id: z.string().uuid().optional().or(z.literal('')),
  restriccion_actividad: z.string().optional(),
  diagnostico_medico: z.string().optional(),
  tratamiento: z.string().optional(),
  descripcion: z.string().optional(),
  notas: z.string().optional(),
})

export const lesionUpdateSchema = z.object({
  tipo_lesion_slug: z.string().optional(),
  tipo_lesion: z.string().optional(),
  zona_corporal: z.string().optional(),
  gravedad: z.enum(['leve', 'moderada', 'grave', 'muy_grave']).optional(),
  fecha_inicio: z.string().optional(),
  fecha_alta_medica: z.string().nullable().optional(),
  equipo_id: z.string().uuid().nullable().optional(),
  restriccion_actividad: z.string().nullable().optional(),
  diagnostico_medico: z.string().nullable().optional(),
  tratamiento: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
})

export type LesionInputSchema = z.infer<typeof lesionInputSchema>
export type LesionUpdateSchema = z.infer<typeof lesionUpdateSchema>

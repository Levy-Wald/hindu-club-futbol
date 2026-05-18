import { z } from 'zod'

export const shapeInputSchema = z.object({
  espacio_id: z.string().uuid().optional().nullable(),
  sede_id: z.string().uuid().optional().nullable(),
  pos_x: z.number().min(0).max(1000),
  pos_y: z.number().min(0).max(1000),
  ancho: z.number().min(10).max(500),
  alto: z.number().min(10).max(500),
  rotacion: z.number().default(0),
  forma: z.enum(['rectangle', 'circle', 'polygon']).default('rectangle'),
  color_fondo: z.string().default('#4F46E5'),
  color_borde: z.string().default('#1E1B4B'),
  texto_label: z.string().optional().nullable(),
  icono: z.string().optional().nullable(),
  capa: z.number().int().default(1),
})

export const shapeUpdateSchema = shapeInputSchema.partial()

export type ShapeInput = z.infer<typeof shapeInputSchema>

export interface DiagramaShape {
  id: string
  tenant_id: string
  espacio_id: string | null
  sede_id: string | null
  pos_x: number
  pos_y: number
  ancho: number
  alto: number
  rotacion: number
  forma: string
  color_fondo: string
  color_borde: string
  texto_label: string | null
  icono: string | null
  capa: number
  espacio_nombre?: string | null
  sede_nombre?: string | null
}

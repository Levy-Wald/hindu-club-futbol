import { z } from 'zod'

export const TIPOS_SUSCRIPCION = [
  { value: 'membresia', label: 'Membresía' },
  { value: 'abono', label: 'Abono' },
  { value: 'clase_individual', label: 'Clase individual' },
  { value: 'cuota_consorcio', label: 'Cuota consorcio' },
  { value: 'otro', label: 'Otro' },
] as const

export const altaMembresiaSchema = z.object({
  persona_id: z.string().uuid('Persona requerida'),
  plan_id: z.string().uuid('Plan requerido'),
  tipo: z.enum(['membresia', 'abono', 'clase_individual', 'cuota_consorcio', 'otro']),
  disciplina_slug: z.string().optional().nullable(),
  equipo_id: z.string().uuid().optional().nullable(),
  monto_pactado: z.number().positive().optional().nullable(),
  fecha_alta: z.string().optional(),
  origen: z.string().optional(),
  notas: z.string().optional().nullable(),
})

export type AltaMembresiaInput = z.infer<typeof altaMembresiaSchema>

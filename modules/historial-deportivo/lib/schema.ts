import { z } from 'zod'

export const trayectoriaClubInputSchema = z.object({
  persona_id: z.string().uuid(),
  club_nombre: z.string().min(1, 'Ingresá el nombre del club'),
  club_pais: z.string().optional(),
  club_ciudad: z.string().optional(),
  disciplina_slug: z.string().optional(),
  categoria: z.string().optional(),
  posicion: z.string().optional(),
  numero_camiseta: z.number().int().positive().optional(),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
  partidos_jugados: z.number().int().min(0).optional(),
  goles: z.number().int().min(0).optional(),
  asistencias: z.number().int().min(0).optional(),
  observaciones: z.string().optional(),
})

export const trayectoriaClubUpdateSchema = trayectoriaClubInputSchema.partial().omit({ persona_id: true })

export const logroInputSchema = z.object({
  persona_id: z.string().uuid(),
  tipo_logro: z.enum([
    'campeon', 'sub_campeon', 'goleador_torneo', 'mejor_jugador',
    'mvp_partido', 'asistencias_lider', 'vallainvicta', 'convocatoria_seleccion', 'otro',
  ], { message: 'Seleccioná un tipo de logro' }),
  descripcion: z.string().min(1, 'Ingresá una descripción'),
  torneo_nombre: z.string().optional(),
  equipo_nombre: z.string().optional(),
  anio: z.number().int().min(1900).max(2100).optional(),
  fecha_otorgado: z.string().optional(),
  archivo_evidencia_url: z.string().optional(),
})

export const logroUpdateSchema = logroInputSchema.partial().omit({ persona_id: true })

export type TrayectoriaClubInput = z.infer<typeof trayectoriaClubInputSchema>
export type TrayectoriaClubUpdate = z.infer<typeof trayectoriaClubUpdateSchema>
export type LogroInput = z.infer<typeof logroInputSchema>
export type LogroUpdate = z.infer<typeof logroUpdateSchema>

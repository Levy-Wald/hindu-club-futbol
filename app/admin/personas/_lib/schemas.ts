import { z } from 'zod/v4'

export const crearPersonaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  dni: z.string().optional(),
  tipo_documento: z.string().default('dni'),
  email: z.email('Email inválido').optional().or(z.literal('')),
  email_secundario: z.email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  whatsapp: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.string().optional(),
  nacionalidad: z.string().optional(),
  estado_civil: z.string().optional(),
  profesion: z.string().optional(),
  notas: z.string().optional(),
})

export type CrearPersonaInput = z.infer<typeof crearPersonaSchema>

export const editarPersonaSchema = crearPersonaSchema

export type EditarPersonaInput = z.infer<typeof editarPersonaSchema>

export const asignarAtributoSchema = z.object({
  persona_id: z.string().uuid(),
  atributo_slug: z.string().min(1, 'Seleccioná un atributo'),
  valor: z.unknown().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
})

export type AsignarAtributoInput = z.infer<typeof asignarAtributoSchema>

export const asignarVinculoSchema = z.object({
  persona_origen_id: z.string().uuid(),
  persona_destino_id: z.string().uuid('Seleccioná una persona'),
  tipo_vinculo_slug: z.string().min(1, 'Seleccioná un tipo de vínculo'),
  notas: z.string().optional(),
})

export type AsignarVinculoInput = z.infer<typeof asignarVinculoSchema>

export const asignarPadronSchema = z.object({
  persona_id: z.string().uuid(),
  padron_id: z.string().uuid('Seleccioná un padrón'),
  estado_slug: z.string().default('activo'),
  tipo_socio_slug: z.string().optional(),
  numero_socio: z.string().optional(),
})

export type AsignarPadronInput = z.infer<typeof asignarPadronSchema>

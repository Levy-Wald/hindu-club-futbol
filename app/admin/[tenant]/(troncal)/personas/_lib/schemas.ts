import { z } from 'zod/v4'

export const crearPersonaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  tipo_documento: z.string().default('dni'),
  numero_documento: z.string().min(1, 'El número de documento es obligatorio'),
  email_principal: z.email('Email inválido').optional().or(z.literal('')),
  telefono_principal: z.string().optional(),
  whatsapp: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.string().optional(),
  nacionalidad: z.string().optional(),
})

export type CrearPersonaInput = z.infer<typeof crearPersonaSchema>

export const editarPersonaSchema = z.object({
  // Identidad
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  nombre_completo_legal: z.string().optional(),
  tipo_documento: z.string().default('dni'),
  numero_documento: z.string().min(1, 'El número de documento es obligatorio'),
  dni_pais_emision: z.string().optional(),
  cuil_cuit: z.string().optional(),
  pasaporte_numero: z.string().optional(),
  pasaporte_pais: z.string().optional(),
  pasaporte_vigencia: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.string().optional(),
  nacionalidad: z.string().optional(),
  estado_civil: z.string().optional(),
  foto_perfil_url: z.string().optional(),

  // Contacto
  email_principal: z.email('Email inválido').optional().or(z.literal('')),
  email_secundario: z.email('Email secundario inválido').optional().or(z.literal('')),
  telefono_principal: z.string().optional(),
  telefono_secundario: z.string().optional(),
  whatsapp: z.string().optional(),
  whatsapp_emergencia: z.string().optional(),

  // Dirección
  direccion_calle: z.string().optional(),
  direccion_numero: z.string().optional(),
  direccion_piso: z.string().optional(),
  direccion_depto: z.string().optional(),
  direccion_barrio: z.string().optional(),
  direccion_ciudad: z.string().optional(),
  direccion_provincia: z.string().optional(),
  direccion_codigo_postal: z.string().optional(),
  direccion_pais: z.string().optional(),
  direccion_observaciones: z.string().optional(),

  // Perfil deportivo
  lateralidad: z.string().optional(),
  pie_dominante: z.string().optional(),
  mano_dominante: z.string().optional(),
  tipo_pisada: z.string().optional(),
  altura_cm: z.coerce.number().optional(),
  peso_kg: z.coerce.number().optional(),
  fecha_medicion_fisica: z.string().optional(),
  contextura: z.string().optional(),
  usa_lentes: z.boolean().optional(),
  tipo_lentes: z.string().optional(),
  usa_audifono: z.boolean().optional(),
  categoria_historica_max: z.string().optional(),
  nivel_actividad_actual: z.string().optional(),
  frecuencia_entrenamiento_semanal: z.coerce.number().optional(),
  horas_entrenamiento_semanales: z.coerce.number().optional(),

  // Profesional/Educativo
  profesion_ocupacion: z.string().optional(),
  categoria_profesional: z.string().optional(),
  empresa_actual: z.string().optional(),
  cargo_actual: z.string().optional(),
  industria: z.string().optional(),
  sitio_web_profesional: z.string().optional(),
  nivel_educativo_max: z.string().optional(),
  titulo_carrera: z.string().optional(),
  institucion_titulo: z.string().optional(),
  año_graduacion: z.coerce.number().optional(),
  estudiando_actualmente: z.boolean().optional(),
  institucion_actual: z.string().optional(),
  año_grado_actual: z.string().optional(),
  idioma_nativo: z.string().optional(),

  // Membresía
  fecha_primera_relacion_club: z.string().optional(),
  es_socio_fundador: z.boolean().optional(),
  es_socio_vitalicio: z.boolean().optional(),
  es_socio_honorario: z.boolean().optional(),
  bautizo_club_realizado: z.boolean().optional(),

  // Sistema
  notas_internas: z.string().optional(),
})

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
  estado_padron_id: z.string().uuid('Seleccioná un estado'),
  tipo_socio_id: z.string().uuid().optional(),
  numero_socio: z.string().optional(),
})

export type AsignarPadronInput = z.infer<typeof asignarPadronSchema>

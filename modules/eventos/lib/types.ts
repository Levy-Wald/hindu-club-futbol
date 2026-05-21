import { z } from 'zod'

// ── Core types ──

export type EstadoEvento = 'programado' | 'en_curso' | 'completado' | 'cancelado' | 'reprogramado'

export type EspacioVirtualTipo = 'zoom' | 'meet' | 'teams' | 'discord' | 'custom'

export type Evento = {
  id: string
  tenant_id: string
  titulo: string | null
  descripcion: string | null
  fecha: string | null
  hora_inicio: string | null
  hora_fin: string | null
  hora_citacion: string | null
  estado: EstadoEvento
  tipo_evento_slug: string
  modulo_origen: string
  entidad_origen_id: string | null
  equipo_id: string | null
  sede_id: string | null
  cancha_id: string | null
  espacio_id: string | null
  responsable_persona_id: string | null
  instructor_principal_id: string | null
  persona_protagonista_id: string | null
  espacio_virtual_tipo: EspacioVirtualTipo | null
  espacio_virtual_link: string | null
  recordatorios: Recordatorio[]
  etiquetas: string[]
  es_recurrente: boolean
  recurrencia_regla: string | null
  evento_padre_id: string | null
  serie_uuid: string | null
  color: string | null
  icono: string | null
  metadata: Record<string, unknown>
  notas_pre: string | null
  notas_post: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type Recordatorio = {
  minutos_antes: number
  habilitado: boolean
  notificacion_tipo?: 'email' | 'slack' | 'in_app'
}

// ── Smart defaults ──

export type SmartDefaults = {
  titulo: string
  tipo_evento_slug: string
  fecha?: string
  hora_inicio?: string
  hora_fin?: string
  equipo_id?: string
  sede_id?: string
  cancha_id?: string
  espacio_id?: string
  responsable_persona_id?: string
  descripcion?: string
  metadata?: Record<string, unknown>
}

// ── Zod schemas ──

export const EventoCreateSchema = z.object({
  titulo: z.string().min(1, 'Titulo requerido').max(200),
  tipo_evento_slug: z.string().min(1, 'Tipo requerido'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida'),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora inicio invalida'),
  hora_fin: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora fin invalida'),
  modulo_origen: z.string().default('manual'),
  entidad_origen_id: z.string().uuid().optional(),
  equipo_id: z.string().uuid().optional(),
  sede_id: z.string().uuid().optional(),
  cancha_id: z.string().uuid().optional(),
  espacio_id: z.string().uuid().optional(),
  descripcion: z.string().max(2000).optional(),
  responsable_persona_id: z.string().uuid().optional(),
  espacio_virtual_tipo: z.enum(['zoom', 'meet', 'teams', 'discord', 'custom']).optional(),
  espacio_virtual_link: z.string().max(500).optional(),
  etiquetas: z.array(z.string()).optional(),
  color: z.string().max(20).optional(),
})

export type EventoCreateInput = z.infer<typeof EventoCreateSchema>

export const EventoUpdateSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(2000).optional().nullable(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  hora_fin: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  estado: z.enum(['programado', 'en_curso', 'completado', 'cancelado', 'reprogramado']).optional(),
  equipo_id: z.string().uuid().optional().nullable(),
  sede_id: z.string().uuid().optional().nullable(),
  cancha_id: z.string().uuid().optional().nullable(),
  espacio_id: z.string().uuid().optional().nullable(),
  responsable_persona_id: z.string().uuid().optional().nullable(),
  espacio_virtual_tipo: z.enum(['zoom', 'meet', 'teams', 'discord', 'custom']).optional().nullable(),
  espacio_virtual_link: z.string().max(500).optional().nullable(),
  notas_pre: z.string().max(2000).optional().nullable(),
  notas_post: z.string().max(2000).optional().nullable(),
  etiquetas: z.array(z.string()).optional(),
  color: z.string().max(20).optional().nullable(),
})

export type EventoUpdateInput = z.infer<typeof EventoUpdateSchema>

export type EstadoInvitacion = 'pendiente' | 'aceptada' | 'rechazada' | 'tentativa'

export type InvitacionPendiente = {
  evento_invitado_id: string
  evento_id: string
  titulo: string | null
  fecha: string | null
  hora_inicio: string | null
  tipo_evento_slug: string
  equipo_nombre: string | null
  estado_invitacion: EstadoInvitacion
}

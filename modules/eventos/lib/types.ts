import { z } from 'zod'

// ── Core types (matches BD 48 columns exactly) ──

export type EstadoEvento = 'programado' | 'en_curso' | 'completado' | 'cancelado' | 'reprogramado'

export type EspacioVirtualTipo = 'zoom' | 'meet' | 'teams' | 'discord' | 'custom'

export type Periodicidad = 'sin_repeticion' | 'diario' | 'dias_semana' | 'quincenal' | 'mensual' | 'anual' | 'semanal' | 'nunca'

export type InvitadoTipo = 'persona' | 'equipo' | 'entidad' | 'email_externo'

export type Evento = {
  id: string
  tenant_id: string
  titulo: string | null
  descripcion: string | null
  fecha_inicio: string        // DATE NOT NULL
  fecha_fin: string           // DATE NOT NULL
  hora_inicio: string | null  // TIME
  hora_fin: string | null     // TIME
  hora_citacion: string | null
  dia_semana: number | null   // 1-7
  estado: EstadoEvento
  tipo_evento_slug: string
  modulo_origen: string       // default 'equipos'
  entidad_origen_id: string | null
  equipo_id: string | null
  sede_id: string | null
  cancha_id: string | null
  espacio_id: string | null
  responsables_persona_id: string[]  // UUID[] NOT NULL, default '{}'
  instructor_principal_id: string | null
  persona_protagonista_id: string | null
  visible_para_atributos: string[] | null
  espacio_virtual_tipo: EspacioVirtualTipo | null
  espacio_virtual_link: string | null
  recordatorios: Recordatorio[]
  etiquetas: string[]
  es_recurrente: boolean
  recurrencia_regla: string | null
  evento_padre_id: string | null
  serie_uuid: string | null
  periodicidad: Periodicidad
  dias_semana: boolean[] | null
  fecha_fin_recurrencia: string | null
  color: string | null
  icono: string | null
  portada_url: string | null
  lugar_encuentro: string | null
  codigo_acceso: string | null
  contacto: string | null
  metadata: Record<string, unknown>
  notas_pre: string | null
  notas_post: string | null
  // Legacy (kept for backwards compat, still in BD)
  activo: boolean
  fecha_vigencia_desde: string | null
  fecha_vigencia_hasta: string | null
  // Audit
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

// ── EventoInvitado (matches BD 16 columns) ──

export type EstadoInvitacion = 'pendiente' | 'aceptado' | 'rechazado' | 'tentativa'

export type EventoInvitado = {
  id: string
  tenant_id: string
  evento_id: string
  persona_id: string | null
  entidad_id: string | null
  equipo_id: string | null
  email_externo: string | null
  invitado_tipo: InvitadoTipo
  invitado_ref_id: string | null
  rol_invitacion: string
  origen: string
  estado_invitacion: EstadoInvitacion
  respuesta_at: string | null
  token_respuesta: string | null
  token_expira_at: string | null
  marca_asistencia: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Sync fields (post-FASE A — NULL in A4.2)
  google_calendar_event_id: string | null
  outlook_calendar_event_id: string | null
  icloud_calendar_event_id: string | null
  synced_to_google_at: string | null
  synced_to_outlook_at: string | null
  synced_to_icloud_at: string | null
  sync_status_google: SyncStatus | null
  sync_status_outlook: SyncStatus | null
  sync_status_icloud: SyncStatus | null
}

export type SyncStatus = 'pending' | 'synced' | 'failed' | 'skipped'

export type CalendarioTipo = 'google' | 'outlook' | 'icloud'

export type SyncIntent = 'push' | 'pull' | 'update' | 'delete'

export type SyncResult = {
  success: boolean
  syncedTo: CalendarioTipo[]
  errors?: string[]
}

export type EventoCalendarioSincronizacion = {
  id: string
  tenant_id: string
  evento_id: string
  invitacion_id: string | null
  calendario_tipo: CalendarioTipo
  sync_intent: SyncIntent
  sync_status: 'pending' | 'success' | 'failed' | 'retry' | 'aborted'
  error_message: string | null
  external_event_id: string | null
  attempted_at: string
  completed_at: string | null
  retry_count: number
  next_retry_at: string | null
  created_at: string
  updated_at: string
}

// ── Control de acceso (skeleton — post-FASE A) ──

export type EventoAccesoTipo = 'invitado' | 'visitante' | 'padre' | 'personal'

export type EventoAccesoRegistro = {
  id: string
  tenant_id: string
  evento_id: string
  persona_id: string | null
  documento_numero: string | null
  codigo_acceso: string | null
  tipo_acceso: EventoAccesoTipo
  timestamp_entrada: string
  timestamp_salida: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ── Invitado input for crear evento ──

export type InvitadoInput = {
  tipo: InvitadoTipo
  ref_id?: string   // UUID of persona/equipo/entidad
  email?: string    // for email_externo or to resolve persona email
}

// ── Código de acceso ──

export type EventoCodigoAcceso = {
  id: string
  tenant_id: string
  evento_id: string
  codigo: string
  tipo_generacion: 'automatico' | 'manual'
  generado_por: string | null
  activo: boolean
  created_at: string
}

// ── Link de registro ──

export type EventoLinkRegistro = {
  id: string
  tenant_id: string
  evento_id: string
  link_uuid: string
  created_at: string
}

// ── Smart defaults ──

export type SmartDefaults = {
  titulo: string
  tipo_evento_slug: string
  fecha_inicio?: string
  fecha_fin?: string
  hora_inicio?: string
  hora_fin?: string
  equipo_id?: string
  sede_id?: string
  cancha_id?: string
  espacio_id?: string
  responsables_persona_id?: string[]
  descripcion?: string
  modulo_origen?: string
  metadata?: Record<string, unknown>
}

// ── Zod schemas ──

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/

export const EventoCreateSchema = z.object({
  titulo: z.string().min(3, 'Titulo minimo 3 caracteres').max(255),
  tipo_evento_slug: z.string().min(1, 'Tipo requerido'),
  fecha_inicio: z.string().regex(dateRegex, 'Fecha inicio invalida'),
  fecha_fin: z.string().regex(dateRegex, 'Fecha fin invalida'),
  hora_inicio: z.string().regex(timeRegex, 'Hora inicio invalida').optional(),
  hora_fin: z.string().regex(timeRegex, 'Hora fin invalida').optional(),
  modulo_origen: z.string().default('manual'),
  entidad_origen_id: z.string().uuid().optional(),
  equipo_id: z.string().uuid().optional(),
  sede_id: z.string().uuid().optional(),
  cancha_id: z.string().uuid().optional(),
  espacio_id: z.string().uuid().optional(),
  descripcion: z.string().max(2000).optional(),
  responsables_persona_id: z.array(z.string().uuid()).min(1, 'Al menos un responsable'),
  visible_para_atributos: z.array(z.string()).optional(),
  espacio_virtual_tipo: z.enum(['zoom', 'meet', 'teams', 'discord', 'custom']).optional(),
  espacio_virtual_link: z.string().max(500).optional(),
  etiquetas: z.array(z.string()).optional(),
  color: z.string().max(20).optional(),
  periodicidad: z.enum(['sin_repeticion', 'diario', 'dias_semana', 'quincenal', 'mensual', 'anual', 'semanal', 'nunca']).default('nunca'),
  dias_semana: z.array(z.boolean()).length(7).optional(),
  fecha_fin_recurrencia: z.string().regex(dateRegex).optional(),
  portada_url: z.string().max(500).optional(),
  lugar_encuentro: z.string().max(500).optional(),
  codigo_acceso: z.string().max(100).optional(),
  contacto: z.string().max(500).optional(),
}).refine(
  (d) => d.fecha_fin >= d.fecha_inicio,
  { message: 'Fecha fin debe ser >= fecha inicio', path: ['fecha_fin'] }
)

export type EventoCreateInput = z.infer<typeof EventoCreateSchema>

export const EventoUpdateSchema = z.object({
  titulo: z.string().min(3).max(255).optional(),
  descripcion: z.string().max(2000).optional().nullable(),
  fecha_inicio: z.string().regex(dateRegex).optional(),
  fecha_fin: z.string().regex(dateRegex).optional(),
  hora_inicio: z.string().regex(timeRegex).optional().nullable(),
  hora_fin: z.string().regex(timeRegex).optional().nullable(),
  estado: z.enum(['programado', 'en_curso', 'completado', 'cancelado', 'reprogramado']).optional(),
  equipo_id: z.string().uuid().optional().nullable(),
  sede_id: z.string().uuid().optional().nullable(),
  cancha_id: z.string().uuid().optional().nullable(),
  espacio_id: z.string().uuid().optional().nullable(),
  responsables_persona_id: z.array(z.string().uuid()).min(1).optional(),
  visible_para_atributos: z.array(z.string()).optional().nullable(),
  espacio_virtual_tipo: z.enum(['zoom', 'meet', 'teams', 'discord', 'custom']).optional().nullable(),
  espacio_virtual_link: z.string().max(500).optional().nullable(),
  notas_pre: z.string().max(2000).optional().nullable(),
  notas_post: z.string().max(2000).optional().nullable(),
  etiquetas: z.array(z.string()).optional(),
  color: z.string().max(20).optional().nullable(),
  periodicidad: z.enum(['sin_repeticion', 'diario', 'dias_semana', 'quincenal', 'mensual', 'anual', 'semanal', 'nunca']).optional(),
  dias_semana: z.array(z.boolean()).length(7).optional().nullable(),
  fecha_fin_recurrencia: z.string().regex(dateRegex).optional().nullable(),
  portada_url: z.string().max(500).optional().nullable(),
  lugar_encuentro: z.string().max(500).optional().nullable(),
  codigo_acceso: z.string().max(100).optional().nullable(),
  contacto: z.string().max(500).optional().nullable(),
})

export type EventoUpdateInput = z.infer<typeof EventoUpdateSchema>

export const ResponderInvitacionSchema = z.object({
  estado: z.enum(['aceptado', 'rechazado', 'tentativa']),
})

// ── Invitados Zod schema ──

export const InvitadoInputSchema = z.object({
  tipo: z.enum(['persona', 'equipo', 'entidad', 'email_externo']),
  ref_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
}).refine(
  (d) => d.tipo === 'email_externo' ? !!d.email : !!d.ref_id,
  { message: 'ref_id requerido para persona/equipo/entidad, email para email_externo' }
)

// ── Hydrated types for UI ──

export type InvitacionPendiente = {
  evento_invitado_id: string
  evento_id: string
  titulo: string | null
  fecha_inicio: string | null
  hora_inicio: string | null
  tipo_evento_slug: string
  equipo_nombre: string | null
  estado_invitacion: EstadoInvitacion
}

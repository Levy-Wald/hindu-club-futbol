export type EstadoProyecto = 'planificado' | 'en_curso' | 'pausado' | 'completado' | 'cancelado'
export type EstadoTarea = 'backlog' | 'en_curso' | 'review' | 'hecho' | 'cancelado'
export type Prioridad = 'baja' | 'media' | 'alta' | 'critica'
export type RolMiembro = 'responsable' | 'miembro' | 'observador'

export interface Proyecto {
  id: string
  tenant_id: string
  nombre: string
  descripcion: string | null
  codigo: string | null
  responsable_persona_id: string | null
  cliente_persona_id: string | null
  cliente_entidad_id: string | null
  fecha_inicio: string | null
  fecha_fin_estimada: string | null
  fecha_fin_real: string | null
  estado: EstadoProyecto
  presupuesto_total: number | null
  moneda: string
  color: string
  activo: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProyectoConRelaciones extends Proyecto {
  responsable?: { id: string; nombre: string; apellido: string } | null
  cliente_persona?: { id: string; nombre: string; apellido: string } | null
  cliente_entidad?: { id: string; nombre: string } | null
  presupuesto_consumido?: number
  total_tareas?: number
  tareas_completadas?: number
}

export interface Tarea {
  id: string
  proyecto_id: string
  titulo: string
  descripcion: string | null
  estado_slug: EstadoTarea
  asignado_persona_id: string | null
  prioridad: Prioridad
  fecha_limite: string | null
  fecha_completada: string | null
  posicion_kanban: number
  parent_tarea_id: string | null
  tiempo_estimado_horas: number | null
  tiempo_real_horas: number | null
  tags: string[]
  activo: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface TareaConRelaciones extends Tarea {
  asignado?: { id: string; nombre: string; apellido: string } | null
  subtareas_count?: number
  comentarios_count?: number
}

export interface Miembro {
  proyecto_id: string
  persona_id: string
  rol: RolMiembro
  fecha_agregado: string
  persona?: { id: string; nombre: string; apellido: string; email_principal: string | null }
}

export interface Comentario {
  id: string
  proyecto_id: string
  tarea_id: string | null
  persona_id: string
  texto: string
  menciones: unknown[]
  created_at: string
  deleted_at: string | null
  persona?: { id: string; nombre: string; apellido: string }
}

export interface EstadoTareaCatalogo {
  slug: string
  nombre: string
  color: string | null
  orden: number
  es_finalizado: boolean
  activo: boolean
}

export const ESTADO_PROYECTO_LABELS: Record<EstadoProyecto, string> = {
  planificado: 'Planificado',
  en_curso: 'En curso',
  pausado: 'Pausado',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

export const ESTADO_PROYECTO_COLORS: Record<EstadoProyecto, string> = {
  planificado: '#94A3B8',
  en_curso: '#4F46E5',
  pausado: '#D97706',
  completado: '#059669',
  cancelado: '#DC2626',
}

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
}

export const PRIORIDAD_COLORS: Record<Prioridad, string> = {
  baja: '#94A3B8',
  media: '#3B82F6',
  alta: '#F59E0B',
  critica: '#EF4444',
}

export const ROL_MIEMBRO_LABELS: Record<RolMiembro, string> = {
  responsable: 'Responsable',
  miembro: 'Miembro',
  observador: 'Observador',
}

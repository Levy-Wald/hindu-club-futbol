export interface TipoLesion {
  slug: string
  nombre: string
  zona_corporal_default: string | null
  gravedad_default: string | null
  dias_recuperacion_promedio: number | null
  activo: boolean
}

export interface LesionRow {
  id: string
  tenant_id: string
  persona_id: string
  tipo_lesion: string | null
  tipo_lesion_slug: string | null
  zona_corporal: string | null
  gravedad: string | null
  fecha_inicio: string | null
  fecha_alta_medica: string | null
  recuperada: boolean
  restriccion_actividad: string | null
  archivo_estudio_url: string | null
  diagnostico_medico: string | null
  tratamiento: string | null
  notas: string | null
  descripcion: string | null
  equipo_id: string | null
  activo: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface LesionadoActivo {
  id: string
  tenant_id: string
  persona_id: string
  persona_nombre: string
  equipo_id: string | null
  equipo_nombre: string | null
  tipo_lesion: string | null
  tipo_lesion_slug: string | null
  tipo_lesion_nombre: string | null
  zona_corporal: string | null
  gravedad: string | null
  fecha_inicio: string | null
  fecha_alta_medica: string | null
  restriccion_actividad: string | null
  dias_inactivo: number | null
}

export interface LesionInput {
  persona_id: string
  tipo_lesion_slug: string
  tipo_lesion?: string
  zona_corporal: string
  gravedad: string
  fecha_inicio: string
  equipo_id?: string
  restriccion_actividad?: string
  diagnostico_medico?: string
  tratamiento?: string
  descripcion?: string
  notas?: string
}

export interface LesionUpdate {
  tipo_lesion_slug?: string
  tipo_lesion?: string
  zona_corporal?: string
  gravedad?: string
  fecha_inicio?: string
  fecha_alta_medica?: string | null
  equipo_id?: string | null
  restriccion_actividad?: string | null
  diagnostico_medico?: string | null
  tratamiento?: string | null
  descripcion?: string | null
  notas?: string | null
}

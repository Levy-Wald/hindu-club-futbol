export type CategoriaEjercicio =
  | 'calentamiento' | 'tecnica' | 'fisico' | 'tactico'
  | 'mental' | 'enfriamiento' | 'otro'

export type Intensidad = 'baja' | 'media' | 'alta' | 'muy_alta'

export type Ejercicio = {
  id: string
  tenant_id: string | null
  slug: string
  nombre: string
  descripcion: string | null
  categoria: CategoriaEjercicio | null
  duracion_min_sugerida: number | null
  intensidad: Intensidad | null
  edades_recomendadas: string | null
  equipamiento_necesario: string[]
  video_url: string | null
  imagen_url: string | null
  activo: boolean
}

export type PlanEntrenamiento = {
  id: string
  tenant_id: string
  evento_id: string
  nombre: string | null
  objetivo: string | null
  duracion_total_min: number | null
  nivel_intensidad: Intensidad | null
  notas_dt: string | null
  creado_por_persona_id: string | null
  created_at: string
  updated_at: string
}

export type Bloque = {
  id: string
  tenant_id: string
  plan_id: string
  orden: number
  ejercicio_id: string | null
  ejercicio?: Ejercicio | null
  nombre_personalizado: string | null
  duracion_min: number | null
  repeticiones: number | null
  series: number | null
  intensidad_override: Intensidad | null
  notas_bloque: string | null
}

export type PlanCompleto = {
  plan: PlanEntrenamiento
  bloques: Bloque[]
  duracion_total_calculada: number
}

export type TipoTorneo = 'interno' | 'externo'

export type FormatoTorneo =
  | 'liga'
  | 'eliminacion'
  | 'grupos_playoff'
  | 'suizo'
  | 'triangular'
  | 'cuadrangular'

export type EstadoTorneo =
  | 'planificado'
  | 'inscripcion'
  | 'en_curso'
  | 'finalizado'
  | 'cancelado'

export type Torneo = {
  id: string
  tenant_id: string
  slug: string
  nombre: string
  descripcion: string | null
  tipo: TipoTorneo
  formato: FormatoTorneo
  federacion_id: string | null
  temporada: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  estado: EstadoTorneo
  nivel_competencia_slug: string | null
  criterios_desempate: string[]
  metadata: Record<string, unknown>
  activo: boolean
  created_at: string
  updated_at: string
}

export type TorneoHidratado = Torneo & {
  federacion_nombre: string | null
  nivel_competencia_nombre: string | null
  categorias_count: number
  equipos_count: number
}

export type Categoria = {
  id: string
  tenant_id: string
  torneo_id: string
  slug: string
  nombre: string
  orden: number
  num_equipos_max: number | null
  metadata: Record<string, unknown>
  created_at: string
}

export type EquipoInscripto = {
  id: string
  tenant_id: string
  torneo_id: string
  categoria_id: string | null
  equipo_id: string | null
  equipo_externo_nombre: string | null
  equipo_externo_entidad_id: string | null
  posicion_final: number | null
  activo: boolean
  created_at: string
  // Hydrated
  equipo_nombre: string
  categoria_nombre: string | null
}

export type NivelCompetencia = {
  slug: string
  nombre: string
}

export type Federacion = {
  id: string
  nombre: string
}

export type EquipoPropio = {
  id: string
  nombre: string
}

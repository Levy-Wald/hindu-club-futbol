export interface TrayectoriaClub {
  id: string
  tenant_id: string
  persona_id: string
  club_nombre: string
  club_pais: string | null
  club_ciudad: string | null
  disciplina_slug: string | null
  categoria: string | null
  posicion: string | null
  numero_camiseta: number | null
  fecha_desde: string | null
  fecha_hasta: string | null
  partidos_jugados: number | null
  goles: number | null
  asistencias: number | null
  observaciones: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export const TIPOS_LOGRO = [
  { value: 'campeon', label: 'Campeón' },
  { value: 'sub_campeon', label: 'Sub-campeón' },
  { value: 'goleador_torneo', label: 'Goleador del torneo' },
  { value: 'mejor_jugador', label: 'Mejor jugador' },
  { value: 'mvp_partido', label: 'MVP de partido' },
  { value: 'asistencias_lider', label: 'Líder en asistencias' },
  { value: 'vallainvicta', label: 'Valla invicta' },
  { value: 'convocatoria_seleccion', label: 'Convocatoria a selección' },
  { value: 'otro', label: 'Otro' },
] as const

export type TipoLogro = (typeof TIPOS_LOGRO)[number]['value']

export interface Logro {
  id: string
  tenant_id: string
  persona_id: string
  tipo_logro: TipoLogro
  descripcion: string
  torneo_nombre: string | null
  equipo_nombre: string | null
  anio: number | null
  fecha_otorgado: string | null
  archivo_evidencia_url: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

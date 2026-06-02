export type SpaceId = 'inicio' | 'personas' | 'actividad' | 'marketing' | 'finanzas' | 'recursos' | 'configuracion'

export type SidebarCapa =
  | 'troncal'
  | 'cross_vertical'
  | 'vertical_ccbp'
  | 'integracion'
  | 'plataforma_saas'
  | 'ia_nativa'

export type SidebarEstado = 'activo' | 'proximamente'

export interface SidebarItem {
  id: string
  label: string
  href: string
  icon: string
  capa: SidebarCapa
  estado: SidebarEstado
  modulo_slug?: string
  capability_requerida?: string
  espacio: SpaceId
  grupo: string
  orden: number
  nota?: string
  badge?: 'beta' | 'new' | 'soon'
  vertical_filter?: string[]
}

export interface SpaceVisibilityRule {
  visible_if?: 'always'
  visible_if_has_any?: string[]
  visible_if_has_attribute?: string
}

export interface Space {
  id: SpaceId
  label: string
  icon: string
}

export interface ModuleSidebarMeta {
  slug: string
  nombre: string
  nombre_display: string | null
  area_sidebar_bo: string
  sub_area_sidebar_bo: string
  orden: number | null
  prioridad_fase_c: string
  activo_global: boolean
}

// F1.6 (RFC-006): render data-driven del sidebar BO desde catalogo_modulos.
export interface SidebarSubitem {
  label: string
  ruta_bo: string
  icono?: string | null
  capability_requerida?: string | null
  orden?: number | null
}

export interface CatalogSidebarRow {
  slug: string
  nombre: string
  nombre_display: string | null
  area_sidebar_bo: string
  sub_area_sidebar_bo: string
  orden: number | null
  capa: string | null
  ruta_bo: string | null
  icono: string | null
  capability_requerida: string | null
  sidebar_subitems: SidebarSubitem[] | null
}

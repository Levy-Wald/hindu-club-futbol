export type SpaceId = 'mi-dia' | 'operacion' | 'gestion' | 'setup'

export type SidebarCapa = 'troncal' | 'cross_vertical' | 'vertical_ccbp'

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
}

export interface Space {
  id: SpaceId
  label: string
  icon: string
}

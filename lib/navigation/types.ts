export type SpaceId = 'mi-dia' | 'operacion' | 'gestion' | 'setup'

export interface SidebarItem {
  id: string
  label: string
  href: string
  icon: string
  modulo_slug?: string
  capability_requerida?: string
  espacio: SpaceId
  grupo: string
  orden: number
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

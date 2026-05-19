import { SIDEBAR_CATALOG } from './sidebar-items'
import { SPACE_VISIBILITY_RULES, SPACES } from './spaces'
import type { SidebarItem, Space, SpaceId } from './types'

const ADMIN_ATTRIBUTES = ['tenant.admin', 'sistema.admin']

export function isAdmin(userAttributes: string[]): boolean {
  return ADMIN_ATTRIBUTES.some(a => userAttributes.includes(a))
}

export function getVisibleSidebarItems(
  userCapabilities: string[],
  tenantModulos: string[],
  tenantVerticales: string[],
  espacioActivo: SpaceId,
  userAttributes: string[] = []
): SidebarItem[] {
  const admin = isAdmin(userAttributes)

  return SIDEBAR_CATALOG.filter(item => {
    if (item.espacio !== espacioActivo) return false

    // Próximamente items always visible (owner wants full roadmap visibility)
    if (item.estado === 'proximamente') return true

    if (item.modulo_slug && !tenantModulos.includes(item.modulo_slug)) return false

    if (item.capability_requerida && !admin && !userCapabilities.includes(item.capability_requerida))
      return false

    if (item.vertical_filter && item.vertical_filter.length > 0) {
      if (!item.vertical_filter.some(v => tenantVerticales.includes(v))) return false
    }

    return true
  })
}

export function getVisibleSpaces(userCapabilities: string[], userAttributes: string[] = []): Space[] {
  const admin = isAdmin(userAttributes)
  return SPACES.filter(space => {
    if (admin) return true
    const rules = SPACE_VISIBILITY_RULES[space.id]
    if (rules.visible_if === 'always') return true
    if (rules.visible_if_has_attribute) {
      return userAttributes.includes(rules.visible_if_has_attribute)
    }
    if (rules.visible_if_has_any) {
      return rules.visible_if_has_any.some(cap => userCapabilities.includes(cap))
    }
    return false
  })
}

export interface SidebarSubGroup {
  grupo: string
  items: SidebarItem[]
}

export interface SidebarCapaGroup {
  capa: SidebarItem['capa']
  label: string
  subGroups: SidebarSubGroup[]
}

const CAPA_ORDER: SidebarItem['capa'][] = [
  'troncal',
  'cross_vertical',
  'vertical_ccbp',
  'integracion',
  'plataforma_saas',
  'ia_nativa',
]

const CAPA_LABELS: Record<SidebarItem['capa'], string> = {
  troncal: 'Troncal',
  cross_vertical: 'Modular',
  vertical_ccbp: 'Vertical CCBP',
  integracion: 'Integraciones',
  plataforma_saas: 'Plataforma SaaS',
  ia_nativa: 'IA Nativa',
}

export function groupSidebarItems(items: SidebarItem[]): SidebarCapaGroup[] {
  const byCapa = new Map<SidebarItem['capa'], Map<string, SidebarItem[]>>()

  for (const item of items) {
    if (!byCapa.has(item.capa)) byCapa.set(item.capa, new Map())
    const grupoMap = byCapa.get(item.capa)!
    if (!grupoMap.has(item.grupo)) grupoMap.set(item.grupo, [])
    grupoMap.get(item.grupo)!.push(item)
  }

  return CAPA_ORDER
    .filter(capa => byCapa.has(capa))
    .map(capa => {
      const grupoMap = byCapa.get(capa)!
      const subGroups: SidebarSubGroup[] = []
      for (const [grupo, groupItems] of grupoMap) {
        subGroups.push({ grupo, items: groupItems.sort((a, b) => a.orden - b.orden) })
      }
      return { capa, label: CAPA_LABELS[capa], subGroups }
    })
}

export function inferVerticalesFromModulos(tenantModulos: string[]): string[] {
  const verticales: string[] = []
  const ccbpModules = [
    'club_deportivo',
    'equipos',
    'competencias',
    'torneos',
    'partidos',
    'entrenamientos',
    'scouting',
    'datos_medicos',
    'disciplinas',
    'amistosos',
    'tactica',
    'autorizaciones_imagen',
    'contactos_emergencia',
    'country_deportivo',
    'planificadores',
    'vehiculos_acceso',
  ]
  if (ccbpModules.some(m => tenantModulos.includes(m))) {
    verticales.push('vertical_ccbp')
  }
  return verticales
}

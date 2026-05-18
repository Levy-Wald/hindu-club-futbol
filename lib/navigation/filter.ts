import { SIDEBAR_CATALOG } from './sidebar-items'
import { SPACE_VISIBILITY_RULES, SPACES } from './spaces'
import type { SidebarItem, Space, SpaceId } from './types'

export function getVisibleSidebarItems(
  userCapabilities: string[],
  tenantModulos: string[],
  tenantVerticales: string[],
  espacioActivo: SpaceId
): SidebarItem[] {
  return SIDEBAR_CATALOG.filter(item => {
    if (item.espacio !== espacioActivo) return false

    if (item.modulo_slug && !tenantModulos.includes(item.modulo_slug)) return false

    if (item.capability_requerida && !userCapabilities.includes(item.capability_requerida))
      return false

    if (item.vertical_filter && item.vertical_filter.length > 0) {
      if (!item.vertical_filter.some(v => tenantVerticales.includes(v))) return false
    }

    return true
  })
}

export function getVisibleSpaces(userCapabilities: string[]): Space[] {
  return SPACES.filter(space => {
    const rules = SPACE_VISIBILITY_RULES[space.id]
    if (rules.visible_if === 'always') return true
    if (rules.visible_if_has_any) {
      return rules.visible_if_has_any.some(cap => userCapabilities.includes(cap))
    }
    return false
  })
}

export function groupSidebarItems(
  items: SidebarItem[]
): { grupo: string; items: SidebarItem[] }[] {
  const groupOrder: string[] = []
  const groupMap = new Map<string, SidebarItem[]>()

  for (const item of items) {
    if (!groupMap.has(item.grupo)) {
      groupOrder.push(item.grupo)
      groupMap.set(item.grupo, [])
    }
    groupMap.get(item.grupo)!.push(item)
  }

  return groupOrder.map(grupo => ({
    grupo,
    items: groupMap.get(grupo)!.sort((a, b) => a.orden - b.orden),
  }))
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
  // Future: vertical_country, vertical_educativo, etc.
  return verticales
}

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
  userAttributes: string[] = [],
  items: SidebarItem[] = SIDEBAR_CATALOG
): SidebarItem[] {
  const admin = isAdmin(userAttributes)

  return items.filter(item => {
    if (item.espacio !== espacioActivo) return false

    // Proximamente items always visible (owner wants full roadmap visibility)
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

export interface SidebarGroup {
  grupo: string
  items: SidebarItem[]
}

export function groupSidebarItems(items: SidebarItem[]): SidebarGroup[] {
  const byGrupo = new Map<string, SidebarItem[]>()

  for (const item of items) {
    if (!byGrupo.has(item.grupo)) byGrupo.set(item.grupo, [])
    byGrupo.get(item.grupo)!.push(item)
  }

  const groups: SidebarGroup[] = []
  for (const [grupo, groupItems] of byGrupo) {
    groups.push({ grupo, items: groupItems.sort((a, b) => a.orden - b.orden) })
  }

  // Sort groups by the minimum orden of their items (deterministic ordering)
  return groups.sort((a, b) => {
    const minA = Math.min(...a.items.map(i => i.orden))
    const minB = Math.min(...b.items.map(i => i.orden))
    return minA - minB
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

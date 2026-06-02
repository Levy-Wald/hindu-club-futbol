// F1.6 (RFC-006): construcción del sidebar de back office desde catalogo_modulos.
//
// El catálogo es la fuente de la estructura: qué módulos aparecen, su área
// (area_sidebar_bo → espacio), sub-área (sub_area_sidebar_bo → grupo), label
// (nombre_display || nombre) y orden. La ruta/ícono/capability salen de las
// columnas ruta_bo/icono/capability_requerida (pobladas en migración F1.6).
//
// Items "core" (Inicio, Mi perfil, Personas, Configuración, etc.) NO son módulos
// del catálogo: viven acá en código como estructura troncal siempre-activa.
//
// Dos filtros, ambos server-side (se corren al construir, no en el cliente):
//   (a) módulo activo del tenant: troncal/core siempre visible; el resto se
//       muestra solo si su slug está en los módulos activos del tenant.
//   (b) capability: admin ve todo; si no, se oculta el item cuya
//       capability_requerida el usuario no tiene.

import type { CatalogSidebarRow, SidebarItem, SpaceId } from './types'

// F1.8 (ADR-066): orden canónico de áreas del club. Constante única — no vive en
// la base. recursos/marketing salieron (reasignadas a comercial/operaciones/
// comunicacion). admin_scl queda al final pero se excluye del render de BO.
export const AREA_ORDER: string[] = [
  'inicio',
  'personas',
  'actividad',
  'comercial',
  'operaciones',
  'finanzas',
  'comunicacion',
  'configuracion',
  'admin_scl',
]

export function areaIndex(area: string): number {
  const i = AREA_ORDER.indexOf(area)
  return i === -1 ? AREA_ORDER.length : i
}

// Items estructurales troncales que NO son módulos del catálogo (no tienen fila
// en catalogo_modulos). Se renderizan siempre (sujetos al filtro de capability).
// href sin segmento de tenant; se inyecta en el render.
const CORE_ITEMS: Omit<SidebarItem, 'capa'>[] = [
  // inicio
  { id: 'inicio', label: 'Inicio', href: '/admin', icon: 'Home', estado: 'activo', espacio: 'inicio', grupo: 'Principal', orden: 0 },
  { id: 'mi-calendario', label: 'Mi calendario', href: '/admin/mi-calendario', icon: 'CalendarCheck', estado: 'activo', espacio: 'inicio', grupo: 'Principal', orden: 25 },
  { id: 'mi-perfil', label: 'Mi perfil', href: '/admin/mi-perfil', icon: 'User', estado: 'activo', espacio: 'inicio', grupo: 'Mi cuenta', orden: 50 },
  { id: 'mi-equipo', label: 'Mi equipo', href: '/admin/mi-equipo', icon: 'Users', estado: 'activo', espacio: 'inicio', grupo: 'Mi cuenta', orden: 60 },
  { id: 'mi-cuenta', label: 'Mi cuenta', href: '/admin/mi-cuenta', icon: 'IdCard', estado: 'activo', espacio: 'inicio', grupo: 'Mi cuenta', orden: 70 },
  // personas (padrón troncal — no son módulos)
  { id: 'personas', label: 'Personas', href: '/admin/personas', icon: 'Users', estado: 'activo', espacio: 'personas', grupo: 'Padrón', orden: 0, capability_requerida: 'personas.read' },
  { id: 'entidades', label: 'Entidades', href: '/admin/entidades', icon: 'Building2', estado: 'activo', espacio: 'personas', grupo: 'Padrón', orden: 1, capability_requerida: 'entidades.read' },
  { id: 'padrones', label: 'Padrones', href: '/admin/padrones', icon: 'UsersRound', estado: 'activo', espacio: 'personas', grupo: 'Padrón', orden: 2, capability_requerida: 'personas.read' },
  // configuración (admin del tenant — no son módulos)
  { id: 'usuarios', label: 'Usuarios y permisos', href: '/admin/configuracion/usuarios', icon: 'UserCog', estado: 'activo', espacio: 'configuracion', grupo: 'Usuarios y permisos', orden: 0, capability_requerida: 'setup.users' },
  { id: 'atributos-custom', label: 'Atributos custom', href: '/admin/configuracion/atributos-custom', icon: 'Settings2', estado: 'activo', espacio: 'configuracion', grupo: 'Usuarios y permisos', orden: 1, capability_requerida: 'setup.tenant' },
  { id: 'identidad-marca', label: 'Identidad y marca', href: '/admin/configuracion/branding', icon: 'Palette', estado: 'activo', espacio: 'configuracion', grupo: 'General', orden: 10, capability_requerida: 'setup.tenant' },
  { id: 'sedes', label: 'Sedes', href: '/admin/configuracion/sedes', icon: 'MapPin', estado: 'activo', espacio: 'configuracion', grupo: 'General', orden: 11, capability_requerida: 'setup.tenant' },
  { id: 'catalogos', label: 'Catálogos del sistema', href: '/admin/catalogos', icon: 'Library', estado: 'activo', espacio: 'configuracion', grupo: 'General', orden: 12, capability_requerida: 'setup.tenant' },
  { id: 'configuracion-general', label: 'Configuración general', href: '/admin/configuracion', icon: 'Settings', estado: 'activo', espacio: 'configuracion', grupo: 'General', orden: 13, capability_requerida: 'setup.tenant' },
  { id: 'integraciones', label: 'Integraciones', href: '/admin/integraciones', icon: 'Plug', estado: 'activo', espacio: 'configuracion', grupo: 'Integraciones', orden: 20, capability_requerida: 'setup.integraciones' },
]

function withTenant(href: string, tenantId: string): string {
  if (href === '/admin') return `/admin/${tenantId}`
  if (href.startsWith('/admin/')) return `/admin/${tenantId}${href.slice(6)}`
  return href
}

function passesCapability(cap: string | null | undefined, userCapabilities: string[], isAdmin: boolean): boolean {
  if (!cap) return true
  if (isAdmin) return true
  return userCapabilities.includes(cap)
}

export interface BuildSidebarParams {
  catalogRows: CatalogSidebarRow[]
  activeModuleSlugs: string[]
  userCapabilities: string[]
  isAdmin: boolean
  tenantId: string
}

/**
 * Construye los items del sidebar BO, ya filtrados server-side (módulo activo +
 * capability) y con el href con tenant inyectado. El cliente solo filtra por
 * espacio activo y agrupa.
 */
export function buildSidebarFromCatalog({
  catalogRows,
  activeModuleSlugs,
  userCapabilities,
  isAdmin,
  tenantId,
}: BuildSidebarParams): SidebarItem[] {
  const active = new Set(activeModuleSlugs)
  const items: SidebarItem[] = []

  // 1) Items core (troncales, no módulos). Filtro (b) capability.
  for (const core of CORE_ITEMS) {
    if (!passesCapability(core.capability_requerida, userCapabilities, isAdmin)) continue
    items.push({ ...core, href: withTenant(core.href, tenantId), capa: 'troncal' })
  }

  // 2) Módulos del catálogo (solo BO con ruta_bo). Filtros (a) y (b).
  for (const row of catalogRows) {
    if (!row.ruta_bo) continue // sin página → no se renderiza
    if (!AREA_ORDER.includes(row.area_sidebar_bo)) continue
    if (row.area_sidebar_bo === 'admin_scl') continue // SCL interno, fuera de BO (F-posterior)

    // (a) módulo activo: troncal siempre; el resto requiere estar activo en el tenant
    const esTroncal = row.capa === 'troncal'
    if (!esTroncal && !active.has(row.slug)) continue

    // (b) capability
    if (!passesCapability(row.capability_requerida, userCapabilities, isAdmin)) continue

    const espacio = row.area_sidebar_bo as SpaceId
    const grupo = row.sub_area_sidebar_bo
    const baseOrden = row.orden ?? 0

    items.push({
      id: row.slug,
      label: row.nombre_display ?? row.nombre,
      href: withTenant(row.ruta_bo, tenantId),
      icon: row.icono ?? 'Square',
      capa: 'troncal',
      estado: 'activo',
      modulo_slug: row.slug,
      capability_requerida: row.capability_requerida ?? undefined,
      espacio,
      grupo,
      orden: baseOrden,
    })

    // sub-items del módulo, aplanados como hermanos en el mismo grupo
    for (const sub of row.sidebar_subitems ?? []) {
      if (!sub.ruta_bo) continue
      if (!passesCapability(sub.capability_requerida, userCapabilities, isAdmin)) continue
      items.push({
        id: `${row.slug}:${sub.ruta_bo}`,
        label: sub.label,
        href: withTenant(sub.ruta_bo, tenantId),
        icon: sub.icono ?? row.icono ?? 'Square',
        capa: 'troncal',
        estado: 'activo',
        modulo_slug: row.slug,
        capability_requerida: sub.capability_requerida ?? undefined,
        espacio,
        grupo,
        orden: sub.orden ?? baseOrden + 1,
      })
    }
  }

  return items
}

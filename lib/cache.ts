import { unstable_cache } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { ModuleSidebarMeta, CatalogSidebarRow } from '@/lib/navigation/types'

/**
 * Cached: tenant_modulos activos (cambia ~1x cada 3 meses)
 * Revalidate: 5 min | Tag: tenant-modules
 */
export const getCachedTenantModulos = unstable_cache(
  async (tenantId: string): Promise<string[]> => {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('tenant_modulos')
      .select('modulo_slug')
      .eq('tenant_id', tenantId)
      .eq('activo', true)
    return (data ?? []).map((r: { modulo_slug: string }) => r.modulo_slug)
  },
  ['tenant-modulos'],
  { tags: ['tenant-modules'], revalidate: 300 }
)

/**
 * Cached: sidebar module metadata from catalogo_modulos (cambia rarisimo)
 * Revalidate: 10 min | Tag: sidebar-modules
 */
export const getCachedSidebarModules = unstable_cache(
  async (): Promise<Record<string, ModuleSidebarMeta>> => {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('catalogo_modulos')
      .select('slug, nombre, nombre_display, area_sidebar_bo, sub_area_sidebar_bo, orden, prioridad_fase_c, activo_global')
      .not('area_sidebar_bo', 'is', null)
    if (error) {
      console.error('getCachedSidebarModules error:', error)
      return {}
    }
    const record: Record<string, ModuleSidebarMeta> = {}
    for (const row of data ?? []) {
      record[row.slug] = row as ModuleSidebarMeta
    }
    return record
  },
  ['sidebar-modules'],
  { tags: ['sidebar-modules'], revalidate: 600 }
)

/**
 * F1.6 (RFC-006): filas completas de catalogo_modulos para render data-driven
 * del sidebar de back office. Incluye ruta_bo / icono / capability_requerida /
 * sidebar_subitems. Solo módulos con area_sidebar_bo (agrupables).
 * Revalidate: 10 min | Tag: sidebar-modules
 */
export const getCachedSidebarCatalog = unstable_cache(
  async (): Promise<CatalogSidebarRow[]> => {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('catalogo_modulos')
      .select('slug, nombre, nombre_display, area_sidebar_bo, sub_area_sidebar_bo, orden, capa, ruta_bo, icono, capability_requerida, sidebar_subitems')
      .not('area_sidebar_bo', 'is', null)
    if (error) {
      console.error('getCachedSidebarCatalog error:', error)
      return []
    }
    return (data ?? []) as CatalogSidebarRow[]
  },
  ['sidebar-catalog'],
  { tags: ['sidebar-modules'], revalidate: 600 }
)

/**
 * Cached: catalogo_atributos completo (cambia rarisimo)
 * Revalidate: 5 min | Tag: catalog-attributes
 */
export const getCachedCatalogAtributos = unstable_cache(
  async () => {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('catalogo_atributos')
      .select('slug, nombre, tipo, grupo')
    return data ?? []
  },
  ['catalog-atributos'],
  { tags: ['catalog-attributes'], revalidate: 300 }
)

/**
 * Cached: branding/config publica del tenant (cambia casi nunca)
 * Revalidate: 10 min | Tag: tenant-config
 */
export const getCachedBranding = unstable_cache(
  async (tenantId: string) => {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('tenant_config_publica')
      .select('favicon_url, fuente_titulos, fuente_cuerpo, nombre_display, color_primario, color_secundario')
      .eq('tenant_id', tenantId)
      .maybeSingle()
    return data
  },
  ['tenant-branding'],
  { tags: ['tenant-config'], revalidate: 600 }
)

/**
 * Cached: capabilities del usuario (por personaId)
 * Revalidate: 2 min | Tag: user-capabilities
 */
export const getCachedUserCapabilities = unstable_cache(
  async (personaId: string): Promise<string[]> => {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.rpc('get_user_capabilities', { p_persona_id: personaId })
    if (error) {
      console.error('getCachedUserCapabilities error:', error)
      return []
    }
    return data ?? []
  },
  ['user-capabilities'],
  { tags: ['user-capabilities'], revalidate: 120 }
)

/**
 * Cached: atributos del usuario (por personaId)
 * Revalidate: 2 min | Tag: user-attributes
 */
export const getCachedUserAttributes = unstable_cache(
  async (personaId: string, tenantId: string): Promise<string[]> => {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
      .from('personas_atributos')
      .select('atributo_slug')
      .eq('persona_id', personaId)
      .eq('tenant_id', tenantId)
      .eq('activo', true)
    return (data ?? []).map((d: { atributo_slug: string }) => d.atributo_slug)
  },
  ['user-attributes'],
  { tags: ['user-attributes'], revalidate: 120 }
)

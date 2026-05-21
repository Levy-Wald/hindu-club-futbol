import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCachedTenantModulos, getCachedUserCapabilities, getCachedUserAttributes, getCachedSidebarModules } from '@/lib/cache'
import { getVisibleSpaces, inferVerticalesFromModulos } from '@/lib/navigation/filter'
import { SIDEBAR_CATALOG } from '@/lib/navigation/sidebar-items'
import { NavigationShell } from '@/components/navigation/NavigationShell'
import { TenantProvider } from '@/lib/contexts/tenant-context'
import { isValidTenantId } from '@/lib/tenant'
import type { SidebarItem, ModuleSidebarMeta } from '@/lib/navigation/types'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}

function enrichSidebarItems(
  items: SidebarItem[],
  tenantId: string,
  modulesMeta: Record<string, ModuleSidebarMeta>
): SidebarItem[] {
  return items.map(item => {
    // Transform href to include tenant segment
    const href = item.href === '/admin'
      ? `/admin/${tenantId}`
      : item.href.startsWith('/admin/')
        ? `/admin/${tenantId}${item.href.slice(6)}`
        : item.href

    const enriched: SidebarItem = { ...item, href }

    // Enrich from BD module metadata
    if (item.modulo_slug) {
      const meta = modulesMeta[item.modulo_slug]
      if (meta) {
        // T4: Apply nombre_display override from BD
        if (meta.nombre_display) {
          enriched.label = meta.nombre_display
        }
        // T5: Proximamente state from BD
        // Rule: post_fase_c OR (activo_global=false AND prioridad_fase_c != 'critico')
        const isProximamente = meta.prioridad_fase_c === 'post_fase_c' ||
          (!meta.activo_global && meta.prioridad_fase_c !== 'critico')
        if (isProximamente) {
          enriched.estado = 'proximamente'
        }
      }
    }

    return enriched
  })
}

export default async function TenantLayout({ children, params }: LayoutProps) {
  const { tenant: tenantId } = await params

  if (!isValidTenantId(tenantId)) {
    redirect('/login?error=tenant-not-found')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: persona } = await supabase
    .from('personas')
    .select('id, nombre, apellido, foto_perfil_url')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  const personaId = persona?.id
  const [userCapabilities, userAttributes, tenantModulos, sidebarModules] = await Promise.all([
    personaId ? getCachedUserCapabilities(personaId) : Promise.resolve([]),
    personaId ? getCachedUserAttributes(personaId, tenantId) : Promise.resolve([]),
    getCachedTenantModulos(tenantId),
    getCachedSidebarModules(),
  ])
  const tenantVerticales = inferVerticalesFromModulos(tenantModulos)
  const visibleSpaces = getVisibleSpaces(userCapabilities, userAttributes)

  // Enrich sidebar items: tenant href, nombre_display, proximamente from BD
  const allItems = enrichSidebarItems(SIDEBAR_CATALOG, tenantId, sidebarModules)

  return (
    <TenantProvider tenantId={tenantId}>
      <NavigationShell
        userEmail={user.email}
        personaId={personaId}
        personaNombre={persona ? `${persona.nombre} ${persona.apellido}` : undefined}
        fotoPerfilUrl={persona?.foto_perfil_url ?? undefined}
        visibleSpaces={visibleSpaces}
        userCapabilities={userCapabilities}
        userAttributes={userAttributes}
        tenantModulos={tenantModulos}
        tenantVerticales={tenantVerticales}
        allItems={allItems}
      >
        {children}
      </NavigationShell>
    </TenantProvider>
  )
}

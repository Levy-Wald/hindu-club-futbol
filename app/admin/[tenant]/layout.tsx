import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCachedTenantModulos, getCachedUserCapabilities, getCachedUserAttributes } from '@/lib/cache'
import { getVisibleSpaces, inferVerticalesFromModulos } from '@/lib/navigation/filter'
import { SIDEBAR_CATALOG } from '@/lib/navigation/sidebar-items'
import { NavigationShell } from '@/components/navigation/NavigationShell'
import { TenantProvider } from '@/lib/contexts/tenant-context'
import { isValidTenantId } from '@/lib/tenant'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
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
  const [userCapabilities, userAttributes, tenantModulos] = await Promise.all([
    personaId ? getCachedUserCapabilities(personaId) : Promise.resolve([]),
    personaId ? getCachedUserAttributes(personaId, tenantId) : Promise.resolve([]),
    getCachedTenantModulos(tenantId),
  ])
  const tenantVerticales = inferVerticalesFromModulos(tenantModulos)
  const visibleSpaces = getVisibleSpaces(userCapabilities, userAttributes)

  // Transform sidebar hrefs to include tenant segment
  const allItems = SIDEBAR_CATALOG.map(item => ({
    ...item,
    href: item.href === '/admin'
      ? `/admin/${tenantId}`
      : item.href.startsWith('/admin/')
        ? `/admin/${tenantId}${item.href.slice(6)}`
        : item.href,
  }))

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

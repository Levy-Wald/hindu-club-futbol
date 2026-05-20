import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCachedTenantModulos, getCachedUserCapabilities, getCachedUserAttributes } from '@/lib/cache'
import { getVisibleSpaces, inferVerticalesFromModulos } from '@/lib/navigation/filter'
import { SIDEBAR_CATALOG } from '@/lib/navigation/sidebar-items'
import { NavigationShell } from '@/components/navigation/NavigationShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    personaId ? getCachedUserAttributes(personaId) : Promise.resolve([]),
    getCachedTenantModulos(),
  ])
  const tenantVerticales = inferVerticalesFromModulos(tenantModulos)
  const visibleSpaces = getVisibleSpaces(userCapabilities, userAttributes)

  return (
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
      allItems={SIDEBAR_CATALOG}
    >
      {children}
    </NavigationShell>
  )
}

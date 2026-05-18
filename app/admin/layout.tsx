import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserCapabilities } from '@/lib/permissions/capabilities'
import { getUserAttributes } from '@/lib/permissions/user-attributes'
import { getVisibleSpaces, inferVerticalesFromModulos } from '@/lib/navigation/filter'
import { SIDEBAR_CATALOG } from '@/lib/navigation/sidebar-items'
import { NavigationShell } from '@/components/navigation/NavigationShell'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

async function getActiveTenantModulos(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('tenant_modulos')
    .select('modulo_slug')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
  return (data ?? []).map((r: { modulo_slug: string }) => r.modulo_slug)
}

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
    .select('id, nombre, apellido')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  const personaId = persona?.id
  const [userCapabilities, userAttributes, tenantModulos] = await Promise.all([
    personaId ? getUserCapabilities(personaId) : Promise.resolve([]),
    personaId ? getUserAttributes(personaId) : Promise.resolve([]),
    getActiveTenantModulos(),
  ])
  const tenantVerticales = inferVerticalesFromModulos(tenantModulos)
  const visibleSpaces = getVisibleSpaces(userCapabilities, userAttributes)

  return (
    <NavigationShell
      userEmail={user.email}
      personaId={personaId}
      personaNombre={persona ? `${persona.nombre} ${persona.apellido}` : undefined}
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

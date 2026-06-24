import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isValidTenantId } from '@/lib/tenant'
import { fetchConfigPublica } from '@/app/(public)/_lib/queries'
import { obtenerConteoNoLeidas } from '@/modules/notificaciones/lib/actions'
import { PortalShell } from './_components/portal-shell'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}

export default async function PortalLayout({ children, params }: LayoutProps) {
  const { tenant: tenantId } = await params
  if (!isValidTenantId(tenantId)) redirect('/login?error=tenant-not-found')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: persona }, config, conteo] = await Promise.all([
    supabase
      .from('personas')
      .select('nombre, apellido')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle(),
    fetchConfigPublica(),
    obtenerConteoNoLeidas(),
  ])

  const saludo = persona ? `Hola, ${persona.nombre}` : 'Hola'
  const clubNombre = (config?.nombre_display as string | undefined) ?? 'Mi club'
  const logoUrl = (config?.logo_url as string | null | undefined) ?? null
  const colorPrimario = (config?.color_primario as string | null | undefined) ?? null

  return (
    <PortalShell
      tenantId={tenantId}
      clubNombre={clubNombre}
      logoUrl={logoUrl}
      colorPrimario={colorPrimario}
      saludo={saludo}
      unreadCount={conteo.cant_total ?? 0}
    >
      {children}
    </PortalShell>
  )
}

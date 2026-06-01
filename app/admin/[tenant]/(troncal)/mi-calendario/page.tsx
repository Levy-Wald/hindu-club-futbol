import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { obtenerEventosPersonales, obtenerEventosCalendario } from '@/modules/eventos/lib/queries'
import { hasCapability } from '@/lib/permissions/capabilities'
import { CalendarioGlobal } from '@/modules/eventos/ui/calendario-global'
import { ToolbarCalendario } from '@/modules/eventos/ui/toolbar-calendario'

export default async function MiCalendarioPage(props: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const { tenant: tenantId } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!persona) redirect('/admin')

  const searchParams = await props.searchParams
  const now = new Date()
  const year = parseInt(searchParams.year ?? String(now.getFullYear()))
  const month = parseInt(searchParams.month ?? String(now.getMonth() + 1))

  const fechaDesde = new Date(year, month - 1, 1)
  fechaDesde.setDate(fechaDesde.getDate() - 7)
  const fechaHasta = new Date(year, month, 0)
  fechaHasta.setDate(fechaHasta.getDate() + 7)

  const service = createServiceRoleClient()

  // Admin de eventos ve todos los eventos del tenant; el resto ve solo los suyos
  // (responsable + equipos donde juega + invitaciones).
  const esAdminEventos = await hasCapability(persona.id, 'eventos.admin')

  const desdeStr = fechaDesde.toISOString().slice(0, 10)
  const hastaStr = fechaHasta.toISOString().slice(0, 10)

  const [eventos, sedesRes, equiposRes, entidadesRes, espaciosRes] = await Promise.all([
    esAdminEventos
      ? obtenerEventosCalendario(tenantId, desdeStr, hastaStr)
      : obtenerEventosPersonales(persona.id, tenantId, desdeStr, hastaStr),
    service.from('sedes').select('id, nombre').eq('tenant_id', tenantId).is('deleted_at', null).order('nombre'),
    service.from('equipos').select('id, nombre').eq('tenant_id', tenantId).is('deleted_at', null).order('nombre'),
    service.from('entidades').select('id, nombre').eq('tenant_id', tenantId).is('deleted_at', null).order('nombre'),
    service.from('espacios').select('id, nombre').eq('tenant_id', tenantId).is('deleted_at', null).order('nombre'),
  ])

  const sedes = (sedesRes.data ?? []) as { id: string; nombre: string }[]
  const equipos = (equiposRes.data ?? []) as { id: string; nombre: string }[]
  const entidades = (entidadesRes.data ?? []) as { id: string; nombre: string }[]
  const espacios = (espaciosRes.data ?? []) as { id: string; nombre: string }[]

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Mi Calendario</h1>
      <p className="text-sm text-muted-foreground">
        {esAdminEventos
          ? 'Todos los eventos del club'
          : 'Tus eventos: donde sos responsable, de tus equipos y donde te invitaron'}
      </p>
      <ToolbarCalendario sedes={sedes} equipos={equipos} entidades={entidades} espacios={espacios} personaId={persona.id} tenantId={tenantId} />
      <CalendarioGlobal
        eventos={eventos}
        year={year}
        month={month}
        tenantId={tenantId}
      />
    </div>
  )
}

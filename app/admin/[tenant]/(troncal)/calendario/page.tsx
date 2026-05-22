import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { obtenerEventosCalendario } from '@/modules/eventos/lib/queries'
import { CalendarioGlobal } from '@/modules/eventos/ui/calendario-global'
import { ToolbarCalendario } from '@/modules/eventos/ui/toolbar-calendario'

export default async function CalendarioPage(props: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ year?: string; month?: string; tipo?: string; modulo?: string; equipo?: string }>
}) {
  const { tenant: tenantId } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const searchParams = await props.searchParams
  const now = new Date()
  const year = parseInt(searchParams.year ?? String(now.getFullYear()))
  const month = parseInt(searchParams.month ?? String(now.getMonth() + 1))

  // Date range: month with 1 week padding
  const fechaDesde = new Date(year, month - 1, 1)
  fechaDesde.setDate(fechaDesde.getDate() - 7)
  const fechaHasta = new Date(year, month, 0)
  fechaHasta.setDate(fechaHasta.getDate() + 7)

  const filtros = {
    tipo_evento_slug: searchParams.tipo || undefined,
    modulo_origen: searchParams.modulo || undefined,
    equipo_id: searchParams.equipo || undefined,
  }

  const service = createServiceRoleClient()

  const [eventos, sedesRes, equiposRes] = await Promise.all([
    obtenerEventosCalendario(
      tenantId,
      fechaDesde.toISOString().slice(0, 10),
      fechaHasta.toISOString().slice(0, 10),
      filtros,
    ),
    service.from('sedes').select('id, nombre').eq('tenant_id', tenantId).is('deleted_at', null).order('nombre'),
    service.from('equipos').select('id, nombre').eq('tenant_id', tenantId).is('deleted_at', null).order('nombre'),
  ])

  const sedes = (sedesRes.data ?? []) as { id: string; nombre: string }[]
  const equipos = (equiposRes.data ?? []) as { id: string; nombre: string }[]

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Calendario</h1>
      <ToolbarCalendario sedes={sedes} equipos={equipos} tenantId={tenantId} />
      <CalendarioGlobal
        eventos={eventos}
        year={year}
        month={month}
        tenantId={tenantId}
      />
    </div>
  )
}

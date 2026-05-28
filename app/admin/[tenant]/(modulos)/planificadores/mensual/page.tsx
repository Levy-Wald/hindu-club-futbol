import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { canVerPlanificador } from '@/modules/planificadores/lib/permisos'
import { obtenerEventosPorMes } from '@/modules/planificadores/lib/queries'
import { CalendarioMensual } from '@/modules/planificadores/ui/calendario-mensual'
import { TogglePlanificador } from '@/modules/planificadores/ui/toggle-planificador'

export default async function PlanificadorMensualPage(props: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!persona) redirect('/admin')

  const puede = await canVerPlanificador(persona.id)
  if (!puede) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-500 text-sm">No tenés permiso para acceder al planificador.</p>
      </div>
    )
  }

  const searchParams = await props.searchParams
  const now = new Date()
  const year = parseInt(searchParams.year ?? String(now.getFullYear()))
  const month = parseInt(searchParams.month ?? String(now.getMonth() + 1))
  const tenant_id = persona.tenant_id ?? TENANT_ID
  const service = createServiceRoleClient()

  const [eventos, sedesResult, equiposResult, entidadesResult, espaciosResult] = await Promise.all([
    obtenerEventosPorMes(year, month, tenant_id),
    service.from('sedes').select('id, nombre').eq('tenant_id', tenant_id).is('deleted_at', null).order('nombre'),
    service.from('equipos').select('id, nombre').eq('tenant_id', tenant_id).is('deleted_at', null).order('nombre'),
    service.from('entidades').select('id, nombre').eq('tenant_id', tenant_id).is('deleted_at', null).order('nombre'),
    service.from('espacios').select('id, nombre').eq('tenant_id', tenant_id).is('deleted_at', null).order('nombre'),
  ])

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Planificador mensual</h1>
        <TogglePlanificador vistaActual="mensual" />
      </div>
      <CalendarioMensual
        eventos={eventos}
        year={year}
        month={month}
        personaId={persona.id}
        tenantId={tenant_id}
        sedes={sedesResult.data ?? []}
        equipos={(equiposResult.data ?? []) as { id: string; nombre: string }[]}
        entidades={(entidadesResult.data ?? []) as { id: string; nombre: string }[]}
        espacios={(espaciosResult.data ?? []) as { id: string; nombre: string }[]}
      />
    </div>
  )
}

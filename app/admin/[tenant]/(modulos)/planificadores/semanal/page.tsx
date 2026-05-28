import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { canVerPlanificador } from '@/modules/planificadores/lib/permisos'
import { obtenerEventosPorSemana } from '@/modules/planificadores/lib/queries'
import { CalendarioSemanal } from '@/modules/planificadores/ui/calendario-semanal'
import { TogglePlanificador } from '@/modules/planificadores/ui/toggle-planificador'
import { startOfWeek, format } from 'date-fns'

export default async function PlanificadorSemanalPage(props: {
  searchParams: Promise<{ fecha?: string }>
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
  const fechaInicio = searchParams.fecha
    ? startOfWeek(new Date(searchParams.fecha + 'T12:00:00'), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 })

  const fechaInicioStr = format(fechaInicio, 'yyyy-MM-dd')
  const tenant_id = persona.tenant_id ?? TENANT_ID
  const service = createServiceRoleClient()

  const [eventos, sedesResult, equiposResult, entidadesResult, espaciosResult] = await Promise.all([
    obtenerEventosPorSemana(fechaInicio, tenant_id),
    service.from('sedes').select('id, nombre').eq('tenant_id', tenant_id).is('deleted_at', null).order('nombre'),
    service.from('equipos').select('id, nombre').eq('tenant_id', tenant_id).is('deleted_at', null).order('nombre'),
    service.from('entidades').select('id, nombre').eq('tenant_id', tenant_id).is('deleted_at', null).order('nombre'),
    service.from('espacios').select('id, nombre').eq('tenant_id', tenant_id).is('deleted_at', null).order('nombre'),
  ])

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Planificador semanal</h1>
        <TogglePlanificador vistaActual="semanal" />
      </div>
      <CalendarioSemanal
        eventos={eventos}
        fechaInicioStr={fechaInicioStr}
        personaId={persona.id}
        tenantId={tenant_id}
        sedes={sedesResult.data ?? []}
        equipos={equiposResult.data ?? []}
        entidades={(entidadesResult.data ?? []) as { id: string; nombre: string }[]}
        espacios={(espaciosResult.data ?? []) as { id: string; nombre: string }[]}
      />
    </div>
  )
}

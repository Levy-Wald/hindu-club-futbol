import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canVerPlanificador } from '@/modules/planificadores/lib/permisos'
import { obtenerEventosPorSemana } from '@/modules/planificadores/lib/queries'
import { CalendarioSemanal } from '@/modules/planificadores/ui/calendario-semanal'
import { TogglePlanificador } from '@/modules/planificadores/ui/toggle-planificador'
import { startOfWeek } from 'date-fns'

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
    ? startOfWeek(new Date(searchParams.fecha + 'T00:00:00'), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 })

  const eventos = await obtenerEventosPorSemana(fechaInicio, persona.tenant_id)

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Planificador semanal</h1>
        <TogglePlanificador vistaActual="semanal" />
      </div>
      <CalendarioSemanal
        eventos={eventos}
        fechaInicio={fechaInicio}
        personaId={persona.id}
        tenantId={persona.tenant_id}
      />
    </div>
  )
}

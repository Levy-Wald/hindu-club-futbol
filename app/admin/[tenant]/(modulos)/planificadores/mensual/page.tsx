import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  const eventos = await obtenerEventosPorMes(year, month, persona.tenant_id)

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
        tenantId={persona.tenant_id}
      />
    </div>
  )
}

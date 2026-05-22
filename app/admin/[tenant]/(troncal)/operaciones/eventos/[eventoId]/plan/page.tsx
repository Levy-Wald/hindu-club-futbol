import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { PantallaPlan } from '@/modules/entrenamientos/ui/pantalla-plan'

type Props = {
  params: Promise<{ eventoId: string }>
}

export default async function PlanEntrenamientoPage({ params }: Props) {
  const { eventoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) redirect('/admin')

  const tenant_id = persona.tenant_id ?? TENANT_ID

  // Verificar que el evento es de tipo entrenamiento
  const { data: evento } = await supabase
    .from('eventos')
    .select('id, titulo, tipo_evento_slug')
    .eq('id', eventoId)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!evento) redirect('/admin/operaciones/eventos')

  if (evento.tipo_evento_slug !== 'entrenamiento') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-500 text-sm">Este evento no es un entrenamiento.</p>
      </div>
    )
  }

  return (
    <PantallaPlan
      eventoId={eventoId}
      eventoTitulo={evento.titulo}
      personaId={persona.id}
      tenantId={tenant_id}
    />
  )
}

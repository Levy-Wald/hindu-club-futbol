import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { PantallaAmistoso } from '@/modules/amistosos/ui/pantalla-amistoso'

type Props = {
  params: Promise<{ eventoId: string }>
}

export default async function AmistosoPage({ params }: Props) {
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

  // Verify event is amistoso
  const { data: evento } = await supabase
    .from('eventos')
    .select('id, tipo_evento_slug')
    .eq('id', eventoId)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!evento) redirect('/admin/operaciones/eventos')

  if (evento.tipo_evento_slug !== 'amistoso') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-500 text-sm">Este evento no es un amistoso.</p>
      </div>
    )
  }

  return (
    <PantallaAmistoso
      eventoId={eventoId}
      personaId={persona.id}
      tenantId={tenant_id}
    />
  )
}

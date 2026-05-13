import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { PantallaTactica } from '@/modules/tactica/ui/pantalla-tactica'

type Props = {
  params: Promise<{ eventoId: string }>
}

export default async function TacticaPage({ params }: Props) {
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

  // Verify event is partido or amistoso
  const { data: evento } = await supabase
    .from('eventos')
    .select('id, tipo_evento_slug')
    .eq('id', eventoId)
    .eq('tenant_id', tenant_id)
    .eq('activo', true)
    .maybeSingle()

  if (!evento) redirect('/admin/operaciones/eventos')

  if (evento.tipo_evento_slug !== 'partido' && evento.tipo_evento_slug !== 'amistoso') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-500 text-sm">La tactica solo esta disponible para partidos y amistosos.</p>
      </div>
    )
  }

  return (
    <PantallaTactica
      eventoId={eventoId}
      personaId={persona.id}
      tenantId={tenant_id}
    />
  )
}

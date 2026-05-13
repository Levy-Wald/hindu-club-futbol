import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { PantallaDetalleTorneo } from '@/modules/torneos/ui/pantalla-detalle'

export default async function TorneoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <PantallaDetalleTorneo
        personaId={persona.id}
        tenantId={tenant_id}
        torneoId={id}
      />
    </div>
  )
}

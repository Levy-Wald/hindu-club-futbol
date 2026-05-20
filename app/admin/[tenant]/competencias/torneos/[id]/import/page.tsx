import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { PantallaImportCSV } from '@/modules/torneos/ui/pantalla-import-csv'

export default async function ImportCSVPage({
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

  // Get torneo name
  const sr = createServiceRoleClient()
  const { data: torneo } = await sr
    .from('torneos')
    .select('nombre')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!torneo) redirect('/admin/competencias/torneos')

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <PantallaImportCSV
        torneoId={id}
        torneoNombre={torneo.nombre}
        tenantId={tenant_id}
      />
    </div>
  )
}

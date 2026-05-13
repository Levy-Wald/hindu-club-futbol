import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { PantallaFixture } from '@/modules/torneos/ui/pantalla-fixture'

export default async function FixturePage({
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

  // Get torneo with formato
  const sr = createServiceRoleClient()
  const { data: torneo } = await sr
    .from('torneos')
    .select('nombre, formato')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!torneo) redirect('/admin/competencias/torneos')

  // Get categorias
  const { data: categorias } = await sr
    .from('torneo_categorias')
    .select('id, nombre')
    .eq('torneo_id', id)
    .order('orden')

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <PantallaFixture
        torneoId={id}
        torneoNombre={torneo.nombre}
        formato={torneo.formato}
        categorias={(categorias ?? []).map((c) => ({ id: c.id, nombre: c.nombre }))}
      />
    </div>
  )
}

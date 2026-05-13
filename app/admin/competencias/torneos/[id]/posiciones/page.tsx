import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { PantallaPosiciones } from '@/modules/torneos/ui/pantalla-posiciones'

export default async function PosicionesPage({
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
  const sr = createServiceRoleClient()

  const { data: torneo } = await sr
    .from('torneos')
    .select('nombre')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!torneo) redirect('/admin/competencias/torneos')

  const { data: categorias } = await sr
    .from('torneo_categorias')
    .select('id, nombre')
    .eq('torneo_id', id)
    .order('orden')

  // Get equipo IDs propios for highlighting
  const { data: equiposPropios } = await sr
    .from('equipos')
    .select('id')
    .eq('tenant_id', tenant_id)

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <PantallaPosiciones
        torneoId={id}
        torneoNombre={torneo.nombre}
        categorias={(categorias ?? []).map((c) => ({ id: c.id, nombre: c.nombre }))}
        equiposPropiosIds={(equiposPropios ?? []).map((e) => e.id)}
      />
    </div>
  )
}

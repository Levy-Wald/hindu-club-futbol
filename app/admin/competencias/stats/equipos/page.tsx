import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { PantallaStatsEquipos } from '@/modules/torneos/ui/pantalla-stats-equipos'

export default async function StatsEquiposPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const { data: torneos } = await sr
    .from('torneos')
    .select('id, nombre')
    .eq('tenant_id', tenant_id)
    .eq('activo', true)
    .order('nombre')

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <PantallaStatsEquipos torneos={(torneos ?? []).map((t) => ({ id: t.id, nombre: t.nombre }))} />
    </div>
  )
}

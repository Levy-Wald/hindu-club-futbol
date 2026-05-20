import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canUsarPantallaAcceso } from '@/modules/acceso/lib/permisos'
import { PantallaAcceso } from '@/modules/acceso/ui/pantalla-acceso'

export default async function AccesoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: persona } = await supabase
    .from('personas')
    .select('id, nombre, apellido, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) redirect('/admin')

  const puede = await canUsarPantallaAcceso(persona.id)
  if (!puede) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-500 text-sm">No tenés permiso para usar el control de acceso.</p>
      </div>
    )
  }

  const guardiaNombre = `${persona.apellido}, ${persona.nombre}`

  return <PantallaAcceso guardiaNombre={guardiaNombre} />
}

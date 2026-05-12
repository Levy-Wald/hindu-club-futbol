import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAdministrarNominas } from '@/modules/nominas_externas/lib/permisos'
import { PantallaListado } from '@/modules/nominas_externas/ui/admin/pantalla-listado'

export default async function NominasExternasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // AP-001 ✓: personas tiene deleted_at
  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) redirect('/admin')

  const puede = await canAdministrarNominas(persona.id)
  if (!puede) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-500 text-sm">No tenés permiso para administrar nóminas externas.</p>
      </div>
    )
  }

  return <PantallaListado tenantId={persona.tenant_id} />
}

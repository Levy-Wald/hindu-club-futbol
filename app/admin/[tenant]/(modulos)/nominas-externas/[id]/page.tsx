import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAdministrarNominas } from '@/modules/nominas_externas/lib/permisos'
import { obtenerNominaConItems } from '@/modules/nominas_externas/lib/queries'
import { PantallaDetalle } from '@/modules/nominas_externas/ui/admin/pantalla-detalle'

type Props = { params: Promise<{ id: string }> }

export default async function NominaDetallePage({ params }: Props) {
  const { id } = await params
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
  if (!puede) redirect('/admin/nominas-externas')

  const data = await obtenerNominaConItems(id, persona.tenant_id)
  if (!data) redirect('/admin/nominas-externas')

  return <PantallaDetalle nomina={data.nomina} items={data.items} />
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { canCargarResultados } from '@/modules/torneos/lib/permisos'
import { PantallaCargarResultado } from '@/modules/torneos/ui/pantalla-cargar-resultado'

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const puede = await canCargarResultados(persona.id)
  if (!puede) redirect('/admin')

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <PantallaCargarResultado eventoId={id} />
    </div>
  )
}

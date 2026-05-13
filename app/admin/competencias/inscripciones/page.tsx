import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { PantallaInscripciones } from '@/modules/torneos/ui/pantalla-inscripciones'

export default async function InscripcionesPage() {
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
      <PantallaInscripciones
        personaId={persona.id}
        tenantId={tenant_id}
      />
    </div>
  )
}

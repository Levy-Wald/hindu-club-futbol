import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PantallaPerfilJugador } from '@/modules/torneos/ui/pantalla-perfil-jugador'

export default async function PerfilJugadorPage({
  params,
}: {
  params: Promise<{ persona_id: string }>
}) {
  const { persona_id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <PantallaPerfilJugador personaId={persona_id} />
    </div>
  )
}

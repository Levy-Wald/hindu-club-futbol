import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { NotificacionesClient } from './_components/notificaciones-client'

export default async function NotificacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold sm:text-2xl">Notificaciones</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Debes iniciar sesion para ver tus notificaciones.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold sm:text-2xl">Notificaciones</h1>
        <Card>
          <CardContent className="flex flex-col items-center py-8">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No se encontro tu perfil vinculado.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <NotificacionesClient />
}

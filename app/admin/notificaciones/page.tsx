import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Mail, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { NotificacionesClient } from './_components/notificaciones-client'

export default async function NotificacionesPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
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

  // Obtener persona_id del usuario logueado
  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold sm:text-2xl">Notificaciones</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No se encontro tu perfil de persona vinculado.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Obtener mensajes/notificaciones para esta persona
  const { data } = await supabase
    .from('com_mensajes')
    .select('id, asunto, cuerpo, tipo, leido, leido_at, created_at')
    .eq('destinatario_id', persona.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  const mensajes = (data ?? []) as Array<{
    id: string
    asunto: string
    cuerpo: string
    tipo: string
    leido: boolean
    leido_at: string | null
    created_at: string
  }>

  const noLeidos = mensajes.filter((m) => !m.leido).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            Tus mensajes y notificaciones del club
          </p>
        </div>
        {noLeidos > 0 && (
          <Badge variant="default" className="bg-brand-500">
            {noLeidos} sin leer
          </Badge>
        )}
      </div>

      <NotificacionesClient mensajes={mensajes} personaId={persona.id} />
    </div>
  )
}

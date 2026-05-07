import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Send, Clock, AlertTriangle, CheckCircle2, FileText, MailPlus } from 'lucide-react'
import Link from 'next/link'
import { fetchSolicitudesPendientes } from './_lib/queries'
import { SolicitudesPanel } from './_components/solicitudes-panel'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export default async function ComunicacionesDashboardPage() {
  const supabase = await createClient()
  const hoy = new Date().toISOString().split('T')[0]

  // Solicitudes existentes
  const solicitudes = await fetchSolicitudesPendientes()

  // Stats de envios (com_envios puede no existir aun, manejamos error)
  const [enviadosHoyRes, pendientesRes, falladosRes, entregadosRes] = await Promise.all([
    supabase
      .from('com_envios')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('estado', 'enviado')
      .gte('created_at', hoy + 'T00:00:00'),
    supabase
      .from('com_envios')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('estado', 'pendiente'),
    supabase
      .from('com_envios')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('estado', 'fallado'),
    supabase
      .from('com_envios')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .in('estado', ['enviado', 'entregado']),
  ])

  const enviadosHoy = enviadosHoyRes.count ?? 0
  const pendientes = pendientesRes.count ?? 0
  const fallados = falladosRes.count ?? 0
  const entregados = entregadosRes.count ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Comunicaciones</h1>
        <p className="text-sm text-muted-foreground">
          Plantillas, envios y notificaciones del club
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-[#3A8FC5]/10 p-2">
              <Send className="h-5 w-5 text-[#3A8FC5]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{enviadosHoy}</p>
              <p className="text-xs text-muted-foreground">Enviados hoy</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-[#F2C531]/10 p-2">
              <Clock className="h-5 w-5 text-[#F2C531]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendientes}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-red-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{fallados}</p>
              <p className="text-xs text-muted-foreground">Fallados</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-emerald-500/10 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{entregados}</p>
              <p className="text-xs text-muted-foreground">Entregados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Solicitudes pendientes */}
      <SolicitudesPanel solicitudes={solicitudes as never[]} />

      {/* Quick actions + navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones rapidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button render={<Link href="/admin/comunicaciones/plantillas" />}>
            <FileText className="h-4 w-4" />
            Plantillas
          </Button>
          <Button variant="secondary" render={<Link href="/admin/comunicaciones/envios" />}>
            <Send className="h-4 w-4" />
            Historial de envios
          </Button>
          <Button variant="outline" render={<Link href="/admin/notificaciones" />}>
            <MailPlus className="h-4 w-4" />
            Notificaciones
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

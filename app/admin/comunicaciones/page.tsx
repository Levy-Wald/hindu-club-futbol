import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'
import { fetchSolicitudesPendientes } from './_lib/queries'
import { SolicitudesPanel } from './_components/solicitudes-panel'

export default async function ComunicacionesPage() {
  const solicitudes = await fetchSolicitudesPendientes()

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Comunicaciones</h1>

      <SolicitudesPanel solicitudes={solicitudes as never[]} />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">
            Proximamente: envio masivo de emails y WhatsApp, templates, historial.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Este modulo esta en desarrollo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

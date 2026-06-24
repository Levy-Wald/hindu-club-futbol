import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Clock, MapPin, Users, CalendarDays } from 'lucide-react'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { fetchEventoDetalle } from './_lib/queries'
import { ResponderInvitacion } from './_components/responder-invitacion'

const CONV_LABEL: Record<string, string> = { titular: 'Titular', suplente: 'Suplente', convocado: 'Convocado' }

interface PageProps {
  params: Promise<{ tenant: string; eventoId: string }>
}

export default async function PortalEventoPage({ params }: PageProps) {
  const { tenant, eventoId } = await params
  const personaId = await getCurrentPersonaId()
  const ev = personaId ? await fetchEventoDetalle(eventoId, personaId) : null
  if (!ev) notFound()

  const fecha = ev.fecha_inicio ? new Date(ev.fecha_inicio + 'T00:00:00') : null
  const lugar = [ev.cancha_nombre, ev.sede_nombre].filter(Boolean).join(' · ') || ev.lugar_encuentro

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Link href={`/portal/${tenant}/agenda`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold">{ev.titulo ?? 'Evento'}</h1>
          <Badge variant="outline" className="capitalize mt-1">{ev.tipo_evento_slug.replace(/_/g, ' ')}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {fecha && (
            <div className="flex items-center gap-3 p-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm capitalize">{fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          )}
          {ev.hora_inicio && (
            <div className="flex items-center gap-3 p-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {ev.hora_inicio.slice(0, 5)}{ev.hora_fin ? `–${ev.hora_fin.slice(0, 5)}` : ''}
                {ev.hora_citacion ? ` · citación ${ev.hora_citacion.slice(0, 5)}` : ''}
              </span>
            </div>
          )}
          {lugar && (
            <div className="flex items-center gap-3 p-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <span>{lugar}</span>
                {ev.sede_direccion && <span className="block text-xs text-muted-foreground">{ev.sede_direccion}</span>}
              </div>
            </div>
          )}
          {ev.equipo_nombre && (
            <div className="flex items-center gap-3 p-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{ev.equipo_nombre}</span>
              {ev.mi_convocatoria && <Badge variant="default" className="ml-auto">{CONV_LABEL[ev.mi_convocatoria] ?? ev.mi_convocatoria}</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {ev.descripcion && <p className="text-sm text-muted-foreground border rounded-md p-3">{ev.descripcion}</p>}

      {/* Invitación */}
      {ev.mi_invitacion_id && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1">¿Vas a ir?</p>
          <ResponderInvitacion invitadoId={ev.mi_invitacion_id} estadoInicial={ev.mi_invitacion_estado} />
        </div>
      )}
    </div>
  )
}

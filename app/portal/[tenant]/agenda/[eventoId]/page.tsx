import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Clock, MapPin, Users, CalendarDays, Navigation, Headset } from 'lucide-react'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { fetchEventoDetalle } from './_lib/queries'
import { ResponderInvitacion } from './_components/responder-invitacion'
import { ResponderConvocatoria } from './_components/responder-convocatoria'
import { ContactoBotones } from '../../_components/contacto-botones'

const CONV_LABEL: Record<string, string> = { titular: 'Titular', suplente: 'Suplente', convocado: 'Convocado' }
const TIPO_LABEL: Record<string, string> = { partido: 'Partido', amistoso: 'Amistoso', entrenamiento: 'Entrenamiento', reunion: 'Reunión' }

function mapaHref(mapaUrl: string | null, direccion: string | null): string | null {
  if (mapaUrl) return mapaUrl
  if (direccion) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`
  return null
}

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
  const mapa = mapaHref(ev.sede_mapa_url, ev.sede_direccion)
  const titulares = ev.convocados.filter((c) => c.estado === 'titular')
  const suplentes = ev.convocados.filter((c) => c.estado === 'suplente')
  const otros = ev.convocados.filter((c) => c.estado !== 'titular' && c.estado !== 'suplente')

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Link href={`/portal/${tenant}/agenda`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold">{ev.titulo ?? (TIPO_LABEL[ev.tipo_evento_slug] ?? 'Evento')}</h1>
          <Badge variant="outline" className="capitalize mt-1">{TIPO_LABEL[ev.tipo_evento_slug] ?? ev.tipo_evento_slug.replace(/_/g, ' ')}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {fecha && (
            <div className="flex items-center gap-3 p-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm capitalize">{fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
              <div className="text-sm flex-1 min-w-0">
                <span>{lugar}</span>
                {ev.sede_direccion && <span className="block text-xs text-muted-foreground">{ev.sede_direccion}</span>}
              </div>
              {mapa && (
                <a href={mapa} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Navigation className="h-3.5 w-3.5" /> Cómo llegar
                </a>
              )}
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

      {ev.descripcion && <p className="text-sm text-muted-foreground border rounded-md p-3 whitespace-pre-line">{ev.descripcion}</p>}

      {/* Convocatoria (partido) — confirmar disponibilidad al cuerpo técnico */}
      {ev.mi_convocatoria && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1">Tu disponibilidad (podés cambiarla cuando quieras)</p>
          <ResponderConvocatoria
            eventoId={ev.id}
            estadoConvocatoria={ev.mi_convocatoria}
            respuestaInicial={ev.mi_respuesta}
            motivoInicial={ev.mi_motivo_respuesta}
          />
        </div>
      )}

      {/* Invitación — se puede cambiar la respuesta en cualquier momento */}
      {ev.mi_invitacion_id && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1">¿Vas a ir? (podés cambiar tu respuesta cuando quieras)</p>
          <ResponderInvitacion invitadoId={ev.mi_invitacion_id} estadoInicial={ev.mi_invitacion_estado} />
        </div>
      )}

      {/* Responsables del evento — contacto */}
      {ev.responsables.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-1">
            <Headset className="h-3.5 w-3.5" /> Responsables
          </p>
          <Card>
            <CardContent className="p-0 divide-y">
              {ev.responsables.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5">
                  <span className="text-sm flex-1 truncate">{r.apellido}, {r.nombre}</span>
                  <ContactoBotones whatsapp={r.whatsapp} telefono={r.telefono} email={r.email}
                    personaId={r.persona_id} nombre={`${r.nombre} ${r.apellido}`}
                    mensajeWhatsapp={`Hola ${r.nombre}, te consulto por el evento "${ev.titulo ?? 'del club'}".`} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Convocados / participantes */}
      {ev.convocados.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Convocados ({ev.convocados.length})
          </p>
          <Card>
            <CardContent className="p-3 space-y-3">
              {titulares.length > 0 && <ConvocadoGrupo titulo="Titulares" items={titulares} variant="default" />}
              {suplentes.length > 0 && <ConvocadoGrupo titulo="Suplentes" items={suplentes} variant="secondary" />}
              {otros.length > 0 && <ConvocadoGrupo titulo="Convocados" items={otros} variant="outline" />}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function ConvocadoGrupo({ titulo, items, variant }: { titulo: string; items: { nombre: string; apellido: string }[]; variant: 'default' | 'secondary' | 'outline' }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{titulo} ({items.length})</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((c, i) => (
          <Badge key={i} variant={variant} className="font-normal">{c.apellido}, {c.nombre}</Badge>
        ))}
      </div>
    </div>
  )
}

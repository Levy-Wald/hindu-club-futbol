import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Navigation, Clock, Phone, Mail, LandPlot, Lightbulb, Home, Users } from 'lucide-react'
import { fetchSedeDetalle } from '../_lib/queries'

interface PageProps {
  params: Promise<{ tenant: string; sedeId: string }>
}

function ars(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default async function PortalSedePage({ params }: PageProps) {
  const { tenant, sedeId } = await params
  const sede = await fetchSedeDetalle(sedeId)
  if (!sede) notFound()

  const base = `/portal/${tenant}`
  const mapa = sede.lat != null && sede.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${sede.lat},${sede.lng}`
    : sede.direccion
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sede.direccion)}`
      : null

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Link href={`${base}/club`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold">{sede.nombre}</h1>
          {sede.tipo && <Badge variant="outline" className="capitalize mt-1">{sede.tipo}</Badge>}
        </div>
      </div>

      {/* Ubicación y contacto de la sede */}
      <Card>
        <CardContent className="p-0 divide-y">
          {sede.direccion && (
            <div className="flex items-center gap-3 p-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1">{sede.direccion}</span>
              {mapa && (
                <a href={mapa} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Navigation className="h-3.5 w-3.5" /> Cómo llegar
                </a>
              )}
            </div>
          )}
          {sede.horario_atencion && (
            <div className="flex items-center gap-3 p-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{sede.horario_atencion}</span>
            </div>
          )}
          {sede.telefono && (
            <a href={`tel:${sede.telefono.replace(/\D/g, '')}`} className="flex items-center gap-3 p-3 hover:bg-muted/40">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-primary">{sede.telefono}</span>
            </a>
          )}
          {sede.email && (
            <a href={`mailto:${sede.email}`} className="flex items-center gap-3 p-3 hover:bg-muted/40">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-primary truncate">{sede.email}</span>
            </a>
          )}
        </CardContent>
      </Card>

      {/* Espacios de la sede */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-1">
          <LandPlot className="h-3.5 w-3.5" /> Espacios ({sede.canchas.length})
        </p>
        {sede.canchas.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Esta sede no tiene espacios cargados.</CardContent></Card>
        ) : (
          sede.canchas.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {[c.tipo, c.superficie].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {c.precio_alquiler_hora != null && c.precio_alquiler_hora > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums">{ars(c.precio_alquiler_hora)}</p>
                      <p className="text-[10px] text-muted-foreground">por hora</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {c.techada && <Badge variant="secondary" className="text-[10px] gap-1"><Home className="h-3 w-3" /> Techada</Badge>}
                  {c.iluminada && <Badge variant="secondary" className="text-[10px] gap-1"><Lightbulb className="h-3 w-3" /> Iluminada</Badge>}
                  {c.capacidad_jugadores && <Badge variant="outline" className="text-[10px] gap-1"><Users className="h-3 w-3" /> {c.capacidad_jugadores} jug.</Badge>}
                </div>

                {c.disponible_para_alquiler && (
                  <Link href={`${base}/reservas?cancha=${c.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      <LandPlot className="h-4 w-4 mr-1.5" /> Reservar este espacio
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

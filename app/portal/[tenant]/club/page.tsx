import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, ExternalLink, Building2 } from 'lucide-react'
import { fetchSedesClub } from './_lib/queries'

export default async function PortalClubPage() {
  const sedes = await fetchSedesClub()

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">El club</h1>

      {sedes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-3 opacity-40" />
          No hay sedes cargadas.
        </CardContent></Card>
      ) : (
        sedes.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="font-bold">{s.nombre}</p>
                {s.direccion && (
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground flex-1">{s.direccion}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.direccion)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline shrink-0"
                    >
                      Maps <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
              {s.espacios.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                  {s.espacios.map((e, i) => (
                    <Badge key={i} variant="secondary" className="capitalize">
                      {e.nombre}{e.tipo ? ` · ${e.tipo}` : ''}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Building2, ChevronRight, LandPlot } from 'lucide-react'
import { TENANT_ID } from '@/lib/tenant'
import { fetchSedesClub } from './_lib/queries'

export default async function PortalClubPage() {
  const sedes = await fetchSedesClub()
  const base = `/portal/${TENANT_ID}`

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">El club y sus sedes</h1>

      {sedes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-3 opacity-40" />
          No hay sedes cargadas.
        </CardContent></Card>
      ) : (
        sedes.map((s) => (
          <Link key={s.id} href={`${base}/club/${s.id}`} className="block">
            <Card className="hover:bg-muted/40 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">{s.nombre}</p>
                    {s.direccion && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{s.direccion}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
                {s.espacios.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-2 border-t text-xs text-muted-foreground">
                    <LandPlot className="h-3.5 w-3.5" /> {s.espacios.length} espacio{s.espacios.length !== 1 ? 's' : ''}
                    <span className="ml-auto flex flex-wrap gap-1 justify-end">
                      {s.espacios.slice(0, 3).map((e, i) => (
                        <Badge key={i} variant="secondary" className="capitalize text-[10px]">{e.nombre}</Badge>
                      ))}
                      {s.espacios.length > 3 && <Badge variant="outline" className="text-[10px]">+{s.espacios.length - 3}</Badge>}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  )
}

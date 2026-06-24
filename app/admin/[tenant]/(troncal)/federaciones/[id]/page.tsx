import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, ExternalLink, Building2 } from 'lucide-react'
import { fetchFederacionDetalle } from '../_lib/queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FederacionDetallePage({ params }: PageProps) {
  const { id } = await params

  let detalle
  try {
    detalle = await fetchFederacionDetalle(id)
  } catch {
    notFound()
  }

  const { federacion, equipos } = detalle
  const disciplinas = [...new Set(equipos.map((e) => e.disciplina_slug).filter(Boolean))] as string[]

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/admin/federaciones">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{federacion.nombre}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline">federación</Badge>
            {federacion.cuit && <span className="text-sm text-muted-foreground">CUIT {federacion.cuit}</span>}
            {federacion.sitio_web && (
              <a href={federacion.sitio_web} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Sitio <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <Link href={`/admin/entidades/${federacion.id}`}>
          <Button variant="outline" size="sm">
            <Building2 className="h-4 w-4 mr-1" /> Ver como entidad
          </Button>
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Equipos afiliados</p>
          <p className="text-lg font-bold tabular-nums">{equipos.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Disciplinas</p>
          <p className="text-lg font-bold tabular-nums">{disciplinas.length}</p>
        </div>
        <div className="rounded-lg border p-3 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Contacto</p>
          <p className="text-sm font-medium truncate">{federacion.email ?? federacion.telefono ?? '—'}</p>
        </div>
      </div>

      {disciplinas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {disciplinas.map((d) => <Badge key={d} variant="secondary" className="capitalize">{d}</Badge>)}
        </div>
      )}

      {/* Equipos */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Equipos afiliados</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Torneo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={99} className="text-center text-muted-foreground py-6">
                      Esta federación no tiene equipos del club afiliados.
                    </TableCell>
                  </TableRow>
                ) : (
                  equipos.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Link href={`/admin/equipos/${e.id}`} className="font-medium hover:underline">{e.nombre}</Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">{e.disciplina_slug ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{e.categoria ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{e.torneo ?? '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

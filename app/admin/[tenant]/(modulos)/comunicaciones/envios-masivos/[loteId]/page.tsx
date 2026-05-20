import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { obtenerEnviosDelLote } from '@/modules/comunicaciones/lib/queries'

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function DetalleLotePage({
  params,
}: {
  params: Promise<{ loteId: string }>
}) {
  const { loteId } = await params
  const envios = await obtenerEnviosDelLote(loteId)

  if (envios.length === 0) notFound()

  const total = envios.length
  const enviados = envios.filter(e => e.estado === 'enviado').length
  const fallados = envios.filter(e => e.estado === 'fallado').length
  const meta = envios[0].metadata as Record<string, unknown> | null
  const plantillaSlug = envios[0].plantilla_slug ?? '—'
  const canal = envios[0].canal
  const segmentoTipo = (meta?.segmento as Record<string, unknown>)?.tipo as string ?? '—'

  return (
    <div className="space-y-6" data-testid="lote-detalle">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/admin/comunicaciones" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Detalle del lote</h1>
          <p className="text-sm text-muted-foreground font-mono">{loteId}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success-600" data-testid="enviados-count">{enviados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Fallados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-error-600">{fallados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-normal">Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Badge variant="outline">{plantillaSlug}</Badge>
            <div className="flex gap-1">
              <Badge variant="secondary">{canal}</Badge>
              <Badge variant="secondary">{segmentoTipo}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Envios table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Persona</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envios.map(e => (
                  <TableRow key={e.id} data-testid="envio-row">
                    <TableCell className="font-medium">
                      {e.persona ? `${e.persona.nombre} ${e.persona.apellido}` : '—'}
                    </TableCell>
                    <TableCell>
                      {e.estado === 'enviado' ? (
                        <Badge variant="outline" className="border-success-500 text-success-700 bg-success-50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          enviado
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          {e.estado}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {e.error_mensaje || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                      {formatFecha(e.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

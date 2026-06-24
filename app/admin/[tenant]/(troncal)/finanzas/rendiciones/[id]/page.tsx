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
import { ArrowLeft } from 'lucide-react'
import { fetchRendicionDetalle } from '../_lib/queries'
import { RendicionAcciones } from './_components/rendicion-acciones'

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  borrador: 'secondary',
  presentada: 'outline',
  aprobada: 'default',
  rechazada: 'destructive',
  liquidada: 'default',
}

function ars(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RendicionDetallePage({ params }: PageProps) {
  const { id } = await params

  let detalle
  try {
    detalle = await fetchRendicionDetalle(id)
  } catch {
    notFound()
  }

  const { rendicion, items } = detalle
  const solicitante = rendicion.solicitante as { nombre: string; apellido: string } | null
  const centro = rendicion.centro as { nombre: string } | null
  const aprobador = rendicion.aprobador as { nombre: string; apellido: string } | null

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/admin/finanzas/rendiciones">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Rendición {rendicion.numero}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant={ESTADO_VARIANT[rendicion.estado] ?? 'secondary'}>{rendicion.estado}</Badge>
            {solicitante && <span className="text-sm text-muted-foreground">{solicitante.apellido}, {solicitante.nombre}</span>}
            {centro && <span className="text-sm text-muted-foreground">· {centro.nombre}</span>}
          </div>
        </div>
        <RendicionAcciones id={rendicion.id} estado={rendicion.estado} />
      </div>

      {rendicion.estado === 'rechazada' && rendicion.motivo_rechazo && (
        <p className="text-sm border border-destructive/40 bg-destructive/5 rounded-md p-3">
          <span className="font-medium">Rechazo:</span> {rendicion.motivo_rechazo}
        </p>
      )}
      {rendicion.notas && <p className="text-sm text-muted-foreground border rounded-md p-3">{rendicion.notas}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold tabular-nums">{ars(Number(rendicion.total ?? 0))}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Fecha</p>
          <p className="text-sm font-medium">{new Date(rendicion.fecha).toLocaleDateString('es-AR')}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Aprobada por</p>
          <p className="text-sm font-medium">{aprobador ? `${aprobador.nombre} ${aprobador.apellido}` : '—'}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Ítems</p>
          <p className="text-sm font-medium tabular-nums">{items.length}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Gastos</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.descripcion}</TableCell>
                    <TableCell className="text-muted-foreground">{i.categoria ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{i.comprobante_ref ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{ars(i.monto)}</TableCell>
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

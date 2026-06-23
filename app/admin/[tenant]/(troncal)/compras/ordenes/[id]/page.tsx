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
import { fetchOrdenCompraDetalle } from '../../_lib/queries'
import { OcAcciones } from './_components/oc-acciones'

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  borrador: 'secondary',
  emitida: 'outline',
  recibida_parcial: 'outline',
  recibida_total: 'default',
  cancelada: 'destructive',
}
const ESTADO_LABEL: Record<string, string> = {
  recibida_parcial: 'recibida parcial',
  recibida_total: 'recibida total',
}

function formatMoneda(amount: number, moneda = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(amount)
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrdenCompraDetallePage({ params }: PageProps) {
  const { id } = await params

  let detalle
  try {
    detalle = await fetchOrdenCompraDetalle(id)
  } catch {
    notFound()
  }

  const { oc, items, recepciones } = detalle
  const proveedor = oc.proveedor as { id: string; nombre: string; cuit: string | null } | null
  const solicitud = oc.solicitud as { id: string; numero: string } | null
  const moneda = oc.moneda as string

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/admin/compras">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Orden {oc.numero}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant={ESTADO_VARIANT[oc.estado] ?? 'secondary'}>{ESTADO_LABEL[oc.estado] ?? oc.estado}</Badge>
            {proveedor && (
              <Link href={`/admin/proveedores/${proveedor.id}`} className="text-sm font-medium hover:underline">
                {proveedor.nombre}
              </Link>
            )}
            {solicitud && (
              <span className="text-sm text-muted-foreground">
                desde <Link href={`/admin/compras/solicitudes/${solicitud.id}`} className="hover:underline">{solicitud.numero}</Link>
              </span>
            )}
          </div>
        </div>
        <OcAcciones
          ocId={oc.id}
          estado={oc.estado}
          total={Number(oc.total ?? 0)}
          facturaRegistrada={!!oc.factura_registrada_at}
          facturaNumero={oc.factura_numero}
          items={items.map((i) => ({ id: i.id, descripcion: i.descripcion, cantidad: i.cantidad, cantidad_recibida: i.cantidad_recibida }))}
        />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold tabular-nums">{formatMoneda(Number(oc.total ?? 0), moneda)}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Emisión</p>
          <p className="text-sm font-medium">{oc.fecha_emision ? new Date(oc.fecha_emision).toLocaleDateString('es-AR') : '—'}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Entrega estimada</p>
          <p className="text-sm font-medium">{oc.fecha_entrega_estimada ? new Date(oc.fecha_entrega_estimada).toLocaleDateString('es-AR') : '—'}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Factura</p>
          <p className="text-sm font-medium">{oc.factura_numero ?? '—'}</p>
        </div>
      </div>

      {/* Ítems */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ítems</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ítem</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Recibido</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <span className="font-medium">{i.descripcion}</span>
                      {i.producto?.sku && <span className="block text-xs text-muted-foreground">{i.producto.sku}</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{i.cantidad}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={i.cantidad_recibida >= i.cantidad ? 'text-green-600' : ''}>{i.cantidad_recibida}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoneda(i.precio_unitario, moneda)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoneda(i.subtotal, moneda)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recepciones */}
      {recepciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recepciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recepciones.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                  <span className="font-medium">{r.numero}</span>
                  <span className="text-muted-foreground">{new Date(r.fecha).toLocaleDateString('es-AR')} · {r.items_count} ítem{r.items_count !== 1 ? 's' : ''}</span>
                  {r.notas && <span className="text-muted-foreground truncate max-w-xs">{r.notas}</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

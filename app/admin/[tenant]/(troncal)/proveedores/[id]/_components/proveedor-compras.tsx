import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ShoppingCart } from 'lucide-react'
import type { OrdenCompraRow } from '../../../compras/_lib/queries'

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

export function ProveedorCompras({ ordenes }: { ordenes: OrdenCompraRow[] }) {
  if (ordenes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <ShoppingCart className="h-8 w-8 mx-auto mb-3 opacity-40" />
          Este proveedor no tiene órdenes de compra todavía.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Emisión</TableHead>
            <TableHead>Factura</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenes.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link href={`/admin/compras/ordenes/${o.id}`} className="font-medium hover:underline">
                  {o.numero}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatMoneda(o.total, o.moneda)}</TableCell>
              <TableCell>
                <Badge variant={ESTADO_VARIANT[o.estado] ?? 'secondary'}>{ESTADO_LABEL[o.estado] ?? o.estado}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {o.fecha_emision ? new Date(o.fecha_emision).toLocaleDateString('es-AR') : '—'}
              </TableCell>
              <TableCell>
                {o.factura_registrada_at ? <Badge variant="default">registrada</Badge> : <span className="text-muted-foreground text-sm">—</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

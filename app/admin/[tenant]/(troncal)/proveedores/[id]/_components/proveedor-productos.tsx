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
import { Package } from 'lucide-react'
import type { ProductoProveedorRow } from '../../_lib/queries'

function formatMoneda(amount: number | null, moneda: string | null): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda || 'ARS' }).format(amount)
}

interface Props {
  productos: ProductoProveedorRow[]
}

export function ProveedorProductos({ productos }: Props) {
  if (productos.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-3 opacity-40" />
          Este proveedor no tiene productos asociados todavía.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>SKU proveedor</TableHead>
            <TableHead className="text-right">Precio compra</TableHead>
            <TableHead className="text-right">MOQ</TableHead>
            <TableHead className="text-right">Entrega</TableHead>
            <TableHead>Principal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productos.map((p) => (
            <TableRow key={p.id} className={!p.activo ? 'opacity-50' : ''}>
              <TableCell>
                {p.producto ? (
                  <Link href={`/admin/productos/${p.producto.id}`} className="font-medium hover:underline">
                    {p.producto.nombre}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Producto eliminado</span>
                )}
                {p.producto?.sku && <span className="block text-xs text-muted-foreground">{p.producto.sku}</span>}
              </TableCell>
              <TableCell className="text-muted-foreground">{p.sku_proveedor ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMoneda(p.precio_compra, p.moneda)}</TableCell>
              <TableCell className="text-right tabular-nums">{p.moq ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {p.plazo_entrega_dias != null ? `${p.plazo_entrega_dias} d` : '—'}
              </TableCell>
              <TableCell>{p.es_principal && <Badge variant="default">principal</Badge>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

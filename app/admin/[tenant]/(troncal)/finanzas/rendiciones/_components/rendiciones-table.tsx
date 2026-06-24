'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { RendicionRow } from '../_lib/queries'

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

export function RendicionesTable({ rendiciones }: { rendiciones: RendicionRow[] }) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Ítems</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rendiciones.length === 0 ? (
            <TableRow>
              <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                No hay rendiciones todavía.
              </TableCell>
            </TableRow>
          ) : (
            rendiciones.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`/admin/finanzas/rendiciones/${r.id}`} className="font-medium hover:underline">
                    {r.numero}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.solicitante ? `${r.solicitante.apellido}, ${r.solicitante.nombre}` : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">{new Date(r.fecha).toLocaleDateString('es-AR')}</TableCell>
                <TableCell className="text-right tabular-nums">{ars(r.total)}</TableCell>
                <TableCell className="text-right tabular-nums">{r.items_count}</TableCell>
                <TableCell><Badge variant={ESTADO_VARIANT[r.estado] ?? 'secondary'}>{r.estado}</Badge></TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

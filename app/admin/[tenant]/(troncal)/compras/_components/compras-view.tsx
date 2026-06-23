'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, ShoppingCart } from 'lucide-react'
import { CrearSolicitudDialog } from './crear-solicitud-dialog'
import { CrearOcDialog } from './crear-oc-dialog'
import type { SolicitudRow, OrdenCompraRow } from '../_lib/queries'

interface ProductoOption {
  id: string
  nombre: string
  sku: string | null
  precio_compra: number
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  borrador: 'secondary',
  enviada: 'outline',
  convertida: 'default',
  cancelada: 'destructive',
  emitida: 'outline',
  recibida_parcial: 'outline',
  recibida_total: 'default',
}

const ESTADO_LABEL: Record<string, string> = {
  recibida_parcial: 'recibida parcial',
  recibida_total: 'recibida total',
}

function EstadoBadge({ estado }: { estado: string }) {
  return <Badge variant={ESTADO_VARIANT[estado] ?? 'secondary'}>{ESTADO_LABEL[estado] ?? estado}</Badge>
}

function formatARS(amount: number, moneda = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(amount)
}

interface ComprasViewProps {
  solicitudes: SolicitudRow[]
  ordenes: OrdenCompraRow[]
  proveedores: Array<{ id: string; nombre: string }>
  productos: ProductoOption[]
}

export function ComprasView({ solicitudes, ordenes, proveedores, productos }: ComprasViewProps) {
  return (
    <Tabs defaultValue="ordenes">
      <TabsList variant="line" className="w-full justify-start">
        <TabsTrigger value="ordenes">
          <ShoppingCart className="h-4 w-4" />
          Órdenes de compra
        </TabsTrigger>
        <TabsTrigger value="solicitudes">
          <FileText className="h-4 w-4" />
          Solicitudes
        </TabsTrigger>
      </TabsList>

      {/* Órdenes de compra */}
      <TabsContent value="ordenes">
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''}</p>
            <CrearOcDialog proveedores={proveedores} productos={productos} />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Factura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                      No hay órdenes de compra todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  ordenes.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link href={`/admin/compras/ordenes/${o.id}`} className="font-medium hover:underline">
                          {o.numero}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{o.proveedor?.nombre ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatARS(o.total, o.moneda)}</TableCell>
                      <TableCell><EstadoBadge estado={o.estado} /></TableCell>
                      <TableCell>
                        {o.factura_registrada_at ? <Badge variant="default">registrada</Badge> : <span className="text-muted-foreground text-sm">—</span>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </TabsContent>

      {/* Solicitudes */}
      <TabsContent value="solicitudes">
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''}</p>
            <CrearSolicitudDialog productos={productos} />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Ítems</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitudes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                      No hay solicitudes todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitudes.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link href={`/admin/compras/solicitudes/${s.id}`} className="font-medium hover:underline">
                          {s.numero}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(s.fecha).toLocaleDateString('es-AR')}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.items_count}</TableCell>
                      <TableCell><EstadoBadge estado={s.estado} /></TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">{s.notas ?? '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

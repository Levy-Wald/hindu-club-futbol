import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'
import { fetchSolicitudDetalle, fetchProveedoresSelect } from '../../_lib/queries'
import { SolicitudAcciones } from './_components/solicitud-acciones'

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  borrador: 'secondary',
  enviada: 'outline',
  convertida: 'default',
  cancelada: 'destructive',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SolicitudDetallePage({ params }: PageProps) {
  const { id } = await params

  let detalle, proveedores
  try {
    ;[detalle, proveedores] = await Promise.all([fetchSolicitudDetalle(id), fetchProveedoresSelect()])
  } catch {
    notFound()
  }

  const { solicitud, items } = detalle
  const oc = solicitud.oc as { id: string; numero: string } | null

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/admin/compras">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Solicitud {solicitud.numero}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant={ESTADO_VARIANT[solicitud.estado] ?? 'secondary'}>{solicitud.estado}</Badge>
            <span className="text-sm text-muted-foreground">{new Date(solicitud.fecha).toLocaleDateString('es-AR')}</span>
            {oc && (
              <span className="text-sm text-muted-foreground">
                → <Link href={`/admin/compras/ordenes/${oc.id}`} className="font-medium hover:underline">{oc.numero}</Link>
              </span>
            )}
          </div>
        </div>
        <SolicitudAcciones solicitudId={solicitud.id} estado={solicitud.estado} proveedores={proveedores} />
      </div>

      {solicitud.notas && (
        <p className="text-sm text-muted-foreground border rounded-md p-3">{solicitud.notas}</p>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ítem</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={99} className="text-center text-muted-foreground py-8">Sin ítems.</TableCell>
              </TableRow>
            ) : (
              items.map((i) => {
                const producto = i.producto as unknown as { id: string; nombre: string; sku: string | null } | null
                return (
                  <TableRow key={i.id}>
                    <TableCell>
                      <span className="font-medium">{i.descripcion}</span>
                      {producto?.sku && <span className="block text-xs text-muted-foreground">{producto.sku}</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{Number(i.cantidad)}</TableCell>
                    <TableCell className="text-muted-foreground">{i.notas ?? '—'}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

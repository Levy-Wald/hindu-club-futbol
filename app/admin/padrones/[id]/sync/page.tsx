import { notFound } from 'next/navigation'
import Link from 'next/link'
import { obtenerRuns } from '@/lib/imports/actions'
import { fetchPadronDetalle } from '../../_lib/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const estadoVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  parseando: 'secondary',
  matching: 'secondary',
  revisando: 'outline',
  aplicando: 'secondary',
  aplicado: 'default',
  rollback: 'destructive',
  fallado: 'destructive',
}

function formatFecha(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function SyncHistorialPage({ params }: Props) {
  const { id: padronId } = await params

  const padron = await fetchPadronDetalle(padronId).catch(() => null)
  if (!padron) notFound()

  const runs = await obtenerRuns({ padronId })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/admin/padrones/${padronId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Sincronizaciones</h1>
            <p className="text-sm text-muted-foreground">{padron.nombre}</p>
          </div>
        </div>
        <Link href={`/admin/padrones/${padronId}/sync/nuevo`}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nueva sync
          </Button>
        </Link>
      </div>

      {runs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay sincronizaciones para este padrón.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Filas</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <Link
                      href={`/admin/padrones/${padronId}/sync/${run.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {run.archivo_origen ?? 'Sin nombre'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={estadoVariant[run.estado] ?? 'secondary'}>
                      {run.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {run.total_filas ?? '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFecha(run.fecha_inicio)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFecha(run.fecha_fin)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

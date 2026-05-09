import Link from 'next/link'
import { obtenerRuns, obtenerPipelines } from '@/lib/imports/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Plus } from 'lucide-react'
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
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ImportsPage({ searchParams }: Props) {
  const sp = await searchParams
  const runs = await obtenerRuns({
    estado: sp.estado,
    pipelineSlug: sp.pipeline,
  })
  const pipelines = await obtenerPipelines()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          <h1 className="text-xl sm:text-2xl font-bold">Importaciones</h1>
        </div>
        <Link href="/admin/imports/nuevo">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nueva importacion
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/admin/imports">
          <Badge variant={!sp.estado ? 'default' : 'outline'} className="cursor-pointer">
            Todos
          </Badge>
        </Link>
        {['revisando', 'aplicado', 'fallado'].map((e) => (
          <Link key={e} href={`/admin/imports?estado=${e}`}>
            <Badge variant={sp.estado === e ? 'default' : 'outline'} className="cursor-pointer capitalize">
              {e}
            </Badge>
          </Link>
        ))}
        {pipelines.length > 1 && pipelines.map((p) => (
          <Link key={p.slug} href={`/admin/imports?pipeline=${p.slug}`}>
            <Badge variant={sp.pipeline === p.slug ? 'default' : 'outline'} className="cursor-pointer">
              {p.nombre}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Tabla */}
      {runs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay importaciones{sp.estado ? ` con estado "${sp.estado}"` : ''}.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archivo</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Filas</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const pipelineName = Array.isArray(run.import_pipelines)
                  ? (run.import_pipelines[0] as { nombre: string } | undefined)?.nombre
                  : (run.import_pipelines as { nombre: string } | null)?.nombre
                return (
                  <TableRow key={run.id}>
                    <TableCell>
                      <Link href={`/admin/imports/${run.id}`} className="text-primary hover:underline font-medium">
                        {run.archivo_origen ?? 'Sin nombre'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {pipelineName ?? run.pipeline_slug}
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
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

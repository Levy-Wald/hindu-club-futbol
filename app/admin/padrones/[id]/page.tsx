import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchPadronDetalle } from '../_lib/queries'
import { fetchEstadosPadron, fetchTiposSocio } from '../../personas/_lib/queries'
import { obtenerRuns } from '@/lib/imports/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Users, RefreshCw, Eye, Play } from 'lucide-react'
import { AgregarMiembroDialog } from './_components/agregar-miembro-dialog'
import { ExportPadronButton } from './_components/export-padron-button'
import { EliminarPadronButton } from './_components/eliminar-padron-button'

interface PageProps {
  params: Promise<{ id: string }>
}

const TIPO_LABELS: Record<string, string> = {
  global: 'Global',
  deportivo: 'Deportivo',
  educativo: 'Educativo',
  residencial: 'Residencial',
  administrativo: 'Administrativo',
  otro: 'Otro',
}

export default async function PadronDetallePage({ params }: PageProps) {
  const { id } = await params

  const [padronResult, estadosPadron, tiposSocio, runs] = await Promise.all([
    fetchPadronDetalle(id).catch(() => null),
    fetchEstadosPadron(),
    fetchTiposSocio(),
    obtenerRuns({ padronId: id }),
  ])

  if (!padronResult) {
    notFound()
  }

  const padron = padronResult

  const miembrosActivos = padron.miembros.filter((m) => m.activo)
  const miembrosInactivos = padron.miembros.filter((m) => !m.activo)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 sm:px-6 py-3 border-b -mt-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/admin/padrones">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold truncate">{padron.nombre}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {padron.tipo && <span>{TIPO_LABELS[padron.tipo] ?? padron.tipo}</span>}
              <Badge variant={padron.activo ? 'default' : 'secondary'} className="text-[10px] h-4 shrink-0">
                {padron.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{miembrosActivos.length}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-2">
          <AgregarMiembroDialog
            padronId={padron.id}
            estadosPadron={estadosPadron}
            tiposSocio={tiposSocio}
          />
          <Link href={`/admin/padrones/${padron.id}/sync/nuevo`}>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Sincronizar
            </Button>
          </Link>
          <EliminarPadronButton padronId={padron.id} padronNombre={padron.nombre} />
          <ExportPadronButton
            padronNombre={padron.nombre}
            miembros={miembrosActivos.map((m) => ({
              id: m.id,
              persona_id: m.persona_id,
              nombre: m.nombre,
              apellido: m.apellido,
              numero_documento: m.numero_documento,
              email: null,
              numero_socio: m.numero_socio,
              tipo_socio: m.tipo_socio,
              estado_padron: m.estado_padron,
              fecha_alta: m.fecha_alta,
            }))}
          />
        </div>
      </div>

      {/* Miembros activos */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Miembros activos ({miembrosActivos.length})</h2>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {miembrosActivos.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No hay miembros activos.</p>
          ) : (
            miembrosActivos.map((m) => (
              <Link
                key={m.id}
                href={`/admin/personas/${m.persona_id}`}
                className="block rounded-lg border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{m.apellido}, {m.nombre}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {m.numero_socio ? `#${m.numero_socio}` : '\u2014'} · {m.tipo_socio ?? '\u2014'} · {m.estado_padron ?? '\u2014'}
                    </p>
                  </div>
                  {m.fecha_alta && (
                    <span className="text-xs text-muted-foreground shrink-0">{m.fecha_alta}</span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>N. Socio</TableHead>
                <TableHead>Tipo socio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha alta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {miembrosActivos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No hay miembros activos.
                  </TableCell>
                </TableRow>
              ) : (
                miembrosActivos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Link href={`/admin/personas/${m.persona_id}`} className="font-medium hover:underline">
                        {m.apellido}, {m.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.numero_documento ?? '\u2014'}</TableCell>
                    <TableCell>{m.numero_socio ?? '\u2014'}</TableCell>
                    <TableCell>{m.tipo_socio ?? '\u2014'}</TableCell>
                    <TableCell>
                      <Badge variant="default">{m.estado_padron ?? '\u2014'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.fecha_alta ?? '\u2014'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Miembros inactivos */}
      {miembrosInactivos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Dados de baja ({miembrosInactivos.length})
          </h2>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {miembrosInactivos.map((m) => (
              <Link
                key={m.id}
                href={`/admin/personas/${m.persona_id}`}
                className="block rounded-lg border p-3 opacity-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{m.apellido}, {m.nombre}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {m.numero_socio ? `#${m.numero_socio}` : '\u2014'} · {m.tipo_socio ?? '\u2014'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>N. Socio</TableHead>
                  <TableHead>Tipo socio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha alta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {miembrosInactivos.map((m) => (
                  <TableRow key={m.id} className="opacity-50">
                    <TableCell>
                      <Link href={`/admin/personas/${m.persona_id}`} className="font-medium hover:underline">
                        {m.apellido}, {m.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.numero_documento ?? '\u2014'}</TableCell>
                    <TableCell>{m.numero_socio ?? '\u2014'}</TableCell>
                    <TableCell>{m.tipo_socio ?? '\u2014'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{m.estado_padron ?? 'baja'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.fecha_alta ?? '\u2014'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      {/* Sincronizaciones */}
      {padron.pipeline_slug && runs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Sincronizaciones</h2>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {runs.map((r) => {
              const run = r as { id: string; archivo_origen: string; estado: string; total_filas: number; fecha_inicio: string; resumen: Record<string, number> | null }
              const isActive = ['revisando', 'matching', 'aplicando'].includes(run.estado)
              return (
                <Link
                  key={run.id}
                  href={`/admin/padrones/${padron.id}/sync/${run.id}`}
                  className={`block rounded-lg border p-3 ${isActive ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-sm">{run.archivo_origen}</p>
                      <p className="text-xs text-muted-foreground">
                        {run.total_filas} filas · {new Date(run.fecha_inicio).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <RunEstadoBadge estado={run.estado} />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Filas</TableHead>
                  <TableHead>Resumen</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => {
                  const run = r as { id: string; archivo_origen: string; estado: string; total_filas: number; fecha_inicio: string; resumen: Record<string, number> | null }
                  const isActive = ['revisando', 'matching', 'aplicando'].includes(run.estado)
                  const resumen = run.resumen ?? {}
                  return (
                    <TableRow key={run.id} className={isActive ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                      <TableCell className="font-medium">{run.archivo_origen}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(run.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <RunEstadoBadge estado={run.estado} />
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{run.total_filas}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {run.estado === 'aplicado' && resumen.aplicados != null
                          ? `${resumen.aplicados} aplicados${resumen.fallados ? `, ${resumen.fallados} fallados` : ''}`
                          : run.estado === 'revisando'
                            ? `${resumen.exactos ?? 0} exactos, ${resumen.sin_match ?? 0} sin match`
                            : '\u2014'}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/padrones/${padron.id}/sync/${run.id}`}>
                          <Button variant={isActive ? 'default' : 'ghost'} size="sm">
                            {isActive ? (
                              <><Play className="h-3 w-3 mr-1" /> Continuar</>
                            ) : (
                              <><Eye className="h-3 w-3 mr-1" /> Ver</>
                            )}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

function RunEstadoBadge({ estado }: { estado: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    matching: { label: 'Procesando', variant: 'outline' },
    revisando: { label: 'En revisión', variant: 'outline' },
    aplicando: { label: 'Aplicando', variant: 'outline' },
    aplicado: { label: 'Aplicado', variant: 'default' },
    fallado: { label: 'Fallado', variant: 'destructive' },
  }
  const c = config[estado] ?? { label: estado, variant: 'secondary' as const }
  return <Badge variant={c.variant}>{c.label}</Badge>
}

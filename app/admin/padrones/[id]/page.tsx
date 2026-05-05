import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchPadronDetalle } from '../_lib/queries'
import { fetchEstadosPadron, fetchTiposSocio } from '../../personas/_lib/queries'
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
import { ArrowLeft, Users } from 'lucide-react'
import { AgregarMiembroDialog } from './_components/agregar-miembro-dialog'
import { ImportarMiembrosDialog } from './_components/importar-miembros-dialog'

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

  const [padronResult, estadosPadron, tiposSocio] = await Promise.all([
    fetchPadronDetalle(id).catch(() => null),
    fetchEstadosPadron(),
    fetchTiposSocio(),
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
          <ImportarMiembrosDialog
            padronId={padron.id}
            estadosPadron={estadosPadron}
            tiposSocio={tiposSocio}
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
    </div>
  )
}

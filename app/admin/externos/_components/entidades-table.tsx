'use client'

import { useTransition } from 'react'
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
import { Power } from 'lucide-react'
import { toast } from 'sonner'
import { toggleActivoEntidad } from '../_actions'
import { useVistasColumns } from '@/components/ui/vistas-panel'
import { EXTERNOS_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'
import { EditarEntidadDialog } from './editar-entidad-dialog'

interface Entidad {
  id: string
  nombre: string
  tipo: string
  telefono: string | null
  email: string | null
  sitio_web: string | null
  cuit: string | null
  razon_social: string | null
  activo: boolean
}

interface EntidadesTableProps {
  entidades: Entidad[]
}

const ENTIDADES_COLUMNS = [
  { id: 'tipo', label: 'Tipo' },
  { id: 'telefono', label: 'Teléfono' },
  { id: 'email', label: 'Email' },
  { id: 'sitio_web', label: 'Sitio web' },
  { id: 'cuit', label: 'CUIT' },
  { id: 'estado', label: 'Estado' },
]

export const ENTIDADES_COLUMN_DEFS = ENTIDADES_COLUMNS

export function EntidadesTable({ entidades }: EntidadesTableProps) {
  const { isVisible } = useVistasColumns('entidades-columns', EXTERNOS_DEFAULT_COLUMNS)
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleActivoEntidad(id)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {entidades.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No se encontraron entidades.</p>
        ) : (
          entidades.map((e) => (
            <div
              key={e.id}
              className={`rounded-lg border p-3 ${!e.activo ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{e.nombre}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {e.telefono ?? '—'} · {e.email ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={e.activo ? 'default' : 'secondary'}>
                    {e.tipo}
                  </Badge>
                  <EditarEntidadDialog entidad={e} />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={isPending}
                    onClick={() => handleToggle(e.id)}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              {isVisible('tipo') && <TableHead>Tipo</TableHead>}
              {isVisible('telefono') && <TableHead>Teléfono</TableHead>}
              {isVisible('email') && <TableHead>Email</TableHead>}
              {isVisible('sitio_web') && <TableHead>Sitio web</TableHead>}
              {isVisible('cuit') && <TableHead>CUIT</TableHead>}
              {isVisible('estado') && <TableHead>Estado</TableHead>}
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No se encontraron entidades.
                </TableCell>
              </TableRow>
            ) : (
              entidades.map((e) => (
                <TableRow key={e.id} className={!e.activo ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{e.nombre}</TableCell>
                  {isVisible('tipo') && (
                    <TableCell>
                      <Badge variant="outline">{e.tipo}</Badge>
                    </TableCell>
                  )}
                  {isVisible('telefono') && <TableCell className="text-muted-foreground">{e.telefono ?? '—'}</TableCell>}
                  {isVisible('email') && <TableCell className="text-muted-foreground">{e.email ?? '—'}</TableCell>}
                  {isVisible('sitio_web') && <TableCell className="text-muted-foreground">{e.sitio_web ?? '—'}</TableCell>}
                  {isVisible('cuit') && <TableCell className="text-muted-foreground">{e.cuit ?? '—'}</TableCell>}
                  {isVisible('estado') && (
                    <TableCell>
                      <Badge variant={e.activo ? 'default' : 'secondary'}>
                        {e.activo ? 'activo' : 'inactivo'}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditarEntidadDialog entidad={e} />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={isPending}
                        onClick={() => handleToggle(e.id)}
                        title={e.activo ? 'Desactivar' : 'Activar'}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

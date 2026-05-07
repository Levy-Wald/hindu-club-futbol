'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { toggleActivoEntidad, eliminarEntidad } from '../_actions'
import { useVistasColumns } from '@/components/ui/vistas-panel'
import { EXTERNOS_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'
import { SelectionBar } from '@/components/ui/selection-bar'
import type { ExportData } from '@/lib/export/formats'

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
  representantes_count?: number
}

interface EntidadesTableProps {
  entidades: Entidad[]
}

export function EntidadesTable({ entidades }: EntidadesTableProps) {
  const router = useRouter()
  const { isVisible } = useVistasColumns('entidades-columns', EXTERNOS_DEFAULT_COLUMNS)
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [entidadAEliminar, setEntidadAEliminar] = useState<Entidad | null>(null)

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  function selectAll() { setSelected(new Set(entidades.map((e) => e.id))) }
  function clearSelection() { setSelected(new Set()) }
  const allSelected = entidades.length > 0 && selected.size === entidades.length

  function getExportData(): ExportData | null {
    const items = entidades.filter((e) => selected.has(e.id))
    if (items.length === 0) return null
    return {
      headers: ['Nombre', 'Tipo', 'Teléfono', 'Email', 'Sitio web', 'CUIT', 'Activo'],
      rows: items.map((e) => [e.nombre, e.tipo, e.telefono ?? '', e.email ?? '', e.sitio_web ?? '', e.cuit ?? '', e.activo ? 'Sí' : 'No']),
      filename: `entidades_seleccion_${new Date().toISOString().split('T')[0]}`,
    }
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleActivoEntidad(id)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  function handleEliminar() {
    if (!entidadAEliminar) return
    startTransition(async () => {
      const result = await eliminarEntidad(entidadAEliminar.id)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
      setEntidadAEliminar(null)
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
            <Link
              key={e.id}
              href={`/admin/externos/${e.id}`}
              className={`block rounded-lg border p-3 ${!e.activo ? 'opacity-50' : ''}`}
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
                </div>
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
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={() => allSelected ? clearSelection() : selectAll()} />
              </TableHead>
              <TableHead>Nombre</TableHead>
              {isVisible('tipo') && <TableHead>Tipo</TableHead>}
              {isVisible('telefono') && <TableHead>Teléfono</TableHead>}
              {isVisible('email') && <TableHead>Email</TableHead>}
              {isVisible('sitio_web') && <TableHead>Sitio web</TableHead>}
              {isVisible('cuit') && <TableHead>CUIT</TableHead>}
              {isVisible('estado') && <TableHead>Estado</TableHead>}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                  No se encontraron entidades.
                </TableCell>
              </TableRow>
            ) : (
              entidades.map((e) => (
                <TableRow key={e.id} className={`${!e.activo ? 'opacity-50' : ''} ${selected.has(e.id) ? 'bg-muted/50' : ''}`}>
                  <TableCell>
                    <Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggleSelect(e.id)} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/externos/${e.id}`} className="font-medium hover:underline">
                      {e.nombre}
                    </Link>
                  </TableCell>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/externos/${e.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggle(e.id)}
                          disabled={isPending}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {e.activo ? 'Desactivar' : 'Activar'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setEntidadAEliminar(e)}
                          disabled={isPending}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SelectionBar
        count={selected.size}
        total={entidades.length}
        onSelectAll={selectAll}
        onClear={clearSelection}
        getData={getExportData}
      />

      {/* Footer count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {entidades.length} entidad{entidades.length !== 1 ? 'es' : ''} en total
        </p>
      </div>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!entidadAEliminar} onOpenChange={(open) => { if (!open) setEntidadAEliminar(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entidad?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{entidadAEliminar?.nombre}</strong>. Esta acción no se puede deshacer fácilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

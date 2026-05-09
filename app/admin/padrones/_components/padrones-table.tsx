'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
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
import { MoreHorizontal, Eye, Power, Trash2, RefreshCw, History } from 'lucide-react'
import { toggleActivoPadron, eliminarPadron } from '../_actions'
import { toast } from 'sonner'
import { useVistasColumns } from '@/components/ui/vistas-panel'
import { PADRONES_LIST_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'
import { SelectionBar } from '@/components/ui/selection-bar'
import type { ExportData } from '@/lib/export/formats'
import type { PadronConConteo } from '../_lib/queries'

interface PadronesTableProps {
  padrones: PadronConConteo[]
}

const PADRONES_COLUMNS = [
  { id: 'tipo', label: 'Tipo' },
  { id: 'miembros', label: 'Miembros' },
  { id: 'disciplina', label: 'Disciplina' },
  { id: 'estado', label: 'Estado' },
]

export const PADRONES_COLUMN_DEFS = PADRONES_COLUMNS

const TIPO_LABELS: Record<string, string> = {
  global: 'Global',
  deportivo: 'Deportivo',
  educativo: 'Educativo',
  residencial: 'Residencial',
  administrativo: 'Administrativo',
  otro: 'Otro',
}

export function PadronesTable({ padrones }: PadronesTableProps) {
  const { isVisible } = useVistasColumns('padrones-columns', PADRONES_LIST_DEFAULT_COLUMNS)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  function selectAll() { setSelected(new Set(padrones.map((p) => p.id))) }
  function clearSelection() { setSelected(new Set()) }
  const allSelected = padrones.length > 0 && selected.size === padrones.length

  function getExportData(): ExportData | null {
    const items = padrones.filter((p) => selected.has(p.id))
    if (items.length === 0) return null
    return {
      headers: ['Nombre', 'Tipo', 'Disciplina', 'Miembros activos', 'Estado'],
      rows: items.map((p) => [p.nombre, p.tipo ?? '', p.disciplina_slug ?? '', String(p.miembros_activos), p.activo ? 'Activo' : 'Inactivo']),
      filename: `padrones_seleccion_${new Date().toISOString().split('T')[0]}`,
    }
  }

  async function handleToggle(id: string) {
    const result = await toggleActivoPadron(id)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  function handleDeleteClick(id: string) {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  function handleConfirmDelete() {
    if (!deletingId) return
    startTransition(async () => {
      const result = await eliminarPadron(deletingId)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
      setDeletingId(null)
      setConfirmOpen(false)
    })
  }

  return (
    <div className="space-y-4">
      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {padrones.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No se encontraron padrones.</p>
        ) : (
          padrones.map((p) => (
            <Link
              key={p.id}
              href={`/admin/padrones/${p.id}`}
              className={`block rounded-lg border p-3 ${!p.activo ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{p.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.tipo ? TIPO_LABELS[p.tipo] ?? p.tipo : 'Sin tipo'} · {p.miembros_activos} miembro{p.miembros_activos !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant={p.activo ? 'default' : 'secondary'}>
                  {p.activo ? 'Activo' : 'Inactivo'}
                </Badge>
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
              {isVisible('miembros') && <TableHead className="text-center">Miembros</TableHead>}
              {isVisible('disciplina') && <TableHead>Disciplina</TableHead>}
              {isVisible('estado') && <TableHead>Estado</TableHead>}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {padrones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No se encontraron padrones.
                </TableCell>
              </TableRow>
            ) : (
              padrones.map((p) => (
                <TableRow key={p.id} className={`${!p.activo ? 'opacity-50' : ''} ${selected.has(p.id) ? 'bg-muted/50' : ''}`}>
                  <TableCell>
                    <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/padrones/${p.id}`} className="font-medium hover:underline">
                      {p.nombre}
                    </Link>
                  </TableCell>
                  {isVisible('tipo') && (
                    <TableCell className="text-muted-foreground">
                      {p.pipeline_nombre ?? (p.tipo ? TIPO_LABELS[p.tipo] ?? p.tipo : '—')}
                    </TableCell>
                  )}
                  {isVisible('miembros') && <TableCell className="text-center">{p.miembros_activos}</TableCell>}
                  {isVisible('disciplina') && <TableCell className="text-muted-foreground">{p.disciplina_slug ?? '—'}</TableCell>}
                  {isVisible('estado') && (
                    <TableCell>
                      <Badge variant={p.activo ? 'default' : 'secondary'}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem render={<Link href={`/admin/padrones/${p.id}`} />}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href={
                          p.pipeline_slug
                            ? `/admin/padrones/${p.id}/sync/nuevo`
                            : `/admin/padrones/sincronizar?padronId=${p.id}`
                        } />}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sincronizar
                        </DropdownMenuItem>
                        {p.pipeline_slug && (
                          <DropdownMenuItem render={<Link href={`/admin/padrones/${p.id}/sync`} />}>
                            <History className="mr-2 h-4 w-4" />
                            Ver sincronizaciones
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleToggle(p.id)}>
                          <Power className="mr-2 h-4 w-4" />
                          {p.activo ? 'Desactivar' : 'Activar'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(p.id)}
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
        total={padrones.length}
        onSelectAll={selectAll}
        onClear={clearSelection}
        getData={getExportData}
      />

      {/* Footer count */}
      <p className="text-sm text-muted-foreground">
        {padrones.length} padr{padrones.length !== 1 ? 'ones' : 'on'} en total
      </p>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar padrón?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. El padrón quedará marcado como eliminado y no aparecerá en el listado. Los miembros no se eliminan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

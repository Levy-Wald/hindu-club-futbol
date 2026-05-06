'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MoreHorizontal, Eye, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useVistasColumns } from '@/components/ui/vistas-panel'
import { EQUIPOS_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'
import { SelectionBar } from '@/components/ui/selection-bar'
import { eliminarEquipo } from '../_actions'
import type { ExportData } from '@/lib/export/formats'

interface Equipo {
  id: string
  nombre: string
  disciplina_slug: string
  modalidad: string | null
  activo: boolean
  color_principal: string | null
  categoria_nombre: string
  miembros_count: number
}

interface EquiposTableProps {
  equipos: Equipo[]
}

const EQUIPOS_COLUMNS = [
  { id: 'categoria', label: 'Categoría' },
  { id: 'disciplina', label: 'Disciplina' },
  { id: 'modalidad', label: 'Modalidad' },
  { id: 'miembros', label: 'Miembros' },
  { id: 'estado', label: 'Estado' },
  { id: 'color', label: 'Color' },
]

export const EQUIPOS_COLUMN_DEFS = EQUIPOS_COLUMNS

export function EquiposTable({ equipos }: EquiposTableProps) {
  const router = useRouter()
  const { isVisible } = useVistasColumns('equipos-columns', EQUIPOS_DEFAULT_COLUMNS)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [equipoAEliminar, setEquipoAEliminar] = useState<Equipo | null>(null)

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  function selectAll() { setSelected(new Set(equipos.map((e) => e.id))) }
  function clearSelection() { setSelected(new Set()) }
  const allSelected = equipos.length > 0 && selected.size === equipos.length

  function handleConfirmarEliminar() {
    if (!equipoAEliminar) return
    const id = equipoAEliminar.id
    startTransition(async () => {
      const result = await eliminarEquipo(id)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
      setEquipoAEliminar(null)
    })
  }

  function getExportData(): ExportData | null {
    const items = equipos.filter((e) => selected.has(e.id))
    if (items.length === 0) return null
    return {
      headers: ['Nombre', 'Disciplina', 'Modalidad', 'Categoría', 'Activo', 'Miembros'],
      rows: items.map((e) => [e.nombre, e.disciplina_slug, e.modalidad ?? '', e.categoria_nombre, e.activo ? 'Sí' : 'No', String(e.miembros_count)]),
      filename: `equipos_seleccion_${new Date().toISOString().split('T')[0]}`,
    }
  }

  return (
    <>
    {/* Confirmation dialog */}
    <Dialog open={!!equipoAEliminar} onOpenChange={(open) => { if (!open) setEquipoAEliminar(null) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar equipo</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que querés eliminar <strong>{equipoAEliminar?.nombre}</strong>? Esta acción desactiva el equipo y no se puede deshacer fácilmente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEquipoAEliminar(null)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirmarEliminar} disabled={isPending}>
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <div className="space-y-4">
      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {equipos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No se encontraron equipos.</p>
        ) : (
          equipos.map((e) => (
            <Link
              key={e.id}
              href={`/admin/equipos/${e.id}`}
              className={`block rounded-lg border p-3 ${!e.activo ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{e.nombre}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {e.categoria_nombre} · {e.disciplina_slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {e.miembros_count}
                  </span>
                  <Badge variant={e.activo ? 'default' : 'secondary'}>
                    {e.activo ? 'activo' : 'inactivo'}
                  </Badge>
                </div>
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
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={() => allSelected ? clearSelection() : selectAll()} />
              </TableHead>
              <TableHead>Nombre</TableHead>
              {isVisible('categoria') && <TableHead>Categoría</TableHead>}
              {isVisible('disciplina') && <TableHead>Disciplina</TableHead>}
              {isVisible('modalidad') && <TableHead>Modalidad</TableHead>}
              {isVisible('miembros') && <TableHead className="text-center">Miembros</TableHead>}
              {isVisible('estado') && <TableHead>Estado</TableHead>}
              {isVisible('color') && <TableHead>Color</TableHead>}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No se encontraron equipos.
                </TableCell>
              </TableRow>
            ) : (
              equipos.map((e) => (
                <TableRow key={e.id} className={`${!e.activo ? 'opacity-50' : ''} ${selected.has(e.id) ? 'bg-muted/50' : ''}`}>
                  <TableCell>
                    <Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggleSelect(e.id)} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/equipos/${e.id}`} className="font-medium hover:underline">
                      {e.nombre}
                    </Link>
                  </TableCell>
                  {isVisible('categoria') && <TableCell className="text-muted-foreground">{e.categoria_nombre}</TableCell>}
                  {isVisible('disciplina') && <TableCell className="text-muted-foreground">{e.disciplina_slug}</TableCell>}
                  {isVisible('modalidad') && <TableCell className="text-muted-foreground">{e.modalidad ?? '—'}</TableCell>}
                  {isVisible('miembros') && (
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {e.miembros_count}
                      </span>
                    </TableCell>
                  )}
                  {isVisible('estado') && (
                    <TableCell>
                      <Badge variant={e.activo ? 'default' : 'secondary'}>
                        {e.activo ? 'activo' : 'inactivo'}
                      </Badge>
                    </TableCell>
                  )}
                  {isVisible('color') && (
                    <TableCell>
                      {e.color_principal ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: e.color_principal }} />
                          <span className="text-xs text-muted-foreground">{e.color_principal}</span>
                        </div>
                      ) : '—'}
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/equipos/${e.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setEquipoAEliminar(e)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
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
        total={equipos.length}
        onSelectAll={selectAll}
        onClear={clearSelection}
        getData={getExportData}
      />
    </div>
    </>
  )
}

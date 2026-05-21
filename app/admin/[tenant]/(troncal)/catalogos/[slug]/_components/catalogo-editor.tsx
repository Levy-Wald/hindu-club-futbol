'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { CatalogoDef } from '@/lib/catalogos/registry'
import {
  crearRegistroCatalogo,
  editarRegistroCatalogo,
  toggleActivoCatalogo,
} from '../../_actions'

interface Props {
  catalogoSlug: string
  def: CatalogoDef
  initialData: Record<string, unknown>[]
}

export function CatalogoEditor({ catalogoSlug, def, initialData }: Props) {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null)
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const [isPending, startTransition] = useTransition()

  const editableColumns = def.columns.filter((c) => c.key !== 'activo')
  const dataColumns = def.columns.filter((c) => c.key !== 'activo')

  const filtered = initialData.filter((row) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      String(row.nombre ?? '').toLowerCase().includes(q) ||
      String(row.slug ?? '').toLowerCase().includes(q)
    )
  })

  function openCreate() {
    const initial: Record<string, unknown> = {}
    for (const col of editableColumns) {
      initial[col.key] = col.type === 'boolean' ? true : ''
    }
    setFormValues(initial)
    setShowCreate(true)
  }

  function openEdit(row: Record<string, unknown>) {
    const initial: Record<string, unknown> = {}
    for (const col of editableColumns) {
      initial[col.key] = row[col.key] ?? (col.type === 'boolean' ? false : '')
    }
    setEditingRow(row)
    setFormValues(initial)
  }

  function handleCreate() {
    startTransition(async () => {
      const result = await crearRegistroCatalogo(catalogoSlug, formValues)
      if (result.ok) {
        toast.success(result.message)
        setShowCreate(false)
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleEdit() {
    if (!editingRow) return
    const pk = def.pkType === 'uuid'
      ? String(editingRow.id)
      : String(editingRow.slug)

    startTransition(async () => {
      const result = await editarRegistroCatalogo(catalogoSlug, pk, formValues)
      if (result.ok) {
        toast.success(result.message)
        setEditingRow(null)
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleToggle(row: Record<string, unknown>) {
    const pk = def.pkType === 'uuid'
      ? String(row.id)
      : String(row.slug)
    const nuevoEstado = !row.activo

    startTransition(async () => {
      const result = await toggleActivoCatalogo(catalogoSlug, pk, nuevoEstado)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  function renderFormField(col: typeof editableColumns[number], isNew: boolean) {
    if (!isNew && !col.editable) {
      return (
        <Input
          value={String(formValues[col.key] ?? '')}
          disabled
          className="bg-muted"
        />
      )
    }
    return (
      <Input
        value={String(formValues[col.key] ?? '')}
        onChange={(e) =>
          setFormValues((prev) => ({ ...prev, [col.key]: e.target.value }))
        }
        placeholder={col.label}
      />
    )
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/admin/catalogos">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="secondary" className="text-xs">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        </Badge>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {dataColumns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="w-[100px]">Estado</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row, i) => (
              <TableRow key={String(row.slug ?? row.id ?? i)}>
                {dataColumns.map((col) => (
                  <TableCell key={col.key} className="text-sm">
                    {String(row[col.key] ?? '—')}
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(row)}
                    disabled={isPending}
                    className="h-6 px-2"
                  >
                    <Badge variant={row.activo ? 'default' : 'secondary'} className="text-[10px]">
                      {row.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(row)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={dataColumns.length + 2}
                  className="text-center text-muted-foreground py-8"
                >
                  No se encontraron registros
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Crear */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo registro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {editableColumns
              .filter((c) => c.type !== 'boolean')
              .map((col) => (
                <div key={col.key} className="space-y-1">
                  <label className="text-sm font-medium">
                    {col.label} {col.required && '*'}
                  </label>
                  {renderFormField(col, true)}
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={!!editingRow} onOpenChange={(open) => { if (!open) setEditingRow(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar registro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {editableColumns
              .filter((c) => c.type !== 'boolean')
              .map((col) => (
                <div key={col.key} className="space-y-1">
                  <label className="text-sm font-medium">
                    {col.label} {col.required && '*'}
                  </label>
                  {renderFormField(col, false)}
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

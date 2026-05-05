'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useVistasColumns } from '@/components/ui/vistas-panel'
import { BAJAS_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'
import { SelectionBar } from '@/components/ui/selection-bar'
import { ArrowUpDown, MoreHorizontal, RotateCcw } from 'lucide-react'
import { reactivarPersona } from '../../personas/_actions'
import { toast } from 'sonner'
import type { ExportData } from '@/lib/export/formats'

interface Baja {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  email_principal: string | null
  telefono_principal: string | null
  estado: string
  motivo_baja_slug: string | null
  motivo_baja_detalle: string | null
  fecha_baja: string | null
}

interface BajasTableProps {
  bajas: Baja[]
  total: number
  page: number
  pageSize: number
}

const MOTIVO_LABELS: Record<string, string> = {
  renuncia_voluntaria: 'Renuncia voluntaria',
  mora: 'Mora',
  sancion_disciplinaria: 'Sanción disciplinaria',
  mudanza: 'Mudanza',
  fallecimiento: 'Fallecimiento',
  inactividad: 'Inactividad',
  cambio_club: 'Cambio de club',
  motivos_economicos: 'Motivos económicos',
  motivos_personales: 'Motivos personales',
  otro: 'Otro',
}

export function BajasTable({ bajas, total, page, pageSize }: BajasTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isVisible } = useVistasColumns('bajas-columns', BAJAS_DEFAULT_COLUMNS)
  const totalPages = Math.ceil(total / pageSize)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(bajas.map((b) => b.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  const allSelected = bajas.length > 0 && selected.size === bajas.length

  function getExportData(): ExportData | null {
    const items = bajas.filter((b) => selected.has(b.id))
    if (items.length === 0) return null
    return {
      headers: ['Apellido', 'Nombre', 'Documento', 'Email', 'Motivo', 'Fecha baja', 'Detalle'],
      rows: items.map((b) => [
        b.apellido,
        b.nombre,
        b.numero_documento ?? '',
        b.email_principal ?? '',
        MOTIVO_LABELS[b.motivo_baja_slug ?? ''] ?? b.motivo_baja_slug ?? '',
        b.fecha_baja ?? '',
        b.motivo_baja_detalle ?? '',
      ]),
      filename: `bajas_seleccion_${new Date().toISOString().split('T')[0]}`,
    }
  }

  function handleSort(column: string) {
    const params = new URLSearchParams(searchParams.toString())
    const currentSort = params.get('sort')
    const currentDir = params.get('dir') ?? 'desc'

    if (currentSort === column) {
      params.set('dir', currentDir === 'asc' ? 'desc' : 'asc')
    } else {
      params.set('sort', column)
      params.set('dir', 'asc')
    }
    params.delete('page')
    router.push(`/admin/bajas?${params.toString()}`)
  }

  function handlePage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/admin/bajas?${params.toString()}`)
  }

  async function handleReactivar(id: string) {
    const result = await reactivarPersona(id)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  function sortButton(column: string, label: string) {
    return (
      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => handleSort(column)}>
        {label}
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {bajas.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No se encontraron bajas.</p>
        ) : (
          bajas.map((b) => (
            <Link
              key={b.id}
              href={`/admin/personas/${b.id}`}
              className="block rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{b.apellido}, {b.nombre}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {b.numero_documento ?? '—'} · {MOTIVO_LABELS[b.motivo_baja_slug ?? ''] ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.fecha_baja ? new Date(b.fecha_baja).toLocaleDateString('es-AR') : '—'}
                  </p>
                </div>
                <Badge variant="destructive" className="shrink-0">
                  {b.estado}
                </Badge>
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
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => allSelected ? clearSelection() : selectAll()}
                />
              </TableHead>
              <TableHead>{sortButton('apellido', 'Nombre')}</TableHead>
              {isVisible('numero_documento') && <TableHead>{sortButton('numero_documento', 'Documento')}</TableHead>}
              {isVisible('email_principal') && <TableHead>Email</TableHead>}
              {isVisible('telefono_principal') && <TableHead>Teléfono</TableHead>}
              {isVisible('motivo_baja') && <TableHead>Motivo</TableHead>}
              {isVisible('fecha_baja') && <TableHead>{sortButton('fecha_baja', 'Fecha baja')}</TableHead>}
              {isVisible('motivo_baja_detalle') && <TableHead>Detalle</TableHead>}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bajas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                  No se encontraron bajas.
                </TableCell>
              </TableRow>
            ) : (
              bajas.map((b) => (
                <TableRow key={b.id} className={selected.has(b.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(b.id)}
                      onCheckedChange={() => toggleSelect(b.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/personas/${b.id}`} className="font-medium hover:underline">
                      {b.apellido}, {b.nombre}
                    </Link>
                  </TableCell>
                  {isVisible('numero_documento') && <TableCell className="text-muted-foreground">{b.numero_documento ?? '—'}</TableCell>}
                  {isVisible('email_principal') && <TableCell className="text-muted-foreground">{b.email_principal ?? '—'}</TableCell>}
                  {isVisible('telefono_principal') && <TableCell className="text-muted-foreground">{b.telefono_principal ?? '—'}</TableCell>}
                  {isVisible('motivo_baja') && (
                    <TableCell>
                      <Badge variant="secondary">
                        {MOTIVO_LABELS[b.motivo_baja_slug ?? ''] ?? b.motivo_baja_slug ?? '—'}
                      </Badge>
                    </TableCell>
                  )}
                  {isVisible('fecha_baja') && (
                    <TableCell className="text-muted-foreground">
                      {b.fecha_baja ? new Date(b.fecha_baja).toLocaleDateString('es-AR') : '—'}
                    </TableCell>
                  )}
                  {isVisible('motivo_baja_detalle') && (
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {b.motivo_baja_detalle ?? '—'}
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleReactivar(b.id)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reactivar
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
        total={bajas.length}
        onSelectAll={selectAll}
        onClear={clearSelection}
        getData={getExportData}
      />

      {/* Paginacion */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} baja{total !== 1 ? 's' : ''} en total
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePage(page - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

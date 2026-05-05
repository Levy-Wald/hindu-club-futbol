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
import { TUTORES_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'
import { SelectionBar } from '@/components/ui/selection-bar'
import { ArrowUpDown, MoreHorizontal, Eye } from 'lucide-react'
import type { ExportData } from '@/lib/export/formats'
import type { TutorRow } from '../_lib/queries'

interface TutoresTableProps {
  tutores: TutorRow[]
  total: number
  page: number
  pageSize: number
}

export function TutoresTable({ tutores, total, page, pageSize }: TutoresTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isVisible } = useVistasColumns('tutores-columns', TUTORES_DEFAULT_COLUMNS)
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
    setSelected(new Set(tutores.map((t) => t.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  const allSelected = tutores.length > 0 && selected.size === tutores.length

  function getExportData(): ExportData | null {
    const items = tutores.filter((t) => selected.has(t.id))
    if (items.length === 0) return null
    return {
      headers: ['Apellido', 'Nombre', 'Documento', 'Email', 'Teléfono', 'Menores', 'Estado'],
      rows: items.map((t) => [
        t.apellido,
        t.nombre,
        t.numero_documento ?? '',
        t.email_principal ?? '',
        t.telefono_principal ?? '',
        t.menores.map((m) => `${m.apellido}, ${m.nombre}`).join('; '),
        t.estado,
      ]),
      filename: `tutores_seleccion_${new Date().toISOString().split('T')[0]}`,
    }
  }

  function handleSort(column: string) {
    const params = new URLSearchParams(searchParams.toString())
    const currentSort = params.get('sort')
    const currentDir = params.get('dir') ?? 'asc'

    if (currentSort === column) {
      params.set('dir', currentDir === 'asc' ? 'desc' : 'asc')
    } else {
      params.set('sort', column)
      params.set('dir', 'asc')
    }
    params.delete('page')
    router.push(`/admin/tutores?${params.toString()}`)
  }

  function handlePage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/admin/tutores?${params.toString()}`)
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
        {tutores.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No se encontraron tutores.</p>
        ) : (
          tutores.map((t) => (
            <Link
              key={t.id}
              href={`/admin/personas/${t.id}`}
              className="block rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.apellido}, {t.nombre}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {t.numero_documento ?? '—'} · {t.email_principal ?? '—'}
                  </p>
                  {t.menores.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {t.menores.map((m) => (
                        <Badge key={m.id} variant="secondary" className="text-xs">
                          {m.nombre} {m.apellido}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant={t.estado === 'activo' ? 'default' : 'secondary'} className="shrink-0">
                  {t.estado}
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
              {isVisible('menores') && <TableHead>Menores vinculados</TableHead>}
              {isVisible('estado') && <TableHead>{sortButton('estado', 'Estado')}</TableHead>}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tutores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                  No se encontraron tutores.
                </TableCell>
              </TableRow>
            ) : (
              tutores.map((t) => (
                <TableRow key={t.id} className={selected.has(t.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(t.id)}
                      onCheckedChange={() => toggleSelect(t.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/personas/${t.id}`} className="font-medium hover:underline">
                      {t.apellido}, {t.nombre}
                    </Link>
                  </TableCell>
                  {isVisible('numero_documento') && <TableCell className="text-muted-foreground">{t.numero_documento ?? '—'}</TableCell>}
                  {isVisible('email_principal') && <TableCell className="text-muted-foreground">{t.email_principal ?? '—'}</TableCell>}
                  {isVisible('telefono_principal') && <TableCell className="text-muted-foreground">{t.telefono_principal ?? '—'}</TableCell>}
                  {isVisible('menores') && (
                    <TableCell>
                      {t.menores.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {t.menores.length}
                          </Badge>
                          {t.menores.map((m) => (
                            <Badge key={m.id} variant="secondary" className="text-xs">
                              {m.nombre} {m.apellido}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  )}
                  {isVisible('estado') && (
                    <TableCell>
                      <Badge variant={t.estado === 'activo' ? 'default' : 'secondary'}>
                        {t.estado}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/personas/${t.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver ficha
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
        total={tutores.length}
        onSelectAll={selectAll}
        onClear={clearSelection}
        getData={getExportData}
      />

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} tutor{total !== 1 ? 'es' : ''} en total
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

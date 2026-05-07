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
import { PersonaAvatar } from './persona-avatar'
import { useVistasColumns } from '@/components/ui/vistas-panel'
import { PERSONAS_DEFAULT_COLUMNS, PERSONAS_MODULES } from '@/lib/vistas/column-defs'
import { SelectionBar } from '@/components/ui/selection-bar'
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, RotateCcw, CirclePause, CirclePlay } from 'lucide-react'
import { softDeletePersona, restaurarPersona, cambiarEstadoPersona } from '../_actions'
import { toast } from 'sonner'
import type { ExportData } from '@/lib/export/formats'

interface Atributo {
  atributo_slug: string
  activo: boolean
}

interface Persona {
  id: string
  nombre: string
  apellido: string
  tipo_documento: string | null
  numero_documento: string | null
  cuil_cuit: string | null
  fecha_nacimiento: string | null
  genero: string | null
  nacionalidad: string | null
  estado_civil: string | null
  email_principal: string | null
  email_secundario: string | null
  telefono_principal: string | null
  telefono_secundario: string | null
  whatsapp: string | null
  direccion_calle: string | null
  direccion_numero: string | null
  direccion_piso: string | null
  direccion_depto: string | null
  direccion_barrio: string | null
  direccion_ciudad: string | null
  direccion_provincia: string | null
  direccion_codigo_postal: string | null
  altura_cm: number | null
  peso_kg: number | null
  lateralidad: string | null
  pie_dominante: string | null
  deporte_principal_slug: string | null
  categoria_historica_max: string | null
  nivel_actividad_actual: string | null
  fecha_primera_relacion_club: string | null
  estado: string
  deleted_at: string | null
  created_at: string
  personas_atributos: Atributo[]
}

interface PersonasTableProps {
  personas: Persona[]
  total: number
  page: number
  pageSize: number
}

const ATRIBUTO_COLORS: Record<string, string> = {
  admin_sistema: 'bg-red-500/10 text-red-500',
  admin_tenant: 'bg-orange-500/10 text-orange-500',
  admin_padron: 'bg-amber-500/10 text-amber-500',
  jugador: 'bg-blue-500/10 text-blue-500',
  capitan: 'bg-yellow-500/10 text-yellow-500',
  dt: 'bg-green-500/10 text-green-500',
  dirigente: 'bg-purple-500/10 text-purple-500',
  socio: 'bg-teal-500/10 text-teal-500',
  staff: 'bg-indigo-500/10 text-indigo-500',
  padre_tutor: 'bg-pink-500/10 text-pink-500',
}

// Columnas que soportan sorting
const SORTABLE_COLUMNS = new Set(['apellido', 'nombre', 'numero_documento', 'email_principal', 'estado', 'fecha_nacimiento', 'created_at'])

// Todas las columnas flat desde PERSONAS_MODULES
const ALL_COLUMNS = PERSONAS_MODULES.flatMap((m) => m.columns)

/** Obtener el label de una columna por su id */
function getColumnLabel(id: string): string {
  return ALL_COLUMNS.find((c) => c.id === id)?.label ?? id
}

/** Renderizar el valor de una celda según el id de la columna */
function renderCellValue(p: Persona, colId: string): React.ReactNode {
  switch (colId) {
    // Nombre/Apellido se renderizan siempre como columna fija, no acá
    case 'nombre': return p.nombre ?? '—'
    case 'apellido': return p.apellido ?? '—'
    case 'tipo_documento': return p.tipo_documento ?? '—'
    case 'numero_documento': return p.numero_documento ?? '—'
    case 'cuil_cuit': return p.cuil_cuit ?? '—'
    case 'fecha_nacimiento':
      return p.fecha_nacimiento ? new Date(p.fecha_nacimiento).toLocaleDateString('es-AR') : '—'
    case 'genero': return p.genero ?? '—'
    case 'nacionalidad': return p.nacionalidad ?? '—'
    case 'estado_civil': return p.estado_civil ?? '—'
    case 'email_principal': return p.email_principal ?? '—'
    case 'email_secundario': return p.email_secundario ?? '—'
    case 'telefono_principal': return p.telefono_principal ?? '—'
    case 'telefono_secundario': return p.telefono_secundario ?? '—'
    case 'whatsapp': return p.whatsapp ?? '—'
    case 'direccion_calle': return p.direccion_calle ?? '—'
    case 'direccion_numero': return p.direccion_numero ?? '—'
    case 'direccion_piso': return p.direccion_piso ?? '—'
    case 'direccion_depto': return p.direccion_depto ?? '—'
    case 'direccion_barrio': return p.direccion_barrio ?? '—'
    case 'direccion_ciudad': return p.direccion_ciudad ?? '—'
    case 'direccion_provincia': return p.direccion_provincia ?? '—'
    case 'direccion_codigo_postal': return p.direccion_codigo_postal ?? '—'
    case 'altura_cm': return p.altura_cm != null ? `${p.altura_cm}` : '—'
    case 'peso_kg': return p.peso_kg != null ? `${p.peso_kg}` : '—'
    case 'lateralidad': return p.lateralidad ?? '—'
    case 'pie_dominante': return p.pie_dominante ?? '—'
    case 'deporte_principal_slug': return p.deporte_principal_slug ?? '—'
    case 'categoria_historica_max': return p.categoria_historica_max ?? '—'
    case 'nivel_actividad_actual': return p.nivel_actividad_actual ?? '—'
    case 'fecha_primera_relacion_club':
      return p.fecha_primera_relacion_club ? new Date(p.fecha_primera_relacion_club).toLocaleDateString('es-AR') : '—'
    case 'roles':
      return (
        <div className="flex flex-wrap gap-1">
          {p.personas_atributos
            ?.filter((a) => a.activo)
            .map((a) => (
              <Badge
                key={a.atributo_slug}
                variant="secondary"
                className={ATRIBUTO_COLORS[a.atributo_slug] ?? ''}
              >
                {a.atributo_slug}
              </Badge>
            ))}
        </div>
      )
    case 'estado':
      return (
        <Badge variant={p.deleted_at ? 'destructive' : p.estado === 'activo' ? 'default' : 'secondary'}>
          {p.deleted_at ? 'eliminada' : p.estado}
        </Badge>
      )
    default: return '—'
  }
}

/** Obtener valor plano (string) para export */
function getCellValueString(p: Persona, colId: string): string {
  switch (colId) {
    case 'nombre': return p.nombre ?? ''
    case 'apellido': return p.apellido ?? ''
    case 'tipo_documento': return p.tipo_documento ?? ''
    case 'numero_documento': return p.numero_documento ?? ''
    case 'cuil_cuit': return p.cuil_cuit ?? ''
    case 'fecha_nacimiento': return p.fecha_nacimiento ?? ''
    case 'genero': return p.genero ?? ''
    case 'nacionalidad': return p.nacionalidad ?? ''
    case 'estado_civil': return p.estado_civil ?? ''
    case 'email_principal': return p.email_principal ?? ''
    case 'email_secundario': return p.email_secundario ?? ''
    case 'telefono_principal': return p.telefono_principal ?? ''
    case 'telefono_secundario': return p.telefono_secundario ?? ''
    case 'whatsapp': return p.whatsapp ?? ''
    case 'direccion_calle': return p.direccion_calle ?? ''
    case 'direccion_numero': return p.direccion_numero ?? ''
    case 'direccion_piso': return p.direccion_piso ?? ''
    case 'direccion_depto': return p.direccion_depto ?? ''
    case 'direccion_barrio': return p.direccion_barrio ?? ''
    case 'direccion_ciudad': return p.direccion_ciudad ?? ''
    case 'direccion_provincia': return p.direccion_provincia ?? ''
    case 'direccion_codigo_postal': return p.direccion_codigo_postal ?? ''
    case 'altura_cm': return p.altura_cm != null ? `${p.altura_cm}` : ''
    case 'peso_kg': return p.peso_kg != null ? `${p.peso_kg}` : ''
    case 'lateralidad': return p.lateralidad ?? ''
    case 'pie_dominante': return p.pie_dominante ?? ''
    case 'deporte_principal_slug': return p.deporte_principal_slug ?? ''
    case 'categoria_historica_max': return p.categoria_historica_max ?? ''
    case 'nivel_actividad_actual': return p.nivel_actividad_actual ?? ''
    case 'fecha_primera_relacion_club': return p.fecha_primera_relacion_club ?? ''
    case 'roles':
      return p.personas_atributos?.filter((a) => a.activo).map((a) => a.atributo_slug).join(', ') ?? ''
    case 'estado': return p.deleted_at ? 'eliminada' : p.estado
    default: return ''
  }
}

export function PersonasTable({ personas, total, page, pageSize }: PersonasTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { visibleColumns, isVisible } = useVistasColumns('personas-columns', PERSONAS_DEFAULT_COLUMNS)
  const totalPages = Math.ceil(total / pageSize)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Columnas visibles en orden (excluyendo nombre/apellido que van fijos)
  const dynamicColumns = ALL_COLUMNS.filter(
    (c) => c.id !== 'nombre' && c.id !== 'apellido' && isVisible(c.id)
  )

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(personas.map((p) => p.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  const allSelected = personas.length > 0 && selected.size === personas.length

  function getExportData(): ExportData | null {
    const items = personas.filter((p) => selected.has(p.id))
    if (items.length === 0) return null

    // Exportar las columnas visibles
    const exportCols = visibleColumns
    const headers = exportCols.map((id) => getColumnLabel(id))
    const rows = items.map((p) => exportCols.map((id) => getCellValueString(p, id)))

    return {
      headers,
      rows,
      filename: `personas_seleccion_${new Date().toISOString().split('T')[0]}`,
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
    router.push(`/admin/personas?${params.toString()}`)
  }

  function handlePage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/admin/personas?${params.toString()}`)
  }

  async function handleDelete(id: string) {
    const result = await softDeletePersona(id)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  async function handleRestore(id: string) {
    const result = await restaurarPersona(id)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  async function handleCambiarEstado(id: string, estado: string) {
    const result = await cambiarEstadoPersona(id, estado)
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
        {personas.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No se encontraron personas.</p>
        ) : (
          personas.map((p) => (
            <Link
              key={p.id}
              href={`/admin/personas/${p.id}`}
              className={`block rounded-lg border p-3 ${p.deleted_at ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <PersonaAvatar nombre={p.nombre} apellido={p.apellido} className="h-9 w-9" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.apellido}, {p.nombre}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {p.numero_documento ?? '—'} · {p.email_principal ?? '—'}
                  </p>
                </div>
                <Badge variant={p.deleted_at ? 'destructive' : 'default'} className="shrink-0">
                  {p.deleted_at ? 'eliminada' : p.estado}
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
              <TableHead className="w-10 sticky left-0 bg-background z-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => allSelected ? clearSelection() : selectAll()}
                />
              </TableHead>
              <TableHead className="sticky left-10 bg-background z-10">
                {sortButton('apellido', 'Nombre')}
              </TableHead>
              {dynamicColumns.map((col) => (
                <TableHead key={col.id}>
                  {SORTABLE_COLUMNS.has(col.id) ? sortButton(col.id, col.label) : col.label}
                </TableHead>
              ))}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {personas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={dynamicColumns.length + 3} className="text-center text-muted-foreground py-8">
                  No se encontraron personas.
                </TableCell>
              </TableRow>
            ) : (
              personas.map((p) => (
                <TableRow key={p.id} className={`${p.deleted_at ? 'opacity-50' : ''} ${selected.has(p.id) ? 'bg-muted/50' : ''}`}>
                  <TableCell className="sticky left-0 bg-background z-10">
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                    />
                  </TableCell>
                  <TableCell className="sticky left-10 bg-background z-10">
                    <Link href={`/admin/personas/${p.id}`} className="font-medium hover:underline flex items-center gap-2">
                      <PersonaAvatar nombre={p.nombre} apellido={p.apellido} className="h-8 w-8 shrink-0" />
                      {p.apellido}, {p.nombre}
                    </Link>
                  </TableCell>
                  {dynamicColumns.map((col) => (
                    <TableCell key={col.id} className="text-muted-foreground">
                      {renderCellValue(p, col.id)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/personas/${p.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {!p.deleted_at && p.estado === 'activo' && (
                          <DropdownMenuItem onClick={() => handleCambiarEstado(p.id, 'pausado')}>
                            <CirclePause className="mr-2 h-4 w-4" />
                            Pausar
                          </DropdownMenuItem>
                        )}
                        {!p.deleted_at && p.estado === 'pausado' && (
                          <DropdownMenuItem onClick={() => handleCambiarEstado(p.id, 'activo')}>
                            <CirclePlay className="mr-2 h-4 w-4" />
                            Reactivar
                          </DropdownMenuItem>
                        )}
                        {p.deleted_at ? (
                          <DropdownMenuItem onClick={() => handleRestore(p.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restaurar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        )}
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
        total={personas.length}
        onSelectAll={selectAll}
        onClear={clearSelection}
        getData={getExportData}
      />

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} persona{total !== 1 ? 's' : ''} en total
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

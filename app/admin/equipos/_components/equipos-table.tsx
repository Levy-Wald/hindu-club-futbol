'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users } from 'lucide-react'
import { useVistasColumns } from '@/components/ui/vistas-panel'
import { EQUIPOS_DEFAULT_COLUMNS } from '@/lib/vistas/column-defs'

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
  const { isVisible } = useVistasColumns('equipos-columns', EQUIPOS_DEFAULT_COLUMNS)
  return (
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
              <TableHead>Nombre</TableHead>
              {isVisible('categoria') && <TableHead>Categoría</TableHead>}
              {isVisible('disciplina') && <TableHead>Disciplina</TableHead>}
              {isVisible('modalidad') && <TableHead>Modalidad</TableHead>}
              {isVisible('miembros') && <TableHead className="text-center">Miembros</TableHead>}
              {isVisible('estado') && <TableHead>Estado</TableHead>}
              {isVisible('color') && <TableHead>Color</TableHead>}
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
                <TableRow key={e.id} className={!e.activo ? 'opacity-50' : ''}>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

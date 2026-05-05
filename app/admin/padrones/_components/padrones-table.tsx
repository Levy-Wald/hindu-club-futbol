'use client'

import Link from 'next/link'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Power } from 'lucide-react'
import { toggleActivoPadron } from '../_actions'
import { toast } from 'sonner'
import { useGenericColumnConfig } from '@/components/ui/column-config-generic'
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
  const { isVisible } = useGenericColumnConfig('padrones-columns', PADRONES_COLUMNS)

  async function handleToggle(id: string) {
    const result = await toggleActivoPadron(id)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
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
      <div className="hidden sm:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableRow key={p.id} className={!p.activo ? 'opacity-50' : ''}>
                  <TableCell>
                    <Link href={`/admin/padrones/${p.id}`} className="font-medium hover:underline">
                      {p.nombre}
                    </Link>
                  </TableCell>
                  {isVisible('tipo') && (
                    <TableCell className="text-muted-foreground">
                      {p.tipo ? TIPO_LABELS[p.tipo] ?? p.tipo : '—'}
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
                        <DropdownMenuItem onClick={() => handleToggle(p.id)}>
                          <Power className="mr-2 h-4 w-4" />
                          {p.activo ? 'Desactivar' : 'Activar'}
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

      {/* Footer count */}
      <p className="text-sm text-muted-foreground">
        {padrones.length} padr{padrones.length !== 1 ? 'ones' : 'on'} en total
      </p>
    </div>
  )
}

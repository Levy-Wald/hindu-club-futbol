'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { PersonaAvatar } from './persona-avatar'
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { softDeletePersona, restaurarPersona } from '../_actions'
import { toast } from 'sonner'

interface Atributo {
  atributo_slug: string
  activo: boolean
}

interface Persona {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  email_principal: string | null
  telefono_principal: string | null
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

export function PersonasTable({ personas, total, page, pageSize }: PersonasTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(total / pageSize)

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
              <TableHead className="w-12" />
              <TableHead>{sortButton('apellido', 'Nombre')}</TableHead>
              <TableHead>{sortButton('numero_documento', 'Documento')}</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Atributos</TableHead>
              <TableHead>{sortButton('estado', 'Estado')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {personas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No se encontraron personas.
                </TableCell>
              </TableRow>
            ) : (
              personas.map((p) => (
                <TableRow key={p.id} className={p.deleted_at ? 'opacity-50' : ''}>
                  <TableCell>
                    <PersonaAvatar nombre={p.nombre} apellido={p.apellido} className="h-8 w-8" />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/personas/${p.id}`} className="font-medium hover:underline">
                      {p.apellido}, {p.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.numero_documento ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{p.email_principal ?? '—'}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.deleted_at ? 'destructive' : p.estado === 'activo' ? 'default' : 'secondary'}>
                      {p.deleted_at ? 'eliminada' : p.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/personas/${p.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
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

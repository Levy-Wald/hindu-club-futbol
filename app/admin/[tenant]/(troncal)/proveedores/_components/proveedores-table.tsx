'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { toggleActivoProveedor, eliminarProveedor } from '../_actions'
import type { ProveedorRow } from '../_lib/queries'

function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

interface ProveedoresTableProps {
  proveedores: ProveedorRow[]
}

export function ProveedoresTable({ proveedores }: ProveedoresTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [proveedorAEliminar, setProveedorAEliminar] = useState<ProveedorRow | null>(null)

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleActivoProveedor(id)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  function handleEliminar() {
    if (!proveedorAEliminar) return
    startTransition(async () => {
      const result = await eliminarProveedor(proveedorAEliminar.id)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
      setProveedorAEliminar(null)
    })
  }

  return (
    <div className="space-y-4">
      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {proveedores.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No se encontraron proveedores.</p>
        ) : (
          proveedores.map((p) => (
            <Link
              key={p.id}
              href={`/admin/proveedores/${p.id}`}
              className={`block rounded-lg border p-3 ${!p.activo ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.nombre}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {p.cuit ?? '—'} · {p.email ?? p.telefono ?? '—'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium tabular-nums">{formatARS(p.saldo)}</p>
                  <p className="text-xs text-muted-foreground">{p.productos_count} prod.</p>
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
              <TableHead>Nombre</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="text-right">Saldo CC</TableHead>
              <TableHead className="text-right">Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {proveedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                  No se encontraron proveedores.
                </TableCell>
              </TableRow>
            ) : (
              proveedores.map((p) => (
                <TableRow key={p.id} className={!p.activo ? 'opacity-50' : ''}>
                  <TableCell>
                    <Link href={`/admin/proveedores/${p.id}`} className="font-medium hover:underline">
                      {p.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.cuit ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{p.email ?? p.telefono ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatARS(p.saldo)}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.productos_count}</TableCell>
                  <TableCell>
                    <Badge variant={p.activo ? 'default' : 'secondary'}>
                      {p.activo ? 'activo' : 'inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/proveedores/${p.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Ver / editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(p.id)} disabled={isPending}>
                          <Power className="mr-2 h-4 w-4" />
                          {p.activo ? 'Desactivar' : 'Activar'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setProveedorAEliminar(p)}
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

      {/* Footer count */}
      <p className="text-sm text-muted-foreground">
        {proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''} en total
      </p>

      {/* Confirmar eliminación */}
      <AlertDialog open={!!proveedorAEliminar} onOpenChange={(open) => { if (!open) setProveedorAEliminar(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{proveedorAEliminar?.nombre}</strong>. Esta acción no se puede deshacer fácilmente.
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

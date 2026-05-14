'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { MoreHorizontal, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarCaja, reactivarCaja } from '@/modules/finanzas/lib/actions'
import { CajaFormDialog } from '@/modules/finanzas/ui/caja-form'

interface CajaActionsProps {
  caja: {
    id: string
    nombre: string
    tipo: string
    tipo_fiscal: string
    moneda: string
    cuenta_id: string | null
    responsable_id: string | null
    entidad_id: string | null
    actividad_slug: string | null
    banco_nombre: string | null
    cbu: string | null
    numero_cuenta: string | null
    descripcion: string | null
    activa: boolean
    deleted_at: string | null
    saldo_actual: number | null
  }
  entidades: { id: string; nombre: string; tipo: string }[]
  personas: { id: string; nombre: string; apellido: string }[]
  cuentas: { id: string; codigo: string; nombre: string }[]
  actividadesSugeridas: string[]
}

export function CajaActions({ caja, entidades, personas, cuentas, actividadesSugeridas }: CajaActionsProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isDeleted = !!caja.deleted_at

  function handleDelete() {
    startTransition(async () => {
      const res = await eliminarCaja(caja.id)
      if (res.success) {
        toast.success('Caja eliminada')
        router.refresh()
      } else {
        toast.error(res.error ?? 'Error al eliminar')
      }
      setShowDelete(false)
    })
  }

  function handleReactivar() {
    startTransition(async () => {
      const res = await reactivarCaja(caja.id)
      if (res.success) {
        toast.success('Caja reactivada')
        router.refresh()
      } else {
        toast.error(res.error ?? 'Error al reactivar')
      }
    })
  }

  if (isDeleted) {
    return (
      <Button variant="ghost" size="sm" onClick={handleReactivar} disabled={isPending}>
        <RotateCcw className="h-4 w-4 mr-1" />
        Reactivar
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        } />
        <DropdownMenuContent align="end">
          <CajaFormDialog
            caja={caja}
            entidades={entidades}
            personas={personas}
            cuentas={cuentas}
            actividadesSugeridas={actividadesSugeridas}
            trigger={
              <DropdownMenuItem onSelect={e => e.preventDefault()}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar caja</AlertDialogTitle>
            <AlertDialogDescription>
              Se marcara la caja &quot;{caja.nombre}&quot; como eliminada.
              {(caja.saldo_actual ?? 0) !== 0 && (
                <> Esta caja tiene saldo distinto de cero. Considere transferir el saldo antes de eliminarla.</>
              )}
              {' '}Podras reactivarla desde el filtro &quot;Eliminadas&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarCaja, reactivarCaja } from '@/modules/finanzas/lib/actions'

interface CajaDetailActionsProps {
  cajaId: string
  cajaName: string
  isDeleted: boolean
  saldo: number | null
}

export function CajaDetailActions({ cajaId, cajaName, isDeleted, saldo }: CajaDetailActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const res = await eliminarCaja(cajaId)
      if (res.success) {
        toast.success('Caja eliminada')
        router.push('/admin/finanzas/cajas')
      } else {
        toast.error(res.error ?? 'Error al eliminar')
      }
    })
  }

  function handleReactivar() {
    startTransition(async () => {
      const res = await reactivarCaja(cajaId)
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
      <Button variant="outline" size="sm" onClick={handleReactivar} disabled={isPending}>
        <RotateCcw className="h-4 w-4 mr-1" />
        Reactivar
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={
        <Button variant="outline" size="sm" className="text-destructive">
          <Trash2 className="h-4 w-4 mr-1" />
          Eliminar
        </Button>
      } />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar caja</AlertDialogTitle>
          <AlertDialogDescription>
            Se marcara la caja &quot;{cajaName}&quot; como eliminada.
            {(saldo ?? 0) !== 0 && (
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
  )
}

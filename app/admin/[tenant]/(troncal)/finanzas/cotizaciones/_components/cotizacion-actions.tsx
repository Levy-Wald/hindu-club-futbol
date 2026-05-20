'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarCotizacion } from '@/modules/finanzas/lib/actions'

interface CotizacionActionsProps {
  cotizacion: { id: string; moneda: string; fecha: string }
}

export function CotizacionActions({ cotizacion }: CotizacionActionsProps) {
  const [pending, startTransition] = useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger render={
        <Button variant="ghost" size="sm" disabled={pending}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      } />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar cotizacion</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminara la cotizacion de {cotizacion.moneda} del {cotizacion.fecha}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              startTransition(async () => {
                const res = await eliminarCotizacion(cotizacion.id)
                if (res.success) toast.success('Cotizacion eliminada')
                else toast.error(res.error)
              })
            }}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

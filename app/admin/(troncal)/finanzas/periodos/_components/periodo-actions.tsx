'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Lock, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { cerrarPeriodo, reabrirPeriodo } from '@/modules/finanzas/lib/actions'

interface PeriodoActionsProps {
  periodo: { id: string; estado: string; anio: number; mes: number }
}

export function PeriodoActions({ periodo }: PeriodoActionsProps) {
  const [pending, startTransition] = useTransition()

  if (periodo.estado === 'abierto') {
    return (
      <AlertDialog>
        <AlertDialogTrigger render={
          <Button variant="outline" size="sm" disabled={pending}>
            <Lock className="h-3.5 w-3.5 mr-1" />
            Cerrar
          </Button>
        } />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar periodo {periodo.anio}-{String(periodo.mes).padStart(2, '0')}</AlertDialogTitle>
            <AlertDialogDescription>
              Al cerrar el periodo, no se podran crear movimientos con fecha en este mes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                startTransition(async () => {
                  const res = await cerrarPeriodo(periodo.id)
                  if (res.success) toast.success('Periodo cerrado')
                  else toast.error(res.error)
                })
              }}
            >
              Cerrar periodo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={
        <Button variant="outline" size="sm" disabled={pending}>
          <Unlock className="h-3.5 w-3.5 mr-1" />
          Reabrir
        </Button>
      } />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reabrir periodo {periodo.anio}-{String(periodo.mes).padStart(2, '0')}</AlertDialogTitle>
          <AlertDialogDescription className="text-destructive">
            Reabrir un periodo cerrado permite crear y modificar movimientos en ese mes.
            Use esta opcion solo para correcciones.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              startTransition(async () => {
                const res = await reabrirPeriodo(periodo.id)
                if (res.success) toast.success('Periodo reabierto')
                else toast.error(res.error)
              })
            }}
          >
            Reabrir periodo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

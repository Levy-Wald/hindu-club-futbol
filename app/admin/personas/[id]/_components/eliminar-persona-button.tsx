'use client'

import { useTransition } from 'react'
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
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { softDeletePersona } from '../../_actions'

interface EliminarPersonaButtonProps {
  personaId: string
}

export function EliminarPersonaButton({ personaId }: EliminarPersonaButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleEliminar() {
    startTransition(async () => {
      const result = await softDeletePersona(personaId)
      if (result.ok) {
        toast.success('Persona eliminada')
        router.push('/admin/personas')
      } else {
        toast.error(result.message ?? 'Error al eliminar la persona')
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" disabled={isPending} />}>
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin sm:mr-2" />
        ) : (
          <Trash2 className="h-3.5 w-3.5 sm:mr-2" />
        )}
        <span className="hidden sm:inline">Eliminar</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar persona?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción marcará la persona como eliminada. No se borrará permanentemente, pero
            quedará fuera de operación y no aparecerá en los listados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEliminar}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
          >
            Sí, eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

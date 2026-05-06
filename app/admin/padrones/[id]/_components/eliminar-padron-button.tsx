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
import { Trash2 } from 'lucide-react'
import { eliminarPadron } from '../../_actions'
import { toast } from 'sonner'

interface EliminarPadronButtonProps {
  padronId: string
  padronNombre: string
}

export function EliminarPadronButton({ padronId, padronNombre }: EliminarPadronButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await eliminarPadron(padronId)
      if (result.ok) {
        toast.success(result.message)
        router.push('/admin/padrones')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        />}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Eliminar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar &ldquo;{padronNombre}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción es permanente. El padrón quedará marcado como eliminado y no aparecerá en el listado. Los miembros asociados no se eliminan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Eliminando...' : 'Sí, eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

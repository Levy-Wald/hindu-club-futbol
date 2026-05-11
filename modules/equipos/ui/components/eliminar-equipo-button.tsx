'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarEquipo } from '@/modules/equipos/lib/actions'

interface EliminarEquipoButtonProps {
  equipoId: string
  equipoNombre: string
}

export function EliminarEquipoButton({ equipoId, equipoNombre }: EliminarEquipoButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function handleConfirmar() {
    startTransition(async () => {
      const result = await eliminarEquipo(equipoId)
      if (result.ok) {
        toast.success(result.message)
        setOpen(false)
        router.push('/admin/equipos')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar equipo
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar equipo</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que querés eliminar <strong>{equipoNombre}</strong>? Esta acción desactiva el equipo y no se puede deshacer fácilmente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmar} disabled={isPending}>
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

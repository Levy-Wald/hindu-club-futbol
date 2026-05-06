'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MoreHorizontal, Pencil, XCircle } from 'lucide-react'
import { rescindirContrato } from '@/app/admin/rrhh/_actions'
import { toast } from 'sonner'

interface ContratoRowActionsProps {
  contratoId: string
  estado: string
}

export function ContratoRowActions({ contratoId, estado }: ContratoRowActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rescindirOpen, setRescindirOpen] = useState(false)
  const [motivo, setMotivo] = useState('')

  function handleRescindir() {
    if (!motivo.trim()) {
      toast.error('El motivo de rescision es obligatorio')
      return
    }
    startTransition(async () => {
      const result = await rescindirContrato(contratoId, motivo.trim())
      if (result.success) {
        toast.success('Contrato rescindido')
        setRescindirOpen(false)
        setMotivo('')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Error al rescindir contrato')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending} />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Acciones</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/admin/rrhh/contratos/${contratoId}`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          {estado === 'vigente' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setRescindirOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rescindir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={rescindirOpen} onOpenChange={setRescindirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rescindir contrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Motivo de rescision</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ingrese el motivo..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescindirOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRescindir} disabled={isPending}>
              {isPending ? 'Rescindiendo...' : 'Confirmar rescision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

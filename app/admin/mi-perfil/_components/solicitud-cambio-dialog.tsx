'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { solicitarCambioDatos } from '../_actions'

interface SolicitudCambioDialogProps {
  campo: string
  valorActual: string
  open: boolean
  onClose: () => void
}

const LABELS: Record<string, string> = {
  numero_documento: 'Número de documento',
  cuil_cuit: 'CUIL/CUIT',
  nombre_completo_legal: 'Nombre legal completo',
}

export function SolicitudCambioDialog({ campo, valorActual, open, onClose }: SolicitudCambioDialogProps) {
  const [valorNuevo, setValorNuevo] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleEnviar() {
    if (!valorNuevo.trim()) {
      toast.error('Ingresá el valor nuevo')
      return
    }
    startTransition(async () => {
      const result = await solicitarCambioDatos(campo, valorActual, valorNuevo.trim())
      if (result.ok) {
        toast.success(result.message)
        onClose()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar cambio de {LABELS[campo] || campo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Valor actual</Label>
            <p className="text-sm font-medium">{valorActual || '-'}</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="valor-nuevo">Valor nuevo</Label>
            <Input
              id="valor-nuevo"
              value={valorNuevo}
              onChange={(e) => setValorNuevo(e.target.value)}
              placeholder="Ingresá el valor correcto"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Un administrador revisará tu solicitud y aprobará el cambio si corresponde.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleEnviar} disabled={isPending}>
            {isPending ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { agregarCategoriaAction } from '../lib/actions'

export function ModalAgregarCategoria({
  torneoId,
  onClose,
}: {
  torneoId: string
  onClose: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [nombre, setNombre] = useState('')
  const [maxEquipos, setMaxEquipos] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    startTransition(async () => {
      const result = await agregarCategoriaAction({
        torneo_id: torneoId,
        nombre: nombre.trim(),
        num_equipos_max: maxEquipos ? parseInt(maxEquipos) : undefined,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      router.refresh()
      onClose()
    })
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent data-testid="modal-agregar-categoria">
        <DialogHeader>
          <DialogTitle>Agregar categoria</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              data-testid="input-categoria-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Sub-15"
            />
          </div>
          <div>
            <Label>Max equipos (opcional)</Label>
            <Input
              type="number"
              value={maxEquipos}
              onChange={(e) => setMaxEquipos(e.target.value)}
              placeholder="Sin limite"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            data-testid="btn-crear-categoria"
          >
            {isPending ? 'Creando...' : 'Crear'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

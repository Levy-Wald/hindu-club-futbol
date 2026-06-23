'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PackageCheck } from 'lucide-react'
import { toast } from 'sonner'
import { registrarRecepcion } from '../../../_actions'

interface ItemPend {
  id: string
  descripcion: string
  cantidad: number
  cantidad_recibida: number
}

export function RecepcionDialog({ ocId, items }: { ocId: string; items: ItemPend[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [notas, setNotas] = useState('')
  const pendientes = items.map((i) => ({ ...i, pendiente: i.cantidad - i.cantidad_recibida }))
  const [recibir, setRecibir] = useState<Record<string, string>>(
    Object.fromEntries(pendientes.map((i) => [i.id, String(Math.max(0, i.pendiente))])),
  )

  function handleSubmit() {
    startTransition(async () => {
      const r = await registrarRecepcion(ocId, {
        notas: notas || undefined,
        items: pendientes.map((i) => ({ oc_item_id: i.id, cantidad_recibida: Number(recibir[i.id]) || 0 })),
      })
      if (r.ok) {
        toast.success(r.message)
        setOpen(false)
      } else {
        toast.error(r.message)
      }
    })
  }

  const hayPendiente = pendientes.some((i) => i.pendiente > 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" disabled={!hayPendiente} />}>
        <PackageCheck className="h-4 w-4 mr-1" />
        Registrar recepción
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar recepción</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {pendientes.map((i) => (
              <div key={i.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{i.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    Pedido {i.cantidad} · recibido {i.cantidad_recibida} · pendiente {i.pendiente}
                  </p>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={i.pendiente}
                  step="any"
                  className="w-24"
                  value={recibir[i.id] ?? '0'}
                  disabled={i.pendiente <= 0}
                  onChange={(e) => setRecibir((prev) => ({ ...prev, [i.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rec-notas">Notas</Label>
            <Input id="rec-notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Remito, observaciones..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

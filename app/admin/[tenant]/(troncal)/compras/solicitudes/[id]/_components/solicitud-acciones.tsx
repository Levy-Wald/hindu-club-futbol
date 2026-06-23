'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Send, ShoppingCart, X } from 'lucide-react'
import { toast } from 'sonner'
import { enviarSolicitud, cancelarSolicitud, convertirSolicitudAOC } from '../../../_actions'

interface Props {
  solicitudId: string
  estado: string
  proveedores: Array<{ id: string; nombre: string }>
}

export function SolicitudAcciones({ solicitudId, estado, proveedores }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [proveedorId, setProveedorId] = useState('')

  const cerrada = estado === 'convertida' || estado === 'cancelada'

  function handleEnviar() {
    startTransition(async () => {
      const r = await enviarSolicitud(solicitudId)
      r.ok ? toast.success(r.message) : toast.error(r.message)
    })
  }

  function handleCancelar() {
    startTransition(async () => {
      const r = await cancelarSolicitud(solicitudId)
      r.ok ? toast.success(r.message) : toast.error(r.message)
    })
  }

  function handleConvertir() {
    startTransition(async () => {
      const r = await convertirSolicitudAOC(solicitudId, proveedorId)
      if (r.ok) {
        toast.success(r.message)
        setOpen(false)
        const oc = r.data as { id: string } | undefined
        if (oc?.id) router.push(`/admin/compras/ordenes/${oc.id}`)
      } else {
        toast.error(r.message)
      }
    })
  }

  if (cerrada) return null

  return (
    <div className="flex items-center gap-2">
      {estado === 'borrador' && (
        <Button variant="outline" size="sm" onClick={handleEnviar} disabled={isPending}>
          <Send className="h-4 w-4 mr-1" />
          Enviar
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="sm" />}>
          <ShoppingCart className="h-4 w-4 mr-1" />
          Convertir a OC
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir solicitud en orden de compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <select
                className="w-full h-9 rounded-md border bg-transparent px-2 text-sm"
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
              >
                <option value="">— Elegir —</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Se crea una OC borrador con los ítems de la solicitud. Después cargás precios y la emitís.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleConvertir} disabled={isPending || !proveedorId}>
                {isPending ? 'Creando...' : 'Crear OC'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="ghost" size="sm" onClick={handleCancelar} disabled={isPending} className="text-destructive">
        <X className="h-4 w-4 mr-1" />
        Cancelar
      </Button>
    </div>
  )
}

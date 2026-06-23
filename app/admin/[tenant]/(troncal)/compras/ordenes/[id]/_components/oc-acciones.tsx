'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { emitirOrdenCompra, cancelarOrdenCompra } from '../../../_actions'
import { RecepcionDialog } from './recepcion-dialog'
import { FacturaDialog } from './factura-dialog'

interface ItemPend {
  id: string
  descripcion: string
  cantidad: number
  cantidad_recibida: number
}

interface Props {
  ocId: string
  estado: string
  total: number
  facturaRegistrada: boolean
  facturaNumero: string | null
  items: ItemPend[]
}

export function OcAcciones({ ocId, estado, total, facturaRegistrada, facturaNumero, items }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleEmitir() {
    startTransition(async () => {
      const r = await emitirOrdenCompra(ocId)
      r.ok ? toast.success(r.message) : toast.error(r.message)
    })
  }

  function handleCancelar() {
    startTransition(async () => {
      const r = await cancelarOrdenCompra(ocId)
      r.ok ? toast.success(r.message) : toast.error(r.message)
    })
  }

  const recibible = estado === 'emitida' || estado === 'recibida_parcial'
  const facturable = estado !== 'borrador' && estado !== 'cancelada'
  const cancelable = estado === 'borrador' || estado === 'emitida'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {estado === 'borrador' && (
        <Button size="sm" onClick={handleEmitir} disabled={isPending}>
          <Send className="h-4 w-4 mr-1" />
          Emitir OC
        </Button>
      )}

      {recibible && <RecepcionDialog ocId={ocId} items={items} />}

      {facturable && (
        <FacturaDialog ocId={ocId} yaRegistrada={facturaRegistrada} defaultTotal={total} defaultNumero={facturaNumero} />
      )}

      {cancelable && (
        <Button variant="ghost" size="sm" onClick={handleCancelar} disabled={isPending} className="text-destructive">
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { CreditCard } from 'lucide-react'
import { iniciarPagoCuota } from '../_actions'

interface Props {
  cuotaId: string
  periodo: string | null
  monto: number
  moneda: string
  montoLabel: string
}

// El botón consume el PaymentAdapter (F5 pre-cableado). Hoy el adapter mock
// devuelve disponible=false → mostramos el aviso. Cuando MercadoPago esté activo
// (F5), el adapter devolverá una URL y redirigimos al checkout — sin tocar esta UI.
export function PagarCuotaButton({ cuotaId, periodo, monto, moneda, montoLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePagar() {
    startTransition(async () => {
      const r = await iniciarPagoCuota({ cuotaId, periodo, monto, moneda })
      if (r.disponible && r.url) {
        window.location.href = r.url
        return
      }
      setMensaje(r.error ?? 'El pago online todavía no está disponible.')
      setOpen(true)
    })
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handlePagar} disabled={isPending}>
        <CreditCard className="h-4 w-4 mr-1" />
        {isPending ? '...' : 'Pagar'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pago de cuota {periodo ?? ''}</DialogTitle>
            <DialogDescription>Monto: {montoLabel}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="rounded-md border bg-muted/40 p-3 text-muted-foreground">{mensaje}</p>
            <p className="text-xs text-muted-foreground">
              Por ahora podés abonar en administración o por transferencia.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Entendido</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

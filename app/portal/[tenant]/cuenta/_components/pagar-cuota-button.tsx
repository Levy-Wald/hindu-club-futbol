'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreditCard } from 'lucide-react'

interface Props {
  periodo: string | null
  monto: string
}

// Pago mock: el cobro online real (MercadoPago) se habilita en F5, bloqueado por
// el CUIT en trámite. No muta el estado de la cuota (eso corrompería la
// contabilidad del club): sólo muestra el flujo previsto.
export function PagarCuotaButton({ periodo, monto }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <CreditCard className="h-4 w-4 mr-1" />
        Pagar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pago de cuota {periodo ?? ''}</DialogTitle>
          <DialogDescription>Monto: {monto}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="rounded-md border bg-muted/40 p-3 text-muted-foreground">
            El pago online con tarjeta / MercadoPago se habilita próximamente. Por ahora podés
            abonar en administración o por transferencia.
          </p>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>Entendido</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Banknote } from 'lucide-react'
import { toast } from 'sonner'
import { pagarCuotaConvenio } from '@/modules/finanzas/lib/actions'

interface PagarCuotaConvenioDialogProps {
  convenioId: string
  cuotaNumero: number
  totalCuotas: number
  monto: number
  cajas: { id: string; nombre: string }[]
  mediosPago: { id: string; nombre: string }[]
}

export function PagarCuotaConvenioDialog({
  convenioId, cuotaNumero, totalCuotas, monto, cajas, mediosPago,
}: PagarCuotaConvenioDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [cajaId, setCajaId] = useState('')
  const [medioPagoId, setMedioPagoId] = useState('')

  function handleSubmit() {
    if (!cajaId || !medioPagoId) {
      toast.error('Selecciona caja y medio de pago')
      return
    }

    startTransition(async () => {
      const res = await pagarCuotaConvenio(convenioId, cajaId, medioPagoId)
      if (res.success) {
        toast.success(`Cuota ${cuotaNumero}/${totalCuotas} registrada`)
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Banknote className="h-4 w-4 mr-1" />
        Registrar pago
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar pago — Cuota {cuotaNumero}/{totalCuotas}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm">
            Monto: <strong>${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(monto)}</strong>
          </p>
          <div className="space-y-2">
            <Label>Caja</Label>
            <Select value={cajaId} onValueChange={v => setCajaId(v ?? '')}>
              <option value="">Seleccionar caja...</option>
              {cajas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Medio de pago</Label>
            <Select value={medioPagoId} onValueChange={v => setMedioPagoId(v ?? '')}>
              <option value="">Seleccionar...</option>
              {mediosPago.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? 'Registrando...' : 'Confirmar pago'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

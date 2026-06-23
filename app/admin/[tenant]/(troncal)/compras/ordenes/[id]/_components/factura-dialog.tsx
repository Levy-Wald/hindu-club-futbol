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
import { Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { registrarFactura } from '../../../_actions'

interface Props {
  ocId: string
  yaRegistrada: boolean
  defaultTotal: number
  defaultNumero?: string | null
}

export function FacturaDialog({ ocId, yaRegistrada, defaultTotal, defaultNumero }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [numero, setNumero] = useState(defaultNumero ?? '')
  const [fecha, setFecha] = useState('')
  const [total, setTotal] = useState(String(defaultTotal || ''))

  function handleSubmit() {
    startTransition(async () => {
      const r = await registrarFactura(ocId, {
        factura_numero: numero,
        factura_fecha: fecha || undefined,
        factura_total: total ? Number(total) : undefined,
      })
      if (r.ok) {
        toast.success(r.message)
        setOpen(false)
      } else {
        toast.error(r.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Receipt className="h-4 w-4 mr-1" />
        {yaRegistrada ? 'Editar factura' : 'Registrar factura'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar factura del proveedor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fact-numero">Número de factura</Label>
            <Input id="fact-numero" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ej: A-0001-00012345" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fact-fecha">Fecha</Label>
              <Input id="fact-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fact-total">Total</Label>
              <Input id="fact-total" type="number" min="0" step="any" value={total} onChange={(e) => setTotal(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending || !numero.trim()}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

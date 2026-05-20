'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { actualizarCotizacion } from '@/modules/finanzas/lib/actions'

const MONEDAS_COTIZABLES = ['USD', 'EUR', 'BRL', 'UYU', 'CLP']

export function NuevaCotizacionDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const fecha = form.get('fecha') as string
    const moneda = form.get('moneda') as string
    const valorCompra = parseFloat(form.get('valor_compra') as string)
    const valorVenta = parseFloat(form.get('valor_venta') as string)
    const fuente = (form.get('fuente') as string) || 'Manual'

    startTransition(async () => {
      const res = await actualizarCotizacion(fecha, moneda, valorCompra, valorVenta, fuente)
      if (res.success) {
        toast.success('Cotizacion guardada')
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  const hoy = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" />
        Nueva cotizacion
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva cotizacion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input name="fecha" type="date" defaultValue={hoy} required />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select name="moneda" defaultValue="USD" required>
                {MONEDAS_COTIZABLES.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor compra</Label>
              <Input name="valor_compra" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-2">
              <Label>Valor venta</Label>
              <Input name="valor_venta" type="number" step="0.01" min="0.01" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fuente</Label>
            <Input name="fuente" defaultValue="Manual" placeholder="BCRA, Dolar Blue, Manual..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

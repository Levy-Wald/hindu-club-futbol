'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { abrirPeriodo } from '@/modules/finanzas/lib/actions'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function NuevoPeriodoDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const now = new Date()
  const defaultAnio = now.getFullYear()
  const defaultMes = now.getMonth() + 1

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const anio = parseInt(form.get('anio') as string)
    const mes = parseInt(form.get('mes') as string)

    startTransition(async () => {
      const res = await abrirPeriodo(anio, mes)
      if (res.success) {
        toast.success(`Periodo ${anio}-${String(mes).padStart(2, '0')} abierto`)
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" />
        Abrir periodo
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Abrir nuevo periodo contable</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anio">Ano</Label>
              <Input id="anio" name="anio" type="number" min={2000} max={2100} defaultValue={defaultAnio} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mes">Mes</Label>
              <Select name="mes" defaultValue={String(defaultMes)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((label, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Abriendo...' : 'Abrir periodo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

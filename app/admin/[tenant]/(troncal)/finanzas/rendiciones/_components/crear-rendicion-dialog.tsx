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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { crearRendicion } from '../_actions'

interface CentroCosto {
  id: string
  nombre: string
  codigo: string | null
}
interface ItemRow {
  descripcion: string
  categoria: string
  monto: string
  comprobante_ref: string
}

const filaVacia: ItemRow = { descripcion: '', categoria: '', monto: '', comprobante_ref: '' }

function ars(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

export function CrearRendicionDialog({ centros }: { centros: CentroCosto[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [notas, setNotas] = useState('')
  const [centroId, setCentroId] = useState('')
  const [items, setItems] = useState<ItemRow[]>([{ ...filaVacia }])

  function reset() {
    setNotas('')
    setCentroId('')
    setItems([{ ...filaVacia }])
  }

  function updateItem(idx: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const total = items.reduce((acc, it) => acc + (Number(it.monto) || 0), 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const r = await crearRendicion({
        notas: notas || undefined,
        centro_costo_id: centroId || undefined,
        items: items.map((it) => ({
          descripcion: it.descripcion,
          categoria: it.categoria || undefined,
          monto: Number(it.monto) || 0,
          comprobante_ref: it.comprobante_ref || undefined,
        })),
      })
      if (r.ok) {
        toast.success(r.message)
        setOpen(false)
        reset()
      } else {
        toast.error(r.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-4 w-4 mr-1" />
        Nueva rendición
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva rendición de gastos</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Centro de costo</Label>
              <select
                className="w-full h-9 rounded-md border bg-transparent px-2 text-sm"
                value={centroId}
                onChange={(e) => setCentroId(e.target.value)}
              >
                <option value="">— Sin imputar —</option>
                {centros.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}{c.codigo ? ` (${c.codigo})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={1} placeholder="Motivo / detalle" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Gastos</Label>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Input value={it.descripcion} onChange={(e) => updateItem(idx, { descripcion: e.target.value })} placeholder="Descripción" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={it.categoria} onChange={(e) => updateItem(idx, { categoria: e.target.value })} placeholder="Categoría (opc.)" />
                      <Input value={it.comprobante_ref} onChange={(e) => updateItem(idx, { comprobante_ref: e.target.value })} placeholder="Comprobante (opc.)" />
                    </div>
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs text-muted-foreground">Monto</Label>
                    <Input type="number" min="0" step="any" value={it.monto} onChange={(e) => updateItem(idx, { monto: e.target.value })} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive"
                    onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))}
                    aria-label="Quitar gasto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, { ...filaVacia }])}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar gasto
              </Button>
              <p className="text-sm font-medium">Total: <span className="tabular-nums">{ars(total)}</span></p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Creando...' : 'Crear'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

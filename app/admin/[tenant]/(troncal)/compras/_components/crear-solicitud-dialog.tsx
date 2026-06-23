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
import { crearSolicitud } from '../_actions'

interface ProductoOption {
  id: string
  nombre: string
  sku: string | null
  precio_compra: number
}

interface ItemRow {
  producto_id: string
  descripcion: string
  cantidad: string
}

const filaVacia: ItemRow = { producto_id: '', descripcion: '', cantidad: '1' }

export function CrearSolicitudDialog({ productos }: { productos: ProductoOption[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState<ItemRow[]>([{ ...filaVacia }])

  function reset() {
    setNotas('')
    setItems([{ ...filaVacia }])
  }

  function updateItem(idx: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function onProductoChange(idx: number, productoId: string) {
    const prod = productos.find((p) => p.id === productoId)
    updateItem(idx, {
      producto_id: productoId,
      descripcion: prod ? prod.nombre : items[idx].descripcion,
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await crearSolicitud({
        notas: notas || undefined,
        items: items.map((it) => ({
          producto_id: it.producto_id || null,
          descripcion: it.descripcion,
          cantidad: Number(it.cantidad) || 0,
        })),
      })
      if (result.ok) {
        toast.success(result.message)
        setOpen(false)
        reset()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-4 w-4 mr-1" />
        Nueva solicitud
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva solicitud de compra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Motivo o detalle de la solicitud" rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Ítems</Label>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <select
                      className="w-full h-9 rounded-md border bg-transparent px-2 text-sm"
                      value={it.producto_id}
                      onChange={(e) => onProductoChange(idx, e.target.value)}
                    >
                      <option value="">— Producto (opcional) —</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}{p.sku ? ` (${p.sku})` : ''}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={it.descripcion}
                      onChange={(e) => updateItem(idx, { descripcion: e.target.value })}
                      placeholder="Descripción del ítem"
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={it.cantidad}
                      onChange={(e) => updateItem(idx, { cantidad: e.target.value })}
                      placeholder="Cant."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive"
                    onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, { ...filaVacia }])}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar ítem
            </Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creando...' : 'Crear solicitud'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

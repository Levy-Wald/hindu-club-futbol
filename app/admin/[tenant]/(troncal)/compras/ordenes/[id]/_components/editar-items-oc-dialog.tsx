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
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { actualizarItemsOC } from '../../../_actions'

interface ProductoOption {
  id: string
  nombre: string
  sku: string | null
  precio_compra: number
}
interface ItemActual {
  id: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  producto: { id: string } | null
}
interface ItemRow {
  producto_id: string
  descripcion: string
  cantidad: string
  precio_unitario: string
}

function formatARS(amount: number, moneda = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(amount)
}

export function EditarItemsOcDialog({
  ocId,
  moneda,
  itemsActuales,
  productos,
}: {
  ocId: string
  moneda: string
  itemsActuales: ItemActual[]
  productos: ProductoOption[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [items, setItems] = useState<ItemRow[]>(
    itemsActuales.map((i) => ({
      producto_id: i.producto?.id ?? '',
      descripcion: i.descripcion,
      cantidad: String(i.cantidad),
      precio_unitario: String(i.precio_unitario),
    })),
  )

  function updateItem(idx: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function onProductoChange(idx: number, productoId: string) {
    const prod = productos.find((p) => p.id === productoId)
    updateItem(idx, {
      producto_id: productoId,
      descripcion: prod ? prod.nombre : items[idx].descripcion,
      precio_unitario: prod && prod.precio_compra ? String(prod.precio_compra) : items[idx].precio_unitario,
    })
  }

  const total = items.reduce((acc, it) => acc + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0), 0)

  function handleSubmit() {
    startTransition(async () => {
      const r = await actualizarItemsOC(
        ocId,
        items.map((it) => ({
          producto_id: it.producto_id || null,
          descripcion: it.descripcion,
          cantidad: Number(it.cantidad) || 0,
          precio_unitario: Number(it.precio_unitario) || 0,
        })),
      )
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
        <Pencil className="h-4 w-4 mr-1" />
        Editar ítems
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar ítems de la orden</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
                <div className="w-16 space-y-1">
                  <Label className="text-xs text-muted-foreground">Cant.</Label>
                  <Input type="number" min="0" step="any" value={it.cantidad} onChange={(e) => updateItem(idx, { cantidad: e.target.value })} />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs text-muted-foreground">Precio</Label>
                  <Input type="number" min="0" step="any" value={it.precio_unitario} onChange={(e) => updateItem(idx, { precio_unitario: e.target.value })} />
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
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItems((prev) => [...prev, { producto_id: '', descripcion: '', cantidad: '1', precio_unitario: '0' }])}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar ítem
            </Button>
            <p className="text-sm font-medium">
              Total: <span className="tabular-nums">{formatARS(total, moneda)}</span>
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar ítems'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

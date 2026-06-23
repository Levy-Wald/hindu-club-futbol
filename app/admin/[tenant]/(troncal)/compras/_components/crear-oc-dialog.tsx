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
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { crearOrdenCompra } from '../_actions'

interface ProductoOption {
  id: string
  nombre: string
  sku: string | null
  precio_compra: number
}
interface ProveedorOption {
  id: string
  nombre: string
}

interface ItemRow {
  producto_id: string
  descripcion: string
  cantidad: string
  precio_unitario: string
}

const filaVacia: ItemRow = { producto_id: '', descripcion: '', cantidad: '1', precio_unitario: '0' }

function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

export function CrearOcDialog({
  proveedores,
  productos,
}: {
  proveedores: ProveedorOption[]
  productos: ProductoOption[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [proveedorId, setProveedorId] = useState('')
  const [moneda, setMoneda] = useState('ARS')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [items, setItems] = useState<ItemRow[]>([{ ...filaVacia }])

  function reset() {
    setProveedorId('')
    setMoneda('ARS')
    setFechaEntrega('')
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
      precio_unitario: prod && prod.precio_compra ? String(prod.precio_compra) : items[idx].precio_unitario,
    })
  }

  const total = items.reduce((acc, it) => acc + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0), 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await crearOrdenCompra({
        proveedor_entidad_id: proveedorId,
        moneda,
        fecha_entrega_estimada: fechaEntrega || undefined,
        items: items.map((it) => ({
          producto_id: it.producto_id || null,
          descripcion: it.descripcion,
          cantidad: Number(it.cantidad) || 0,
          precio_unitario: Number(it.precio_unitario) || 0,
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
        Nueva orden
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva orden de compra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2 sm:col-span-1">
              <Label>Proveedor</Label>
              <select
                className="w-full h-9 rounded-md border bg-transparent px-2 text-sm"
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                required
              >
                <option value="">— Elegir —</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <select
                className="w-full h-9 rounded-md border bg-transparent px-2 text-sm"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Entrega estimada</Label>
              <Input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
            </div>
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
              <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, { ...filaVacia }])}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar ítem
              </Button>
              <p className="text-sm font-medium">
                Total: <span className="tabular-nums">{formatARS(total)}</span>
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !proveedorId}>
              {isPending ? 'Creando...' : 'Crear orden'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

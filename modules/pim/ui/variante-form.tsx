'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { crearVarianteAction, editarVarianteAction } from '../lib/actions'
import type { ProductoVariante } from '../lib/tipos'
import { useRouter } from 'next/navigation'

interface VarianteFormDialogProps {
  mode: 'create' | 'edit'
  productoId: string
  variante?: ProductoVariante
  triggerRender?: React.ReactElement
  triggerLabel?: string
}

export function VarianteFormDialog({
  mode,
  productoId,
  variante,
  triggerRender,
  triggerLabel,
}: VarianteFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [skuVariante, setSkuVariante] = useState(variante?.sku_variante ?? '')
  const [nombreVariante, setNombreVariante] = useState(variante?.nombre_variante ?? '')
  const [precioDifArs, setPrecioDifArs] = useState(variante?.precio_diferencial_ars?.toString() ?? '')
  const [precioDifUsd, setPrecioDifUsd] = useState(variante?.precio_diferencial_usd?.toString() ?? '')
  const [stockVar, setStockVar] = useState(variante?.stock_simple_variante?.toString() ?? '')
  const [attrKeys, setAttrKeys] = useState<string[]>(
    variante?.atributos ? Object.keys(variante.atributos) : ['']
  )
  const [attrVals, setAttrVals] = useState<string[]>(
    variante?.atributos ? Object.values(variante.atributos) : ['']
  )

  function resetForm() {
    if (mode === 'create') {
      setSkuVariante('')
      setNombreVariante('')
      setPrecioDifArs('')
      setPrecioDifUsd('')
      setStockVar('')
      setAttrKeys([''])
      setAttrVals([''])
    }
    setError(null)
  }

  function addAttr() {
    setAttrKeys([...attrKeys, ''])
    setAttrVals([...attrVals, ''])
  }

  function updateAttrKey(i: number, val: string) {
    const next = [...attrKeys]
    next[i] = val
    setAttrKeys(next)
  }

  function updateAttrVal(i: number, val: string) {
    const next = [...attrVals]
    next[i] = val
    setAttrVals(next)
  }

  function removeAttr(i: number) {
    setAttrKeys(attrKeys.filter((_, idx) => idx !== i))
    setAttrVals(attrVals.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombreVariante.trim()) {
      setError('El nombre de la variante es obligatorio')
      return
    }

    const atributos: Record<string, string> = {}
    for (let i = 0; i < attrKeys.length; i++) {
      const k = attrKeys[i].trim()
      const v = attrVals[i].trim()
      if (k && v) atributos[k] = v
    }

    startTransition(async () => {
      const data = {
        producto_id: productoId,
        sku_variante: skuVariante.trim() || undefined,
        nombre_variante: nombreVariante.trim(),
        precio_diferencial_ars: precioDifArs ? parseFloat(precioDifArs) : null,
        precio_diferencial_usd: precioDifUsd ? parseFloat(precioDifUsd) : null,
        stock_simple_variante: stockVar ? parseFloat(stockVar) : null,
        atributos: Object.keys(atributos).length > 0 ? atributos : undefined,
      }

      const result =
        mode === 'edit' && variante
          ? await editarVarianteAction({ id: variante.id, ...data })
          : await crearVarianteAction(data)

      if (!result.ok) {
        setError(result.error)
        return
      }

      setOpen(false)
      resetForm()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setError(null) }}>
      <DialogTrigger render={triggerRender ?? <Button size="sm" data-testid="btn-nueva-variante" />}>
        {triggerLabel ?? (
          <>
            <Plus className="h-4 w-4 mr-1" />
            Nueva variante
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar variante' : 'Nueva variante'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="var-nombre">Nombre *</Label>
              <Input id="var-nombre" value={nombreVariante} onChange={(e) => setNombreVariante(e.target.value)} placeholder="Rojo M" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="var-sku">SKU variante</Label>
              <Input id="var-sku" value={skuVariante} onChange={(e) => setSkuVariante(e.target.value)} placeholder="CAM-ROJ-M" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="var-precio-ars">Dif. ARS</Label>
              <Input id="var-precio-ars" type="number" step="0.01" value={precioDifArs} onChange={(e) => setPrecioDifArs(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="var-precio-usd">Dif. USD</Label>
              <Input id="var-precio-usd" type="number" step="0.01" value={precioDifUsd} onChange={(e) => setPrecioDifUsd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="var-stock">Stock</Label>
              <Input id="var-stock" type="number" min="0" value={stockVar} onChange={(e) => setStockVar(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Atributos</Label>
            {attrKeys.map((k, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Clave (ej. color)"
                  value={k}
                  onChange={(e) => updateAttrKey(i, e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Valor (ej. rojo)"
                  value={attrVals[i]}
                  onChange={(e) => updateAttrVal(i, e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeAttr(i)} className="shrink-0">
                  x
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addAttr}>
              + Atributo
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar' : 'Crear variante'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

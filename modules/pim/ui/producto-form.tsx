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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus } from 'lucide-react'
import { crearProductoAction, editarProductoAction } from '../lib/actions'
import type { Producto, ProductoCategoria, UnidadMedida, Marca, ModoOperacion } from '../lib/tipos'
import { useRouter } from 'next/navigation'

const MODOS_LABELS: Record<ModoOperacion, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  prestamo: 'Préstamo',
  gratis: 'Gratis',
}

interface ProductoFormDialogProps {
  mode: 'create' | 'edit'
  producto?: Producto & { categorias?: { id: string }[] }
  categorias: ProductoCategoria[]
  unidades: UnidadMedida[]
  marcas: Marca[]
  triggerRender?: React.ReactElement
  triggerLabel?: string
}

export function ProductoFormDialog({
  mode,
  producto,
  categorias,
  unidades,
  marcas,
  triggerRender,
  triggerLabel,
}: ProductoFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [sku, setSku] = useState(producto?.sku ?? '')
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [tipo, setTipo] = useState<'producto' | 'servicio'>(producto?.tipo ?? 'producto')
  const [precioArs, setPrecioArs] = useState(producto?.precio_base_ars?.toString() ?? '')
  const [precioUsd, setPrecioUsd] = useState(producto?.precio_base_usd?.toString() ?? '')
  const [stock, setStock] = useState(producto?.stock_simple?.toString() ?? '')
  const [unidadSlug, setUnidadSlug] = useState(producto?.unidad_medida_slug ?? '')
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '')
  const [marcaId, setMarcaId] = useState(producto?.marca_id ?? '')
  const [modosDisp, setModosDisp] = useState<ModoOperacion[]>(
    producto?.modos_disponibles ?? ['venta']
  )
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(
    producto?.categorias?.map((c) => c.id) ?? []
  )

  function resetForm() {
    if (mode === 'create') {
      setSku('')
      setNombre('')
      setTipo('producto')
      setPrecioArs('')
      setPrecioUsd('')
      setStock('')
      setUnidadSlug('')
      setDescripcion('')
      setMarcaId('')
      setModosDisp(['venta'])
      setSelectedCatIds([])
    }
    setError(null)
  }

  function toggleModo(modo: ModoOperacion) {
    setModosDisp((prev) => {
      if (prev.includes(modo)) {
        if (prev.length <= 1) return prev // at least one required
        return prev.filter((m) => m !== modo)
      }
      return [...prev, modo]
    })
  }

  function toggleCat(catId: string) {
    setSelectedCatIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    startTransition(async () => {
      const data = {
        sku: sku.trim() || undefined,
        nombre: nombre.trim(),
        tipo,
        descripcion: descripcion.trim() || undefined,
        precio_base_ars: precioArs ? parseFloat(precioArs) : null,
        precio_base_usd: precioUsd ? parseFloat(precioUsd) : null,
        stock_simple: tipo === 'producto' && stock ? parseFloat(stock) : null,
        unidad_medida_slug: unidadSlug || undefined,
        categoria_ids: selectedCatIds,
        marca_id: marcaId || null,
        modos_disponibles: modosDisp,
      }

      const result =
        mode === 'edit' && producto
          ? await editarProductoAction({ id: producto.id, ...data })
          : await crearProductoAction(data)

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
      <DialogTrigger render={triggerRender ?? <Button data-testid="btn-nuevo-producto" />}>
        {triggerLabel ?? (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo producto
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="modal-producto">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="input-sku">SKU</Label>
              <Input id="input-sku" data-testid="input-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="OPC-001" />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="tipo" value="producto" checked={tipo === 'producto'} onChange={() => setTipo('producto')} />
                  Producto
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="tipo" value="servicio" checked={tipo === 'servicio'} onChange={() => setTipo('servicio')} />
                  Servicio
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="input-nombre-producto">Nombre *</Label>
            <Input id="input-nombre-producto" data-testid="input-nombre-producto" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Camiseta titular" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="precio-ars">Precio ARS</Label>
              <Input id="precio-ars" type="number" min="0" step="0.01" value={precioArs} onChange={(e) => setPrecioArs(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio-usd">Precio USD</Label>
              <Input id="precio-usd" type="number" min="0" step="0.01" value={precioUsd} onChange={(e) => setPrecioUsd(e.target.value)} />
            </div>
          </div>

          {tipo === 'producto' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="stock-inicial">Stock inicial</Label>
                <Input id="stock-inicial" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unidad-medida">Unidad de medida</Label>
                <Select value={unidadSlug} onValueChange={(v) => setUnidadSlug(v ?? '')}>
                  <SelectTrigger id="unidad-medida">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((u) => (
                      <SelectItem key={u.slug} value={u.slug}>
                        {u.nombre} {u.abreviatura ? `(${u.abreviatura})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {categorias.length > 0 && (
            <div className="space-y-2">
              <Label>Categorias</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {categorias.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedCatIds.includes(cat.id)}
                      onCheckedChange={() => toggleCat(cat.id)}
                    />
                    {cat.parent_id ? '  ' : ''}{cat.nombre}
                  </label>
                ))}
              </div>
            </div>
          )}

          {marcas.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="marca-select">Marca</Label>
              <Select value={marcaId} onValueChange={(v) => setMarcaId(v ?? '')}>
                <SelectTrigger id="marca-select">
                  <SelectValue placeholder="Sin marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin marca</SelectItem>
                  {marcas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Modos disponibles *</Label>
            <div className="border rounded-md p-3 space-y-2">
              {(Object.entries(MODOS_LABELS) as [ModoOperacion, string][]).map(([modo, label]) => (
                <label key={modo} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={modosDisp.includes(modo)}
                    onCheckedChange={() => toggleModo(modo)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion-producto">Descripcion</Label>
            <Textarea id="descripcion-producto" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

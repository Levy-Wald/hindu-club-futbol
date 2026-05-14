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
import { Plus, ChevronDown } from 'lucide-react'
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

function Section({ title, defaultOpen = false, testId, children }: {
  title: string
  defaultOpen?: boolean
  testId?: string
  children: React.ReactNode
}) {
  return (
    <details open={defaultOpen} className="group border rounded-md" data-testid={testId}>
      <summary className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm font-medium select-none hover:bg-muted/50">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-3">
        {children}
      </div>
    </details>
  )
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.length
  return (
    <span className={`text-xs ${len > max * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
      {len}/{max}
    </span>
  )
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

  // Identificacion
  const [sku, setSku] = useState(producto?.sku ?? '')
  const [ean13, setEan13] = useState(producto?.ean13 ?? '')
  const [ean14, setEan14] = useState(producto?.ean14 ?? '')
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [tipo, setTipo] = useState<'producto' | 'servicio'>(producto?.tipo ?? 'producto')
  const [marcaId, setMarcaId] = useState(producto?.marca_id ?? '')

  // Descripcion
  const [descCorta, setDescCorta] = useState(producto?.descripcion_corta ?? '')
  const [descLarga, setDescLarga] = useState(producto?.descripcion_larga ?? '')

  // Atributos fisicos
  const [material, setMaterial] = useState(producto?.material ?? '')
  const [color, setColor] = useState(producto?.color ?? '')
  const [medidaTamano, setMedidaTamano] = useState(producto?.medida_tamano ?? '')
  const [pesoKg, setPesoKg] = useState(producto?.peso_kg?.toString() ?? '')

  // Comercial / Logistica
  const [modosDisp, setModosDisp] = useState<ModoOperacion[]>(
    producto?.modos_disponibles ?? ['venta']
  )
  const [origenPais, setOrigenPais] = useState(producto?.origen_pais ?? '')
  const [cantidadBulto, setCantidadBulto] = useState(producto?.cantidad_por_bulto?.toString() ?? '')

  // Precio y stock
  const [precioArs, setPrecioArs] = useState(producto?.precio_base_ars?.toString() ?? '')
  const [precioUsd, setPrecioUsd] = useState(producto?.precio_base_usd?.toString() ?? '')
  const [stock, setStock] = useState(producto?.stock_simple?.toString() ?? '')
  const [unidadSlug, setUnidadSlug] = useState(producto?.unidad_medida_slug ?? '')

  // Categorias
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(
    producto?.categorias?.map((c) => c.id) ?? []
  )

  function resetForm() {
    if (mode === 'create') {
      setSku(''); setEan13(''); setEan14(''); setNombre(''); setTipo('producto'); setMarcaId('')
      setDescCorta(''); setDescLarga('')
      setMaterial(''); setColor(''); setMedidaTamano(''); setPesoKg('')
      setModosDisp(['venta']); setOrigenPais(''); setCantidadBulto('')
      setPrecioArs(''); setPrecioUsd(''); setStock(''); setUnidadSlug('')
      setSelectedCatIds([])
    }
    setError(null)
  }

  function toggleModo(modo: ModoOperacion) {
    setModosDisp((prev) => {
      if (prev.includes(modo)) {
        if (prev.length <= 1) return prev
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

    if (ean13 && !/^\d{13}$/.test(ean13)) {
      setError('EAN-13 debe tener exactamente 13 digitos')
      return
    }

    if (ean14 && !/^\d{14}$/.test(ean14)) {
      setError('EAN-14 debe tener exactamente 14 digitos')
      return
    }

    startTransition(async () => {
      const data = {
        sku: sku.trim() || undefined,
        nombre: nombre.trim(),
        tipo,
        descripcion_corta: descCorta.trim() || '',
        descripcion_larga: descLarga.trim() || '',
        precio_base_ars: precioArs ? parseFloat(precioArs) : null,
        precio_base_usd: precioUsd ? parseFloat(precioUsd) : null,
        stock_simple: tipo === 'producto' && stock ? parseFloat(stock) : null,
        unidad_medida_slug: unidadSlug || undefined,
        categoria_ids: selectedCatIds,
        marca_id: marcaId || null,
        modos_disponibles: modosDisp,
        ean13: ean13.trim() || '',
        ean14: ean14.trim() || '',
        material: material.trim() || '',
        color: color.trim() || '',
        medida_tamano: medidaTamano.trim() || '',
        origen_pais: origenPais.trim() || '',
        cantidad_por_bulto: cantidadBulto ? parseInt(cantidadBulto, 10) : null,
        peso_kg: pesoKg ? parseFloat(pesoKg) : null,
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3" data-testid="modal-producto">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          {/* Seccion 1: Identificacion */}
          <Section title="Identificacion" defaultOpen={true} testId="section-identificacion">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="input-sku">SKU</Label>
                <Input id="input-sku" data-testid="input-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="HND-001" />
              </div>
              <div className="space-y-1">
                <Label>Tipo *</Label>
                <div className="flex gap-4 pt-1.5">
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

            <div className="space-y-1">
              <Label htmlFor="input-nombre-producto">Nombre *</Label>
              <Input id="input-nombre-producto" data-testid="input-nombre-producto" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Camiseta titular" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="input-ean13">EAN-13</Label>
                <Input id="input-ean13" data-testid="input-ean13" value={ean13} onChange={(e) => setEan13(e.target.value.replace(/\D/g, '').slice(0, 13))} placeholder="7790100000017" maxLength={13} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="input-ean14">EAN-14</Label>
                <Input id="input-ean14" data-testid="input-ean14" value={ean14} onChange={(e) => setEan14(e.target.value.replace(/\D/g, '').slice(0, 14))} placeholder="17790100000014" maxLength={14} />
              </div>
            </div>

            {marcas.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="marca-select">Marca</Label>
                <Select value={marcaId} onValueChange={(v) => setMarcaId(v ?? '')}>
                  <SelectTrigger id="marca-select">
                    <SelectValue placeholder="Sin marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin marca</SelectItem>
                    {marcas.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {categorias.length > 0 && (
              <div className="space-y-1">
                <Label>Categorias</Label>
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1.5">
                  {categorias.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={selectedCatIds.includes(cat.id)} onCheckedChange={() => toggleCat(cat.id)} />
                      {cat.parent_id ? '  ' : ''}{cat.nombre}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Seccion 2: Descripcion */}
          <Section title="Descripcion" testId="section-descripcion">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="desc-corta">Descripcion corta</Label>
                <CharCounter value={descCorta} max={300} />
              </div>
              <Textarea id="desc-corta" data-testid="input-desc-corta" value={descCorta} onChange={(e) => setDescCorta(e.target.value.slice(0, 300))} rows={2} placeholder="Resumen breve del producto" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="desc-larga">Descripcion larga</Label>
                <CharCounter value={descLarga} max={5000} />
              </div>
              <Textarea id="desc-larga" data-testid="input-desc-larga" value={descLarga} onChange={(e) => setDescLarga(e.target.value.slice(0, 5000))} rows={4} placeholder="Descripcion detallada del producto" />
            </div>
          </Section>

          {/* Seccion 3: Atributos Fisicos */}
          <Section title="Atributos fisicos" testId="section-atributos-fisicos">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="input-material">Material</Label>
                <Input id="input-material" data-testid="input-material" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Polyester 100%" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="input-color">Color</Label>
                <Input id="input-color" data-testid="input-color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Azul y dorado" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="input-medida">Medida / Tamano</Label>
                <Input id="input-medida" data-testid="input-medida" value={medidaTamano} onChange={(e) => setMedidaTamano(e.target.value)} placeholder="Talle M" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="input-peso">Peso (kg)</Label>
                <Input id="input-peso" data-testid="input-peso" type="number" min="0" step="0.001" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} placeholder="0.250" />
              </div>
            </div>
          </Section>

          {/* Seccion 4: Comercial / Logistica */}
          <Section title="Comercial y logistica" testId="section-comercial">
            <div className="space-y-1">
              <Label>Modos disponibles *</Label>
              <div className="border rounded-md p-2 space-y-1.5">
                {(Object.entries(MODOS_LABELS) as [ModoOperacion, string][]).map(([modo, label]) => (
                  <label key={modo} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={modosDisp.includes(modo)} onCheckedChange={() => toggleModo(modo)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="input-origen">Origen (pais)</Label>
                <Input id="input-origen" data-testid="input-origen" value={origenPais} onChange={(e) => setOrigenPais(e.target.value)} placeholder="Argentina" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="input-bulto">Cantidad por bulto</Label>
                <Input id="input-bulto" data-testid="input-bulto" type="number" min="1" step="1" value={cantidadBulto} onChange={(e) => setCantidadBulto(e.target.value)} placeholder="12" />
              </div>
            </div>
          </Section>

          {/* Seccion 5: Precio y Stock */}
          <Section title="Precio y stock" testId="section-precio-stock">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="precio-ars">Precio ARS</Label>
                <Input id="precio-ars" data-testid="input-precio-ars" type="number" min="0" step="0.01" value={precioArs} onChange={(e) => setPrecioArs(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="precio-usd">Precio USD</Label>
                <Input id="precio-usd" type="number" min="0" step="0.01" value={precioUsd} onChange={(e) => setPrecioUsd(e.target.value)} />
              </div>
            </div>

            {tipo === 'producto' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="stock-inicial">Stock simple</Label>
                  <Input id="stock-inicial" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
                </div>
                <div className="space-y-1">
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

            <p className="text-xs text-muted-foreground mt-1">
              Precios y stock avanzados (listas multiples, depositos) se manejan en secciones dedicadas.
            </p>
          </Section>

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

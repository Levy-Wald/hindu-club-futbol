'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { asignarPrecioAction, editarPrecioAction } from '../lib/actions'
import type { ListaPrecios, PrecioProducto, ProductoVariante } from '../lib/tipos'
import { useRouter } from 'next/navigation'

interface PrecioFormDialogProps {
  mode: 'create' | 'edit'
  productoId: string
  listas: ListaPrecios[]
  variantes: ProductoVariante[]
  precio?: PrecioProducto
  triggerRender?: React.ReactElement
  triggerLabel?: string
}

export function PrecioFormDialog({
  mode,
  productoId,
  listas,
  variantes,
  precio,
  triggerRender,
  triggerLabel,
}: PrecioFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [listaId, setListaId] = useState(precio?.lista_id ?? '')
  const [varianteId, setVarianteId] = useState(precio?.variante_id ?? '__base__')
  const [precioVal, setPrecioVal] = useState(precio ? String(precio.precio) : '')
  type Moneda = 'ARS' | 'USD' | 'EUR' | 'BRL' | 'UYU' | 'CLP'
  const [moneda, setMoneda] = useState<Moneda>((precio?.moneda ?? 'ARS') as Moneda)
  const [vigenciaDesde, setVigenciaDesde] = useState(precio?.fecha_vigencia_desde ?? '')
  const [vigenciaHasta, setVigenciaHasta] = useState(precio?.fecha_vigencia_hasta ?? '')
  const [notas, setNotas] = useState(precio?.notas ?? '')

  // Auto-fill moneda from selected lista
  useEffect(() => {
    if (listaId) {
      const lista = listas.find((l) => l.id === listaId)
      if (lista) setMoneda(lista.moneda as Moneda)
    }
  }, [listaId, listas])

  function handleSubmit() {
    startTransition(async () => {
      const payload = {
        producto_id: productoId,
        variante_id: varianteId === '__base__' ? null : varianteId,
        lista_id: listaId,
        precio: parseFloat(precioVal) || 0,
        moneda,
        fecha_vigencia_desde: vigenciaDesde || null,
        fecha_vigencia_hasta: vigenciaHasta || null,
        notas,
      }

      const res = mode === 'edit' && precio
        ? await editarPrecioAction({ id: precio.id, ...payload })
        : await asignarPrecioAction(payload)

      if (res.ok) {
        setOpen(false)
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  const listasActivas = listas.filter((l) => l.activa)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerRender ?? <Button variant="outline" size="sm" />}>
        {triggerLabel ?? (
          <>
            <Plus className="h-4 w-4 mr-1" />
            Asignar precio
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar precio' : 'Asignar precio'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Lista de precios</Label>
            <Select value={listaId} onValueChange={(v) => setListaId(v ?? '')} disabled={mode === 'edit'}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar lista..." />
              </SelectTrigger>
              <SelectContent>
                {listasActivas.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nombre} ({l.moneda})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Variante</Label>
            <Select value={varianteId} onValueChange={(v) => setVarianteId(v ?? '__base__')} disabled={mode === 'edit'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__base__">Producto base (todas las variantes)</SelectItem>
                {variantes.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nombre_variante}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input type="number" value={precioVal} onChange={(e) => setPrecioVal(e.target.value)} min={0} step="0.01" />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={moneda} onValueChange={(v) => setMoneda((v ?? 'ARS') as Moneda)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Vigencia desde</Label>
              <Input type="date" value={vigenciaDesde} onChange={(e) => setVigenciaDesde(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vigencia hasta</Label>
              <Input type="date" value={vigenciaHasta} onChange={(e) => setVigenciaHasta(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
          </div>

          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar' : 'Asignar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

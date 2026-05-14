'use client'

import { useState, useTransition } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { aplicarMovimientoStockAction } from '../lib/stock'
import type { ProductoVariante, TipoMovimiento } from '../lib/tipos'
import { useRouter } from 'next/navigation'

const TIPOS: { value: TipoMovimiento; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'ajuste', label: 'Ajuste' },
]

const MOTIVOS_PRESET = [
  'Compra',
  'Devolucion',
  'Merma',
  'Venta',
  'Ajuste inventario',
  'Rotura',
  'Prestamo',
  'Reposicion',
]

interface MovimientoStockFormDialogProps {
  productoId: string
  variantes: ProductoVariante[]
  espacios: { id: string; nombre: string }[]
  triggerRender?: React.ReactElement
  triggerLabel?: string
}

export function MovimientoStockFormDialog({
  productoId,
  variantes,
  espacios,
  triggerRender,
  triggerLabel,
}: MovimientoStockFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [tipo, setTipo] = useState<TipoMovimiento>('entrada')
  const [varianteId, setVarianteId] = useState('__base__')
  const [espacioOrigenId, setEspacioOrigenId] = useState('')
  const [espacioDestinoId, setEspacioDestinoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')

  const needsOrigen = tipo === 'salida' || tipo === 'transferencia'
  const needsDestino = tipo === 'entrada' || tipo === 'transferencia' || tipo === 'ajuste'

  function handleSubmit() {
    startTransition(async () => {
      const res = await aplicarMovimientoStockAction({
        producto_id: productoId,
        variante_id: varianteId === '__base__' ? null : varianteId,
        tipo,
        cantidad: parseFloat(cantidad) || 0,
        espacio_origen_id: needsOrigen ? espacioOrigenId || null : null,
        espacio_destino_id: needsDestino ? espacioDestinoId || null : null,
        motivo: motivo || null,
      })

      if (res.ok) {
        setOpen(false)
        setTipo('entrada')
        setVarianteId('__base__')
        setEspacioOrigenId('')
        setEspacioDestinoId('')
        setCantidad('')
        setMotivo('')
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerRender ?? <Button variant="outline" size="sm" />}>
        {triggerLabel ?? (
          <>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo movimiento
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Movimiento de stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo((v ?? 'entrada') as TipoMovimiento)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {variantes.length > 0 && (
            <div className="space-y-2">
              <Label>Variante</Label>
              <Select value={varianteId} onValueChange={(v) => setVarianteId(v ?? '__base__')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__base__">Producto base</SelectItem>
                  {variantes.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.nombre_variante}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {needsOrigen && (
            <div className="space-y-2">
              <Label>Espacio origen</Label>
              <Select value={espacioOrigenId} onValueChange={(v) => setEspacioOrigenId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar espacio..." />
                </SelectTrigger>
                <SelectContent>
                  {espacios.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {needsDestino && (
            <div className="space-y-2">
              <Label>{tipo === 'ajuste' ? 'Espacio' : 'Espacio destino'}</Label>
              <Select value={espacioDestinoId} onValueChange={(v) => setEspacioDestinoId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar espacio..." />
                </SelectTrigger>
                <SelectContent>
                  {espacios.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Cantidad</Label>
            <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} min={1} step="1" />
          </div>

          <div className="space-y-2">
            <Label>Motivo</Label>
            <div className="flex gap-1 flex-wrap mb-2">
              {MOTIVOS_PRESET.map((m) => (
                <Badge
                  key={m}
                  variant={motivo === m ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => setMotivo(motivo === m ? '' : m)}
                >
                  {m}
                </Badge>
              ))}
            </div>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Motivo del movimiento..." />
          </div>

          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? 'Aplicando...' : 'Aplicar movimiento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

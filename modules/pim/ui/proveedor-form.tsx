'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { agregarProveedorAProductoAction } from '../lib/actions'
import { useRouter } from 'next/navigation'

interface ProveedorFormDialogProps {
  productoId: string
  entidades: { id: string; nombre: string; tipo: string }[]
  personas: { id: string; nombre: string; apellido: string }[]
}

export function ProveedorFormDialog({
  productoId,
  entidades,
  personas,
}: ProveedorFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [tipoProveedor, setTipoProveedor] = useState<'entidad' | 'persona'>('entidad')
  const [entidadId, setEntidadId] = useState('')
  const [personaId, setPersonaId] = useState('')
  const [esPrincipal, setEsPrincipal] = useState(false)
  const [codigoProveedor, setCodigoProveedor] = useState('')
  const [plazoEntrega, setPlazoEntrega] = useState('')
  const [monedaCompra, setMonedaCompra] = useState('ARS')
  const [precioProveedor, setPrecioProveedor] = useState('')
  const [notas, setNotas] = useState('')

  function resetForm() {
    setTipoProveedor('entidad')
    setEntidadId('')
    setPersonaId('')
    setEsPrincipal(false)
    setCodigoProveedor('')
    setPlazoEntrega('')
    setMonedaCompra('ARS')
    setPrecioProveedor('')
    setNotas('')
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await agregarProveedorAProductoAction({
        producto_id: productoId,
        entidad_id: tipoProveedor === 'entidad' ? entidadId || null : null,
        persona_id: tipoProveedor === 'persona' ? personaId || null : null,
        es_principal: esPrincipal,
        codigo_proveedor: codigoProveedor,
        plazo_entrega_dias: plazoEntrega ? parseInt(plazoEntrega) : null,
        moneda_compra: monedaCompra,
        precio_proveedor: precioProveedor ? parseFloat(precioProveedor) : null,
        notas,
      })
      if (res.ok) {
        setOpen(false)
        resetForm()
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="h-4 w-4 mr-1" />
        Agregar proveedor
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar proveedor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipoProveedor} onValueChange={(v) => setTipoProveedor((v ?? 'entidad') as 'entidad' | 'persona')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entidad">Entidad</SelectItem>
                <SelectItem value="persona">Persona</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipoProveedor === 'entidad' ? (
            <div className="space-y-2">
              <Label>Entidad</Label>
              <Select value={entidadId} onValueChange={(v) => setEntidadId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar entidad..." />
                </SelectTrigger>
                <SelectContent>
                  {entidades.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre} ({e.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Persona</Label>
              <Select value={personaId} onValueChange={(v) => setPersonaId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar persona..." />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.apellido}, {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch checked={esPrincipal} onCheckedChange={setEsPrincipal} />
            <Label>Proveedor principal</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Codigo proveedor</Label>
              <Input value={codigoProveedor} onChange={(e) => setCodigoProveedor(e.target.value)} placeholder="Ej: PROV-001" />
            </div>
            <div className="space-y-2">
              <Label>Plazo entrega (dias)</Label>
              <Input type="number" value={plazoEntrega} onChange={(e) => setPlazoEntrega(e.target.value)} min={0} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Moneda compra</Label>
              <Select value={monedaCompra} onValueChange={(v) => setMonedaCompra(v ?? 'ARS')}>
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
            <div className="space-y-2">
              <Label>Precio proveedor</Label>
              <Input type="number" value={precioProveedor} onChange={(e) => setPrecioProveedor(e.target.value)} min={0} step="0.01" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
          </div>

          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? 'Guardando...' : 'Agregar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { crearLiquidacion } from '@/modules/rrhh/lib/actions'

interface Contrato {
  id: string
  modalidad: string
  monto: number
  moneda: string
  persona: unknown
}

interface NuevaLiquidacionDialogProps {
  contratos: Contrato[]
}

function getCurrentPeriodo(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMoney(amount: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

export function NuevaLiquidacionDialog({ contratos }: NuevaLiquidacionDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [contratoId, setContratoId] = useState('')
  const [periodo, setPeriodo] = useState(getCurrentPeriodo())
  const [montoBruto, setMontoBruto] = useState<number>(0)
  const [deducciones, setDeducciones] = useState<number>(0)
  const [aportesPatronales, setAportesPatronales] = useState<number>(0)
  const [bonificaciones, setBonificaciones] = useState<number>(0)
  const [observaciones, setObservaciones] = useState('')

  // Auto-fill monto bruto cuando se selecciona un contrato
  useEffect(() => {
    if (!contratoId) return
    const contrato = contratos.find((c) => c.id === contratoId)
    if (contrato) {
      setMontoBruto(contrato.monto)
    }
  }, [contratoId, contratos])

  const montoNeto = montoBruto - deducciones + bonificaciones

  function resetForm() {
    setContratoId('')
    setPeriodo(getCurrentPeriodo())
    setMontoBruto(0)
    setDeducciones(0)
    setAportesPatronales(0)
    setBonificaciones(0)
    setObservaciones('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.set('contrato_id', contratoId)
    formData.set('periodo', periodo)
    formData.set('monto_bruto', String(montoBruto))
    formData.set('deducciones', String(deducciones))
    formData.set('aportes_patronales', String(aportesPatronales))
    formData.set('bonificaciones', String(bonificaciones))
    formData.set('observaciones', observaciones)

    const result = await crearLiquidacion(formData)

    setLoading(false)

    if (result.success) {
      toast.success('Liquidacion creada correctamente')
      resetForm()
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.error ?? 'Error al crear la liquidacion')
    }
  }

  function getContratoLabel(contrato: Contrato): string {
    const personaRaw = contrato.persona as unknown
    const persona = (Array.isArray(personaRaw) ? personaRaw[0] : personaRaw) as {
      id: string
      nombre: string
      apellido: string
    } | null
    const nombreCompleto = persona
      ? `${persona.apellido}, ${persona.nombre}`
      : 'Sin persona'
    return `${nombreCompleto} — ${formatMoney(contrato.monto, contrato.moneda)}`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" />
        Nueva liquidacion
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva liquidacion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contrato */}
          <div className="space-y-1">
            <Label>Contrato *</Label>
            <Select value={contratoId} onValueChange={(v) => setContratoId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar contrato..." />
              </SelectTrigger>
              <SelectContent>
                {contratos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {getContratoLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Periodo */}
          <div className="space-y-1">
            <Label>Periodo *</Label>
            <Input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              required
            />
          </div>

          {/* Montos en grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monto bruto */}
            <div className="space-y-1">
              <Label>Monto bruto *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={montoBruto || ''}
                onChange={(e) => setMontoBruto(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            {/* Deducciones */}
            <div className="space-y-1">
              <Label>Deducciones</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={deducciones || ''}
                onChange={(e) => setDeducciones(parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Aportes patronales */}
            <div className="space-y-1">
              <Label>Aportes patronales</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={aportesPatronales || ''}
                onChange={(e) => setAportesPatronales(parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Bonificaciones */}
            <div className="space-y-1">
              <Label>Bonificaciones</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={bonificaciones || ''}
                onChange={(e) => setBonificaciones(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Neto preview */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monto neto (calculado)</span>
              <span className="text-lg font-semibold">
                {formatMoney(montoNeto)}
              </span>
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1">
            <Label>Observaciones</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Opcional..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !contratoId || !periodo || montoBruto <= 0}>
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Crear liquidacion
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

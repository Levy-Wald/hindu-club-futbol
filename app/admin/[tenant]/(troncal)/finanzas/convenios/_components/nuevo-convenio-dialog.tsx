'use client'

import { useState, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { crearConvenio } from '@/modules/finanzas/lib/actions'

interface Persona {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
}

interface NuevoConvenioDialogProps {
  personas: Persona[]
}

export function NuevoConvenioDialog({ personas }: NuevoConvenioDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState(1)

  const [personaId, setPersonaId] = useState('')
  const [deudaOriginal, setDeudaOriginal] = useState('')
  const [cantidadCuotas, setCantidadCuotas] = useState('3')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [observaciones, setObservaciones] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const deuda = parseFloat(deudaOriginal) || 0
  const cuotas = parseInt(cantidadCuotas) || 1
  const montoCuota = cuotas > 0 ? Math.floor((deuda / cuotas) * 100) / 100 : 0
  const ultimaCuota = deuda - montoCuota * (cuotas - 1)

  const previewCuotas = useMemo(() => {
    if (deuda <= 0 || cuotas <= 0) return []
    const result = []
    const inicio = new Date(fechaInicio + 'T12:00:00')
    for (let i = 0; i < cuotas; i++) {
      const fecha = new Date(inicio)
      fecha.setDate(fecha.getDate() + 30 * (i + 1))
      result.push({
        numero: i + 1,
        fecha: fecha.toISOString().split('T')[0],
        monto: i === cuotas - 1 ? ultimaCuota : montoCuota,
      })
    }
    return result
  }, [deuda, cuotas, fechaInicio, montoCuota, ultimaCuota])

  const personasFiltradas = useMemo(() => {
    if (!busqueda) return personas.slice(0, 50)
    const q = busqueda.toLowerCase()
    return personas.filter(p =>
      `${p.apellido} ${p.nombre} ${p.numero_documento ?? ''}`.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [personas, busqueda])

  function handleConfirm() {
    const proximoVenc = previewCuotas[0]?.fecha ?? fechaInicio
    const form = new FormData()
    form.set('persona_id', personaId)
    form.set('deuda_original', String(deuda))
    form.set('cantidad_cuotas', String(cuotas))
    form.set('monto_cuota', String(montoCuota))
    form.set('fecha_inicio', fechaInicio)
    form.set('proximo_vencimiento', proximoVenc)
    form.set('observaciones', observaciones)

    startTransition(async () => {
      const res = await crearConvenio(form)
      if (res.success) {
        toast.success('Convenio creado')
        setOpen(false)
        setStep(1)
        setPersonaId('')
        setDeudaOriginal('')
      } else {
        toast.error(res.error)
      }
    })
  }

  const personaSeleccionada = personas.find(p => p.id === personaId)

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(1) }}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" />
        Nuevo convenio
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Nuevo convenio — Datos' : step === 2 ? 'Preview de cuotas' : 'Confirmar'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Persona</Label>
              <Input placeholder="Buscar por nombre o DNI..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              <Select value={personaId} onValueChange={v => setPersonaId(v ?? '')}>
                <option value="">Seleccionar persona...</option>
                {personasFiltradas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.apellido}, {p.nombre} {p.numero_documento ? `(${p.numero_documento})` : ''}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deuda original (ARS)</Label>
                <Input type="number" min="1" step="0.01" value={deudaOriginal}
                  onChange={e => setDeudaOriginal(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Cantidad de cuotas</Label>
                <Input type="number" min="1" max="60" value={cantidadCuotas}
                  onChange={e => setCantidadCuotas(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha de inicio</Label>
              <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observaciones (opcional)</Label>
              <Input value={observaciones} onChange={e => setObservaciones(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!personaId || deuda <= 0 || cuotas <= 0}>
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm"><strong>Persona:</strong> {personaSeleccionada ? `${personaSeleccionada.apellido}, ${personaSeleccionada.nombre}` : '-'}</p>
                <p className="text-sm"><strong>Deuda:</strong> ${new Intl.NumberFormat('es-AR').format(deuda)}</p>
                <p className="text-sm"><strong>Cuotas:</strong> {cuotas} x ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(montoCuota)}</p>
              </CardContent>
            </Card>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2">#</th>
                    <th className="text-left px-3 py-2">Vencimiento</th>
                    <th className="text-right px-3 py-2">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {previewCuotas.map(c => (
                    <tr key={c.numero} className="border-t">
                      <td className="px-3 py-1.5">{c.numero}</td>
                      <td className="px-3 py-1.5">{new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                      <td className="px-3 py-1.5 text-right font-mono">
                        ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(c.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Volver</Button>
              <Button onClick={handleConfirm} disabled={pending}>
                {pending ? 'Creando...' : 'Confirmar y crear'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

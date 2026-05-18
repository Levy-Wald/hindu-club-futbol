'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { PersonaSearchInput } from '@/modules/concesiones/ui/components/persona-search-input'
import { TIPOS_SUSCRIPCION } from '../lib/schema'
import { darAltaMembresia } from '../lib/actions'

interface Plan {
  id: string
  nombre: string
  monto: number
  periodicidad: string
  moneda: string
}

interface Equipo {
  id: string
  nombre: string
  disciplina_slug: string
}

interface AltaWizardProps {
  open: boolean
  onClose: () => void
  planes: Plan[]
  equipos: Equipo[]
  onSuccess: () => void
}

export function AltaWizard({ open, onClose, planes, equipos, onSuccess }: AltaWizardProps) {
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()

  const [personaId, setPersonaId] = useState('')
  const [planId, setPlanId] = useState('')
  const [tipo, setTipo] = useState('membresia')
  const [disciplinaSlug, setDisciplinaSlug] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [montoPactado, setMontoPactado] = useState('')
  const [fechaAlta, setFechaAlta] = useState(new Date().toISOString().split('T')[0])
  const [notas, setNotas] = useState('')

  const selectedPlan = planes.find(p => p.id === planId)

  function reset() {
    setStep(0)
    setPersonaId('')
    setPlanId('')
    setTipo('membresia')
    setDisciplinaSlug('')
    setEquipoId('')
    setMontoPactado('')
    setFechaAlta(new Date().toISOString().split('T')[0])
    setNotas('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await darAltaMembresia({
        persona_id: personaId,
        plan_id: planId,
        tipo: tipo as any,
        disciplina_slug: disciplinaSlug || null,
        equipo_id: equipoId || null,
        monto_pactado: montoPactado ? Number(montoPactado) : null,
        fecha_alta: fechaAlta,
        notas: notas || null,
      })
      if (result.ok) {
        toast.success('Alta registrada correctamente')
        handleClose()
        onSuccess()
      } else {
        toast.error(result.error ?? 'Error al registrar alta')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva alta — Paso {step + 1} de 3</DialogTitle>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label>Persona</Label>
              <PersonaSearchInput value={personaId} onChange={setPersonaId} placeholder="Buscar por nombre o DNI..." />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(1)} disabled={!personaId}>Siguiente</Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Plan</Label>
              <Select value={planId} onValueChange={v => setPlanId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  {planes.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} — ${p.monto.toLocaleString('es-AR')} / {p.periodicidad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={v => setTipo(v ?? 'membresia')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_SUSCRIPCION.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Disciplina (opcional)</Label>
              <Select value={disciplinaSlug} onValueChange={v => setDisciplinaSlug(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin disciplina</SelectItem>
                  {[...new Set(equipos.map(e => e.disciplina_slug))].map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Equipo (opcional)</Label>
              <Select value={equipoId} onValueChange={v => setEquipoId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin equipo</SelectItem>
                  {equipos.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>Atrás</Button>
              <Button onClick={() => setStep(2)} disabled={!planId}>Siguiente</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Monto pactado</Label>
              <Input
                type="number"
                value={montoPactado}
                onChange={e => setMontoPactado(e.target.value)}
                placeholder={selectedPlan ? `Plan: $${selectedPlan.monto}` : 'Monto'}
              />
              {selectedPlan && !montoPactado && (
                <p className="text-xs text-muted-foreground mt-1">
                  Si no se indica, se usa el monto del plan: ${selectedPlan.monto.toLocaleString('es-AR')}
                </p>
              )}
            </div>
            <div>
              <Label>Fecha de alta</Label>
              <Input type="date" value={fechaAlta} onChange={e => setFechaAlta(e.target.value)} />
            </div>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Confirmar alta
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

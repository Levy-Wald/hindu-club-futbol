'use client'

import { useState, useTransition } from 'react'
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
import { Plus } from 'lucide-react'
import { crearContrato } from '@/app/admin/rrhh/_actions'
import { toast } from 'sonner'

interface Persona {
  id: string
  nombre: string
  apellido: string
}

interface NuevoContratoDialogProps {
  personas: Persona[]
}

export function NuevoContratoDialog({ personas }: NuevoContratoDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [personaId, setPersonaId] = useState('')
  const [modalidad, setModalidad] = useState('')
  const [puesto, setPuesto] = useState('')
  const [area, setArea] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState('ARS')
  const [frecuencia, setFrecuencia] = useState('mensual')
  const [cuil, setCuil] = useState('')
  const [numeroLegajo, setNumeroLegajo] = useState('')

  function resetForm() {
    setPersonaId('')
    setModalidad('')
    setPuesto('')
    setArea('')
    setFechaInicio('')
    setFechaFin('')
    setMonto('')
    setMoneda('ARS')
    setFrecuencia('mensual')
    setCuil('')
    setNumeroLegajo('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const formData = new FormData()
    formData.set('persona_id', personaId)
    formData.set('modalidad', modalidad)
    formData.set('puesto', puesto)
    if (area) formData.set('area', area)
    formData.set('fecha_inicio', fechaInicio)
    if (fechaFin) formData.set('fecha_fin', fechaFin)
    formData.set('monto', monto)
    formData.set('moneda', moneda)
    formData.set('frecuencia', frecuencia)
    if (cuil) formData.set('cuil', cuil)
    if (numeroLegajo) formData.set('numero_legajo', numeroLegajo)

    startTransition(async () => {
      const result = await crearContrato(formData)
      if (result.success) {
        toast.success('Contrato creado correctamente')
        resetForm()
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Error al crear contrato')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" />
        Nuevo contrato
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo contrato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Persona */}
            <div className="space-y-1 sm:col-span-2">
              <Label>Persona *</Label>
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

            {/* Modalidad */}
            <div className="space-y-1">
              <Label>Modalidad *</Label>
              <Select value={modalidad} onValueChange={(v) => setModalidad(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relacion_dependencia">Rel. dependencia</SelectItem>
                  <SelectItem value="monotributo">Monotributo</SelectItem>
                  <SelectItem value="honorarios">Honorarios</SelectItem>
                  <SelectItem value="informal">Informal</SelectItem>
                  <SelectItem value="pasantia">Pasantia</SelectItem>
                  <SelectItem value="voluntariado">Voluntariado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Puesto */}
            <div className="space-y-1">
              <Label>Puesto *</Label>
              <Input
                value={puesto}
                onChange={(e) => setPuesto(e.target.value)}
                placeholder="Ej: Director tecnico"
              />
            </div>

            {/* Area */}
            <div className="space-y-1">
              <Label>Area</Label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ej: Futbol juvenil"
              />
            </div>

            {/* Fecha inicio */}
            <div className="space-y-1">
              <Label>Fecha inicio *</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            {/* Fecha fin */}
            <div className="space-y-1">
              <Label>Fecha fin</Label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Dejar vacio = indefinido</p>
            </div>

            {/* Monto */}
            <div className="space-y-1">
              <Label>Monto *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Moneda */}
            <div className="space-y-1">
              <Label>Moneda</Label>
              <Select value={moneda} onValueChange={(v) => setMoneda(v ?? 'ARS')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Frecuencia */}
            <div className="space-y-1">
              <Label>Frecuencia</Label>
              <Select value={frecuencia} onValueChange={(v) => setFrecuencia(v ?? 'mensual')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="por_hora">Por hora</SelectItem>
                  <SelectItem value="por_evento">Por evento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CUIL */}
            <div className="space-y-1">
              <Label>CUIL</Label>
              <Input
                value={cuil}
                onChange={(e) => setCuil(e.target.value)}
                placeholder="20-12345678-9"
              />
            </div>

            {/* Numero legajo */}
            <div className="space-y-1">
              <Label>Numero de legajo</Label>
              <Input
                value={numeroLegajo}
                onChange={(e) => setNumeroLegajo(e.target.value)}
                placeholder="Ej: LEG-001"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creando...' : 'Crear contrato'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

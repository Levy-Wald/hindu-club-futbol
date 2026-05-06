'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { crearScoutingFicha } from '../_actions'

const ESTADOS_SCOUTING = [
  { value: 'observado', label: 'Observado' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'en_negociacion', label: 'En negociación' },
  { value: 'descartado', label: 'Descartado' },
  { value: 'incorporado', label: 'Incorporado' },
]

interface Equipo {
  id: string
  nombre: string
}

interface CrearScoutingDialogProps {
  equipos: Equipo[]
}

export function CrearScoutingDialog({ equipos }: CrearScoutingDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [posicion, setPosicion] = useState('')
  const [clubActual, setClubActual] = useState('')
  const [contacto, setContacto] = useState('')
  const [estado, setEstado] = useState('observado')
  const [observaciones, setObservaciones] = useState('')
  const [evaluacion, setEvaluacion] = useState('')
  const [equipoId, setEquipoId] = useState('')

  function resetForm() {
    setNombre('')
    setApellido('')
    setFechaNacimiento('')
    setPosicion('')
    setClubActual('')
    setContacto('')
    setEstado('observado')
    setObservaciones('')
    setEvaluacion('')
    setEquipoId('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !apellido.trim()) {
      toast.error('Nombre y apellido son obligatorios.')
      return
    }

    startTransition(async () => {
      const result = await crearScoutingFicha({
        nombre,
        apellido,
        fecha_nacimiento: fechaNacimiento || undefined,
        posicion: posicion || undefined,
        club_actual: clubActual || undefined,
        contacto: contacto || undefined,
        estado,
        observaciones: observaciones || undefined,
        evaluacion: evaluacion ? parseInt(evaluacion, 10) : undefined,
        equipo_id: equipoId || undefined,
      })

      if (result.ok) {
        toast.success(result.message)
        setOpen(false)
        resetForm()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Nueva ficha</span>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva ficha de scouting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sc-nombre">Nombre *</Label>
              <Input
                id="sc-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sc-apellido">Apellido *</Label>
              <Input
                id="sc-apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Apellido"
                required
              />
            </div>
          </div>

          {/* Fecha nacimiento y Posición */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sc-fecha">Fecha de nacimiento</Label>
              <Input
                id="sc-fecha"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sc-posicion">Posición</Label>
              <Input
                id="sc-posicion"
                value={posicion}
                onChange={(e) => setPosicion(e.target.value)}
                placeholder="Ej: Delantero, Arquero"
              />
            </div>
          </div>

          {/* Club actual y Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sc-club">Club actual</Label>
              <Input
                id="sc-club"
                value={clubActual}
                onChange={(e) => setClubActual(e.target.value)}
                placeholder="Club donde juega"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sc-contacto">Contacto</Label>
              <Input
                id="sc-contacto"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Tel / email / representante"
              />
            </div>
          </div>

          {/* Estado y Evaluación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={(v) => setEstado(v ?? 'observado')}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_SCOUTING.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Evaluación (1-5)</Label>
              <Select value={evaluacion} onValueChange={(v) => setEvaluacion(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin evaluar" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Equipo interesado */}
          <div className="space-y-2">
            <Label>Equipo interesado</Label>
            <Select value={equipoId} onValueChange={(v) => setEquipoId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar equipo (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {equipos.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="sc-obs">Observaciones</Label>
            <Textarea
              id="sc-obs"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas sobre el jugador..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !nombre.trim() || !apellido.trim()}>
              {isPending ? 'Creando...' : 'Crear ficha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

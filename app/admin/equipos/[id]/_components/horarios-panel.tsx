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
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { crearHorario, eliminarHorario } from '../../_actions'

const DIAS_SEMANA = [
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miercoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sabado' },
  { value: '7', label: 'Domingo' },
]

const TIPOS_ACTIVIDAD = [
  { value: 'entrenamiento', label: 'Entrenamiento' },
  { value: 'partido_local', label: 'Partido local' },
  { value: 'partido_visitante', label: 'Partido visitante' },
  { value: 'amistoso', label: 'Amistoso' },
  { value: 'torneo', label: 'Torneo' },
  { value: 'otro', label: 'Otro' },
]

interface Horario {
  id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  tipo_actividad: string
  activo: boolean
}

interface HorariosPanelProps {
  equipoId: string
  horarios: Horario[]
}

function getDiaNombre(dia: number): string {
  return DIAS_SEMANA.find((d) => d.value === String(dia))?.label ?? String(dia)
}

function getTipoLabel(tipo: string): string {
  return TIPOS_ACTIVIDAD.find((t) => t.value === tipo)?.label ?? tipo
}

export function HorariosPanel({ equipoId, horarios }: HorariosPanelProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [diaSemana, setDiaSemana] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [tipoActividad, setTipoActividad] = useState('')

  function resetForm() {
    setDiaSemana('')
    setHoraInicio('')
    setHoraFin('')
    setTipoActividad('')
  }

  function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!diaSemana || !horaInicio || !horaFin || !tipoActividad) {
      toast.error('Todos los campos son obligatorios.')
      return
    }

    startTransition(async () => {
      const result = await crearHorario({
        equipo_id: equipoId,
        dia_semana: Number(diaSemana),
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        tipo_actividad: tipoActividad,
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

  function handleEliminar(horarioId: string) {
    startTransition(async () => {
      const result = await eliminarHorario(horarioId, equipoId)

      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Horarios</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" variant="outline" />}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar horario
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar horario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrear} className="space-y-4">
              <div className="space-y-2">
                <Label>Dia de la semana</Label>
                <Select value={diaSemana} onValueChange={(v) => setDiaSemana(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hora-inicio">Hora inicio</Label>
                  <Input
                    id="hora-inicio"
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora-fin">Hora fin</Label>
                  <Input
                    id="hora-fin"
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo actividad</Label>
                <Select value={tipoActividad} onValueChange={(v) => setTipoActividad(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ACTIVIDAD.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creando...' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {horarios.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay horarios configurados.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {horarios.map((h) => (
            <div
              key={h.id}
              className="rounded-lg border bg-card p-3 flex items-start justify-between gap-2"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">{getDiaNombre(h.dia_semana)}</p>
                <p className="text-xs text-muted-foreground">
                  {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {getTipoLabel(h.tipo_actividad)}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                disabled={isPending}
                onClick={() => handleEliminar(h.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

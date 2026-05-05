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
import { Plus, Trash2, List, CalendarDays, MapPin } from 'lucide-react'
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

const RECURRENCIA_OPTIONS = [
  { value: 'una_vez', label: 'Una vez' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
]

const TIPO_COLORES: Record<string, string> = {
  entrenamiento: 'bg-blue-500/80 border-blue-600 text-white',
  partido_local: 'bg-green-500/80 border-green-600 text-white',
  partido_visitante: 'bg-orange-500/80 border-orange-600 text-white',
  amistoso: 'bg-purple-500/80 border-purple-600 text-white',
  torneo: 'bg-red-500/80 border-red-600 text-white',
  otro: 'bg-gray-500/80 border-gray-600 text-white',
}

const HORA_INICIO_CALENDARIO = 7
const HORA_FIN_CALENDARIO = 22
const HORAS_TOTAL = HORA_FIN_CALENDARIO - HORA_INICIO_CALENDARIO

interface Sede {
  id: string
  nombre: string
  direccion: unknown
}

interface Cancha {
  id: string
  nombre: string
  sede_id: string
}

interface Horario {
  id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  tipo_actividad: string
  activo: boolean
  sede_id: string | null
  cancha_id: string | null
  metadata: Record<string, unknown>
}

interface HorariosPanelProps {
  equipoId: string
  horarios: Horario[]
  sedes: Sede[]
  canchas: Cancha[]
}

type ViewMode = 'lista' | 'calendario'

function getDiaNombre(dia: number): string {
  return DIAS_SEMANA.find((d) => d.value === String(dia))?.label ?? String(dia)
}

function getTipoLabel(tipo: string): string {
  return TIPOS_ACTIVIDAD.find((t) => t.value === tipo)?.label ?? tipo
}

function getTipoColor(tipo: string): string {
  return TIPO_COLORES[tipo] ?? TIPO_COLORES.otro
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function calcularFechasRecurrentes(
  fechaInicio: string,
  recurrencia: string,
  cantidad: number
): Date[] {
  const fechas: Date[] = []
  const inicio = new Date(fechaInicio + 'T00:00:00')

  for (let i = 0; i < cantidad; i++) {
    const fecha = new Date(inicio)
    switch (recurrencia) {
      case 'semanal':
        fecha.setDate(inicio.getDate() + i * 7)
        break
      case 'quincenal':
        fecha.setDate(inicio.getDate() + i * 14)
        break
      case 'mensual':
        fecha.setMonth(inicio.getMonth() + i)
        break
      default:
        break
    }
    fechas.push(fecha)
  }

  return fechas
}

function getDiaSemanaFromDate(date: Date): number {
  // JS: 0=domingo, 1=lunes... Nuestro sistema: 1=lunes, 7=domingo
  const jsDay = date.getDay()
  return jsDay === 0 ? 7 : jsDay
}

// --- Vista Lista ---
function ListaView({
  horarios,
  isPending,
  onEliminar,
  sedes,
}: {
  horarios: Horario[]
  isPending: boolean
  onEliminar: (id: string) => void
  sedes: Sede[]
}) {
  if (horarios.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay horarios configurados.</p>
  }

  function getSedeNombre(sedeId: string | null): string | null {
    if (!sedeId) return null
    return sedes.find((s) => s.id === sedeId)?.nombre ?? null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {horarios.map((h) => {
        const sedeNombre = getSedeNombre(h.sede_id)
        return (
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
              {sedeNombre && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {sedeNombre}
                </p>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => onEliminar(h.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}

// --- Vista Calendario (Desktop) ---
function CalendarioDesktopView({ horarios }: { horarios: Horario[] }) {
  const horasArray = Array.from({ length: HORAS_TOTAL }, (_, i) => HORA_INICIO_CALENDARIO + i)
  const ROW_HEIGHT = 48 // px per hour

  return (
    <div className="hidden md:block overflow-x-auto border rounded-lg">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/50">
          <div className="p-2 text-xs font-medium text-muted-foreground border-r" />
          {DIAS_SEMANA.map((d) => (
            <div
              key={d.value}
              className="p-2 text-xs font-medium text-center text-muted-foreground border-r last:border-r-0"
            >
              {d.label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {/* Time labels + grid lines */}
          <div className="relative" style={{ height: `${HORAS_TOTAL * ROW_HEIGHT}px` }}>
            {horasArray.map((hora) => (
              <div
                key={hora}
                className="absolute left-0 right-0 border-b text-[10px] text-muted-foreground px-1 pt-0.5"
                style={{ top: `${(hora - HORA_INICIO_CALENDARIO) * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
              >
                {String(hora).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DIAS_SEMANA.map((dia) => {
            const diaHorarios = horarios.filter((h) => h.dia_semana === Number(dia.value))
            return (
              <div
                key={dia.value}
                className="relative border-r last:border-r-0"
                style={{ height: `${HORAS_TOTAL * ROW_HEIGHT}px` }}
              >
                {/* Grid lines */}
                {horasArray.map((hora) => (
                  <div
                    key={hora}
                    className="absolute left-0 right-0 border-b"
                    style={{ top: `${(hora - HORA_INICIO_CALENDARIO) * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
                  />
                ))}

                {/* Horario blocks */}
                {diaHorarios.map((h) => {
                  const inicioMin = timeToMinutes(h.hora_inicio)
                  const finMin = timeToMinutes(h.hora_fin)
                  const topPx = ((inicioMin - HORA_INICIO_CALENDARIO * 60) / 60) * ROW_HEIGHT
                  const heightPx = ((finMin - inicioMin) / 60) * ROW_HEIGHT

                  if (topPx < 0 || heightPx <= 0) return null

                  return (
                    <div
                      key={h.id}
                      className={`absolute left-0.5 right-0.5 rounded px-1 py-0.5 border text-[10px] leading-tight overflow-hidden ${getTipoColor(h.tipo_actividad)}`}
                      style={{ top: `${topPx}px`, height: `${Math.max(heightPx, 16)}px` }}
                      title={`${getDiaNombre(h.dia_semana)} ${h.hora_inicio.slice(0, 5)}-${h.hora_fin.slice(0, 5)} | ${getTipoLabel(h.tipo_actividad)}`}
                    >
                      <span className="font-medium">{h.hora_inicio.slice(0, 5)}</span>
                      {heightPx >= 32 && (
                        <span className="block truncate">{getTipoLabel(h.tipo_actividad)}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// --- Vista Calendario (Mobile: un dia a la vez) ---
function CalendarioMobileView({ horarios }: { horarios: Horario[] }) {
  const [diaSeleccionado, setDiaSeleccionado] = useState('1')
  const horasArray = Array.from({ length: HORAS_TOTAL }, (_, i) => HORA_INICIO_CALENDARIO + i)
  const ROW_HEIGHT = 40
  const diaHorarios = horarios.filter((h) => h.dia_semana === Number(diaSeleccionado))

  return (
    <div className="block md:hidden space-y-3">
      {/* Day selector tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {DIAS_SEMANA.map((d) => (
          <Button
            key={d.value}
            size="sm"
            variant={diaSeleccionado === d.value ? 'default' : 'outline'}
            className="text-xs shrink-0 px-2"
            onClick={() => setDiaSeleccionado(d.value)}
          >
            {d.label.slice(0, 3)}
          </Button>
        ))}
      </div>

      {/* Single day column */}
      <div className="border rounded-lg overflow-hidden">
        <div className="relative" style={{ height: `${HORAS_TOTAL * ROW_HEIGHT}px` }}>
          {/* Hour grid lines */}
          {horasArray.map((hora) => (
            <div
              key={hora}
              className="absolute left-0 right-0 border-b flex items-start"
              style={{ top: `${(hora - HORA_INICIO_CALENDARIO) * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
            >
              <span className="text-[10px] text-muted-foreground px-1 pt-0.5 w-12 shrink-0">
                {String(hora).padStart(2, '0')}:00
              </span>
            </div>
          ))}

          {/* Horario blocks */}
          {diaHorarios.map((h) => {
            const inicioMin = timeToMinutes(h.hora_inicio)
            const finMin = timeToMinutes(h.hora_fin)
            const topPx = ((inicioMin - HORA_INICIO_CALENDARIO * 60) / 60) * ROW_HEIGHT
            const heightPx = ((finMin - inicioMin) / 60) * ROW_HEIGHT

            if (topPx < 0 || heightPx <= 0) return null

            return (
              <div
                key={h.id}
                className={`absolute left-12 right-1 rounded px-2 py-0.5 border text-xs overflow-hidden ${getTipoColor(h.tipo_actividad)}`}
                style={{ top: `${topPx}px`, height: `${Math.max(heightPx, 20)}px` }}
              >
                <span className="font-medium">
                  {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}
                </span>
                {heightPx >= 36 && (
                  <span className="block truncate">{getTipoLabel(h.tipo_actividad)}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// --- Componente principal ---
export function HorariosPanel({ equipoId, horarios, sedes, canchas }: HorariosPanelProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<ViewMode>('lista')

  // Form state
  const [diaSemana, setDiaSemana] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [tipoActividad, setTipoActividad] = useState('')
  const [recurrencia, setRecurrencia] = useState('una_vez')
  const [cantidadRepeticiones, setCantidadRepeticiones] = useState(1)
  const [fechaInicio, setFechaInicio] = useState('')
  const [sedeId, setSedeId] = useState('')
  const [canchaId, setCanchaId] = useState('')
  const [horaCitacion, setHoraCitacion] = useState('')

  // Filter canchas by selected sede
  const canchasFiltradas = sedeId
    ? canchas.filter((c) => c.sede_id === sedeId)
    : canchas

  function resetForm() {
    setDiaSemana('')
    setHoraInicio('')
    setHoraFin('')
    setTipoActividad('')
    setRecurrencia('una_vez')
    setCantidadRepeticiones(1)
    setFechaInicio('')
    setSedeId('')
    setCanchaId('')
    setHoraCitacion('')
  }

  function handleCrear(e: React.FormEvent) {
    e.preventDefault()

    if (!diaSemana || !horaInicio || !horaFin || !tipoActividad) {
      toast.error('Todos los campos son obligatorios.')
      return
    }

    if (recurrencia !== 'una_vez' && !fechaInicio) {
      toast.error('La fecha de inicio es obligatoria para horarios recurrentes.')
      return
    }

    if (recurrencia !== 'una_vez' && cantidadRepeticiones < 1) {
      toast.error('La cantidad de repeticiones debe ser al menos 1.')
      return
    }

    startTransition(async () => {
      if (recurrencia === 'una_vez') {
        // Single creation
        const result = await crearHorario({
          equipo_id: equipoId,
          dia_semana: Number(diaSemana),
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          tipo_actividad: tipoActividad,
          sede_id: sedeId || null,
          cancha_id: canchaId || null,
          hora_citacion: horaCitacion || null,
        })

        if (result.ok) {
          toast.success(result.message)
          setOpen(false)
          resetForm()
        } else {
          toast.error(result.message)
        }
      } else {
        // Recurrent creation
        const fechas = calcularFechasRecurrentes(fechaInicio, recurrencia, cantidadRepeticiones)
        let exitosos = 0
        let errores = 0

        for (const fecha of fechas) {
          const diaSemanaCalculado = getDiaSemanaFromDate(fecha)
          const result = await crearHorario({
            equipo_id: equipoId,
            dia_semana: diaSemanaCalculado,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            tipo_actividad: tipoActividad,
            sede_id: sedeId || null,
            cancha_id: canchaId || null,
            hora_citacion: horaCitacion || null,
          })

          if (result.ok) {
            exitosos++
          } else {
            errores++
          }
        }

        if (errores === 0) {
          toast.success(`Se crearon ${exitosos} horario${exitosos > 1 ? 's' : ''} correctamente.`)
          setOpen(false)
          resetForm()
        } else {
          toast.error(`Se crearon ${exitosos} horarios, pero ${errores} fallaron.`)
        }
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
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-medium text-muted-foreground">Horarios</h3>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              size="sm"
              variant={viewMode === 'lista' ? 'default' : 'ghost'}
              className="rounded-none h-8 px-2"
              onClick={() => setViewMode('lista')}
              title="Vista lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'calendario' ? 'default' : 'ghost'}
              className="rounded-none h-8 px-2"
              onClick={() => setViewMode('calendario')}
              title="Vista calendario"
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
          </div>

          {/* Add button */}
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

                {/* Sede */}
                <div className="space-y-2">
                  <Label>Sede</Label>
                  <Select value={sedeId} onValueChange={(v) => { setSedeId(v ?? ''); setCanchaId('') }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sede (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {sedes.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cancha */}
                <div className="space-y-2">
                  <Label>Cancha</Label>
                  <Select value={canchaId} onValueChange={(v) => setCanchaId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cancha (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {canchasFiltradas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hora citacion */}
                <div className="space-y-2">
                  <Label htmlFor="hora-citacion">Hora de citacion (opcional)</Label>
                  <Input
                    id="hora-citacion"
                    type="time"
                    value={horaCitacion}
                    onChange={(e) => setHoraCitacion(e.target.value)}
                  />
                </div>

                {/* Recurrence fields */}
                <div className="space-y-2">
                  <Label>Repetir</Label>
                  <Select value={recurrencia} onValueChange={(v) => setRecurrencia(v ?? 'una_vez')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar recurrencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCIA_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {recurrencia !== 'una_vez' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fecha-inicio">Fecha inicio</Label>
                      <Input
                        id="fecha-inicio"
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cantidad-repeticiones">Cantidad de repeticiones</Label>
                      <Input
                        id="cantidad-repeticiones"
                        type="number"
                        min={1}
                        max={52}
                        value={cantidadRepeticiones}
                        onChange={(e) => setCantidadRepeticiones(Number(e.target.value))}
                        required
                      />
                    </div>
                  </>
                )}

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
      </div>

      {/* Views */}
      {viewMode === 'lista' && (
        <ListaView horarios={horarios} isPending={isPending} onEliminar={handleEliminar} sedes={sedes} />
      )}

      {viewMode === 'calendario' && (
        <>
          <CalendarioDesktopView horarios={horarios} />
          <CalendarioMobileView horarios={horarios} />
        </>
      )}
    </div>
  )
}

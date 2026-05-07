'use client'

import { useState, useMemo, useTransition } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Trash2,
  List,
  CalendarDays,
  MapPin,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Users,
  Swords,
} from 'lucide-react'
import { toast } from 'sonner'
import { crearEvento, editarEvento, eliminarEvento } from '../../_actions'
import { AsistenciasEvento } from './asistencias-evento'

// --- Tipos ---

interface PartidoDetalle {
  rival_texto: string | null
  condicion: string | null
  torneo_slug: string | null
  marcador_local: number | null
  marcador_visitante: number | null
}

interface Evento {
  id: string
  fecha: string | null
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  tipo_evento_slug: string
  titulo: string | null
  hora_citacion: string | null
  descripcion: string | null
  activo: boolean
  sede_id: string | null
  cancha_id: string | null
  notas_pre: string | null
  notas_post: string | null
  partidos_detalle: PartidoDetalle[] | null
}

function getPartido(ev: Evento): PartidoDetalle | null {
  const arr = ev.partidos_detalle
  return arr && arr.length > 0 ? arr[0] : null
}

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

interface CalendarioPanelProps {
  equipoId: string
  eventos: Evento[]
  sedes: Sede[]
  canchas: Cancha[]
}

// --- Constantes ---

const TIPOS_EVENTO = [
  { value: 'entrenamiento', label: 'Entrenamiento' },
  { value: 'partido', label: 'Partido' },
  { value: 'practica_informal', label: 'Práctica informal' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'evaluacion_fisica', label: 'Evaluación física' },
  { value: 'otro', label: 'Otro' },
]

const CONDICIONES = [
  { value: 'local', label: 'Local' },
  { value: 'visitante', label: 'Visitante' },
  { value: 'neutral', label: 'Neutral' },
]

const TIPO_COLORES: Record<string, string> = {
  entrenamiento: 'bg-blue-500/80 border-blue-600 text-white',
  partido: 'bg-green-500/80 border-green-600 text-white',
  practica_informal: 'bg-cyan-500/80 border-cyan-600 text-white',
  reunion: 'bg-purple-500/80 border-purple-600 text-white',
  evaluacion_fisica: 'bg-amber-500/80 border-amber-600 text-white',
  otro: 'bg-gray-500/80 border-gray-600 text-white',
}

const TIPO_BADGE_COLORES: Record<string, string> = {
  entrenamiento: 'bg-blue-100 text-blue-800 border-blue-200',
  partido: 'bg-green-100 text-green-800 border-green-200',
  practica_informal: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  reunion: 'bg-purple-100 text-purple-800 border-purple-200',
  evaluacion_fisica: 'bg-amber-100 text-amber-800 border-amber-200',
  otro: 'bg-gray-100 text-gray-800 border-gray-200',
}

const RECURRENCIA_OPTIONS = [
  { value: 'no_repite', label: 'No se repite' },
  { value: 'diario', label: 'Todos los días' },
  { value: 'semanal', label: 'Todas las semanas' },
  { value: 'quincenal', label: 'Cada 2 semanas' },
  { value: 'mensual', label: 'Todos los meses' },
]

const DIAS_SEMANA_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const HORA_INICIO_CALENDARIO = 7
const HORA_FIN_CALENDARIO = 22
const HORAS_TOTAL = HORA_FIN_CALENDARIO - HORA_INICIO_CALENDARIO

type ViewMode = 'lista' | 'calendario'
type FinRecurrencia = 'cantidad' | 'fecha'

// --- Utilidades ---

function getTipoLabel(tipo: string): string {
  return TIPOS_EVENTO.find((t) => t.value === tipo)?.label ?? tipo
}

function getTipoColor(tipo: string): string {
  return TIPO_COLORES[tipo] ?? TIPO_COLORES.otro
}

function getTipoBadgeColor(tipo: string): string {
  return TIPO_BADGE_COLORES[tipo] ?? TIPO_BADGE_COLORES.otro
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatFechaCorta(fechaStr: string): string {
  const fecha = new Date(fechaStr + 'T12:00:00')
  const diaSemana = DIAS_SEMANA_CORTO[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1]
  const dia = fecha.getDate()
  const mes = MESES[fecha.getMonth()]
  return `${diaSemana} ${dia} de ${mes}`
}

function formatTime(time: string): string {
  return time.slice(0, 5)
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function dateToYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function calcularFechasRecurrentes(
  fechaInicio: string,
  recurrencia: string,
  finTipo: FinRecurrencia,
  cantidad: number,
  fechaFin: string
): string[] {
  const fechas: string[] = []
  const inicio = new Date(fechaInicio + 'T12:00:00')
  const limite = finTipo === 'fecha' ? new Date(fechaFin + 'T23:59:59') : null
  const maxIteraciones = finTipo === 'cantidad' ? cantidad : 365

  for (let i = 0; i < maxIteraciones; i++) {
    const fecha = new Date(inicio)
    switch (recurrencia) {
      case 'diario':
        fecha.setDate(inicio.getDate() + i)
        break
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

    if (limite && fecha > limite) break
    fechas.push(dateToYMD(fecha))
  }

  return fechas
}

// --- ICS ---

function generateICS(
  evento: Evento,
  sedeNombre: string | null,
  canchaNombre: string | null
): string {
  const fecha = evento.fecha ?? ''
  const dtstart = fecha.replace(/-/g, '') + 'T' + evento.hora_inicio.replace(/:/g, '').slice(0, 6)
  const dtend = fecha.replace(/-/g, '') + 'T' + evento.hora_fin.replace(/:/g, '').slice(0, 6)

  const summary = evento.titulo ?? getTipoLabel(evento.tipo_evento_slug)
  const locationParts = [sedeNombre, canchaNombre].filter(Boolean)
  const location = locationParts.length > 0 ? locationParts.join(' - ') : ''

  const descParts: string[] = []
  if (evento.hora_citacion) {
    descParts.push(`Hora de citación: ${formatTime(evento.hora_citacion)}`)
  }
  if (evento.descripcion) {
    descParts.push(evento.descripcion)
  }
  const description = descParts.join('\\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClubCore//Hindu Club//ES',
    'BEGIN:VEVENT',
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
  ]
  if (location) lines.push(`LOCATION:${location}`)
  if (description) lines.push(`DESCRIPTION:${description}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.join('\r\n')
}

function downloadICS(
  evento: Evento,
  sedeNombre: string | null,
  canchaNombre: string | null
) {
  const content = generateICS(evento, sedeNombre, canchaNombre)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `evento-${evento.fecha ?? 'sin-fecha'}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// --- Vista Lista ---

function ListaView({
  eventos,
  isPending,
  onEliminar,
  onEditar,
  onAsistencias,
  sedes,
  canchas,
}: {
  eventos: Evento[]
  isPending: boolean
  onEliminar: (id: string) => void
  onEditar: (evento: Evento) => void
  onAsistencias: (evento: Evento) => void
  sedes: Sede[]
  canchas: Cancha[]
}) {
  const sorted = useMemo(
    () =>
      [...eventos].sort((a, b) => {
        const fa = a.fecha ?? ''
        const fb = b.fecha ?? ''
        if (fa !== fb) return fa.localeCompare(fb)
        return a.hora_inicio.localeCompare(b.hora_inicio)
      }),
    [eventos]
  )

  function getSedeNombre(sedeId: string | null): string | null {
    if (!sedeId) return null
    return sedes.find((s) => s.id === sedeId)?.nombre ?? null
  }

  function getCanchaNombre(canchaId: string | null): string | null {
    if (!canchaId) return null
    return canchas.find((c) => c.id === canchaId)?.nombre ?? null
  }

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay eventos programados.</p>
  }

  return (
    <div className="space-y-2">
      {sorted.map((ev) => {
        const sedeNombre = getSedeNombre(ev.sede_id)
        const canchaNombre = getCanchaNombre(ev.cancha_id)
        const ubicacion = [sedeNombre, canchaNombre].filter(Boolean).join(' · ')

        return (
          <div
            key={ev.id}
            className="rounded-lg border bg-card p-3 flex items-start justify-between gap-3"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {ev.fecha && (
                  <p className="text-sm font-medium">{formatFechaCorta(ev.fecha)}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {formatTime(ev.hora_inicio)} – {formatTime(ev.hora_fin)}
                </p>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 ${getTipoBadgeColor(ev.tipo_evento_slug)}`}
                >
                  {getTipoLabel(ev.tipo_evento_slug)}
                </Badge>
              </div>
              {ev.titulo && (
                <p className="text-sm font-medium truncate">{ev.titulo}</p>
              )}
              {getPartido(ev)?.rival_texto && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Swords className="h-3 w-3 shrink-0" />
                  vs {getPartido(ev)!.rival_texto}
                </p>
              )}
              {ubicacion && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {ubicacion}
                </p>
              )}
              {ev.hora_citacion && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  Citación: {formatTime(ev.hora_citacion)}
                </p>
              )}
              {ev.descripcion && (
                <p className="text-xs text-muted-foreground truncate">{ev.descripcion}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Asistencias"
                onClick={() => onAsistencias(ev)}
              >
                <Users className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Editar evento"
                disabled={isPending}
                onClick={() => onEditar(ev)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {ev.fecha && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title="Descargar .ics"
                  onClick={() =>
                    downloadICS(
                      ev,
                      getSedeNombre(ev.sede_id),
                      getCanchaNombre(ev.cancha_id)
                    )
                  }
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                disabled={isPending}
                onClick={() => onEliminar(ev.id)}
                title="Eliminar evento"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Vista Calendario Semanal ---

function CalendarioSemanalView({
  eventos,
  sedes,
  canchas,
}: {
  eventos: Evento[]
  sedes: Sede[]
  canchas: Cancha[]
}) {
  const [semanaOffset, setSemanaOffset] = useState(0)

  const lunesActual = useMemo(() => {
    const hoy = new Date()
    const lunes = getMonday(hoy)
    return addDays(lunes, semanaOffset * 7)
  }, [semanaOffset])

  const diasSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(lunesActual, i))
  }, [lunesActual])

  const horasArray = Array.from({ length: HORAS_TOTAL }, (_, i) => HORA_INICIO_CALENDARIO + i)
  const ROW_HEIGHT = 48

  function getSedeNombre(sedeId: string | null): string | null {
    if (!sedeId) return null
    return sedes.find((s) => s.id === sedeId)?.nombre ?? null
  }

  function getCanchaNombre(canchaId: string | null): string | null {
    if (!canchaId) return null
    return canchas.find((c) => c.id === canchaId)?.nombre ?? null
  }

  const rangoLabel = useMemo(() => {
    const inicio = diasSemana[0]
    const fin = diasSemana[6]
    const mesInicio = MESES[inicio.getMonth()]
    const mesFin = MESES[fin.getMonth()]
    if (inicio.getMonth() === fin.getMonth()) {
      return `${inicio.getDate()} – ${fin.getDate()} de ${mesInicio} ${inicio.getFullYear()}`
    }
    return `${inicio.getDate()} de ${mesInicio} – ${fin.getDate()} de ${mesFin} ${fin.getFullYear()}`
  }, [diasSemana])

  const hoyStr = dateToYMD(new Date())

  return (
    <div className="space-y-3">
      {/* Navegacion */}
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSemanaOffset((o) => o - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium text-center">
          <span className="capitalize">{rangoLabel}</span>
          {semanaOffset !== 0 && (
            <Button
              size="sm"
              variant="link"
              className="ml-2 text-xs h-auto p-0"
              onClick={() => setSemanaOffset(0)}
            >
              Hoy
            </Button>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSemanaOffset((o) => o + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grilla */}
      <div className="overflow-x-auto border rounded-lg">
        <div className="min-w-[700px]">
          {/* Header con dias */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/50">
            <div className="p-2 text-xs font-medium text-muted-foreground border-r" />
            {diasSemana.map((dia, i) => {
              const diaStr = dateToYMD(dia)
              const esHoy = diaStr === hoyStr
              return (
                <div
                  key={i}
                  className={`p-2 text-center border-r last:border-r-0 ${esHoy ? 'bg-primary/10' : ''}`}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {DIAS_SEMANA_CORTO[i]}
                  </p>
                  <p className={`text-sm font-semibold ${esHoy ? 'text-primary' : ''}`}>
                    {dia.getDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Body */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
            {/* Columna de horas */}
            <div className="relative" style={{ height: `${HORAS_TOTAL * ROW_HEIGHT}px` }}>
              {horasArray.map((hora) => (
                <div
                  key={hora}
                  className="absolute left-0 right-0 border-b text-[10px] text-muted-foreground px-1 pt-0.5"
                  style={{
                    top: `${(hora - HORA_INICIO_CALENDARIO) * ROW_HEIGHT}px`,
                    height: `${ROW_HEIGHT}px`,
                  }}
                >
                  {String(hora).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Columnas de dias */}
            {diasSemana.map((dia, colIdx) => {
              const diaStr = dateToYMD(dia)
              const esHoy = diaStr === hoyStr
              const eventosDelDia = eventos.filter((ev) => ev.fecha === diaStr)

              return (
                <div
                  key={colIdx}
                  className={`relative border-r last:border-r-0 ${esHoy ? 'bg-primary/5' : ''}`}
                  style={{ height: `${HORAS_TOTAL * ROW_HEIGHT}px` }}
                >
                  {/* Lineas de hora */}
                  {horasArray.map((hora) => (
                    <div
                      key={hora}
                      className="absolute left-0 right-0 border-b"
                      style={{
                        top: `${(hora - HORA_INICIO_CALENDARIO) * ROW_HEIGHT}px`,
                        height: `${ROW_HEIGHT}px`,
                      }}
                    />
                  ))}

                  {/* Bloques de eventos */}
                  {eventosDelDia.map((ev) => {
                    const inicioMin = timeToMinutes(ev.hora_inicio)
                    const finMin = timeToMinutes(ev.hora_fin)
                    const topPx =
                      ((inicioMin - HORA_INICIO_CALENDARIO * 60) / 60) * ROW_HEIGHT
                    const heightPx = ((finMin - inicioMin) / 60) * ROW_HEIGHT

                    if (topPx < 0 || heightPx <= 0) return null

                    const sedeNombre = getSedeNombre(ev.sede_id)
                    const canchaNombre = getCanchaNombre(ev.cancha_id)
                    const ubicacion = [sedeNombre, canchaNombre]
                      .filter(Boolean)
                      .join(' - ')

                    return (
                      <div
                        key={ev.id}
                        className={`absolute left-0.5 right-0.5 rounded px-1 py-0.5 border text-[10px] leading-tight overflow-hidden cursor-default ${getTipoColor(ev.tipo_evento_slug)}`}
                        style={{
                          top: `${topPx}px`,
                          height: `${Math.max(heightPx, 16)}px`,
                        }}
                        title={[
                          ev.titulo ?? getTipoLabel(ev.tipo_evento_slug),
                          `${formatTime(ev.hora_inicio)} – ${formatTime(ev.hora_fin)}`,
                          ubicacion,
                        ]
                          .filter(Boolean)
                          .join('\n')}
                      >
                        <span className="font-medium">
                          {formatTime(ev.hora_inicio)}
                        </span>
                        {heightPx >= 28 && (
                          <span className="block truncate">
                            {ev.titulo ?? getTipoLabel(ev.tipo_evento_slug)}
                          </span>
                        )}
                        {heightPx >= 44 && ubicacion && (
                          <span className="block truncate opacity-80">
                            {ubicacion}
                          </span>
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
    </div>
  )
}

// --- Componente principal ---

export function CalendarioPanel({
  equipoId,
  eventos,
  sedes,
  canchas,
}: CalendarioPanelProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<ViewMode>('lista')

  // Asistencias state
  const [asistenciasOpen, setAsistenciasOpen] = useState(false)
  const [asistenciasEvento, setAsistenciasEvento] = useState<Evento | null>(null)

  // Edit state
  const [editOpen, setEditOpen] = useState(false)
  const [editEvento, setEditEvento] = useState<Evento | null>(null)
  const [editFecha, setEditFecha] = useState('')
  const [editHoraInicio, setEditHoraInicio] = useState('')
  const [editHoraFin, setEditHoraFin] = useState('')
  const [editTipoEvento, setEditTipoEvento] = useState('')
  const [editTitulo, setEditTitulo] = useState('')
  const [editSedeId, setEditSedeId] = useState('')
  const [editCanchaId, setEditCanchaId] = useState('')
  const [editHoraCitacion, setEditHoraCitacion] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editRival, setEditRival] = useState('')
  const [editCondicion, setEditCondicion] = useState('local')
  const [editNotasPre, setEditNotasPre] = useState('')
  const [editNotasPost, setEditNotasPost] = useState('')

  // Form state (crear)
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [tipoEvento, setTipoEvento] = useState('')
  const [titulo, setTitulo] = useState('')
  const [sedeId, setSedeId] = useState('')
  const [canchaId, setCanchaId] = useState('')
  const [horaCitacion, setHoraCitacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [rival, setRival] = useState('')
  const [condicion, setCondicion] = useState('local')
  const [recurrencia, setRecurrencia] = useState('no_repite')
  const [finRecurrencia, setFinRecurrencia] = useState<FinRecurrencia>('cantidad')
  const [cantidadRepeticiones, setCantidadRepeticiones] = useState(4)
  const [fechaFinRecurrencia, setFechaFinRecurrencia] = useState('')

  // Canchas filtradas por sede
  const canchasFiltradas = sedeId
    ? canchas.filter((c) => c.sede_id === sedeId)
    : canchas

  function resetForm() {
    setFecha('')
    setHoraInicio('')
    setHoraFin('')
    setTipoEvento('')
    setTitulo('')
    setSedeId('')
    setCanchaId('')
    setHoraCitacion('')
    setDescripcion('')
    setRival('')
    setCondicion('local')
    setRecurrencia('no_repite')
    setFinRecurrencia('cantidad')
    setCantidadRepeticiones(4)
    setFechaFinRecurrencia('')
  }

  function handleCrear(e: React.FormEvent) {
    e.preventDefault()

    if (!fecha || !horaInicio || !horaFin || !tipoEvento) {
      toast.error('Fecha, hora inicio, hora fin y tipo de evento son obligatorios.')
      return
    }

    if (horaInicio >= horaFin) {
      toast.error('La hora de inicio debe ser anterior a la hora de fin.')
      return
    }

    startTransition(async () => {
      const baseEvento = {
        equipo_id: equipoId,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        tipo_evento_slug: tipoEvento,
        titulo: titulo.trim() || null,
        sede_id: sedeId || null,
        cancha_id: canchaId || null,
        hora_citacion: horaCitacion || null,
        descripcion: descripcion.trim() || null,
        rival: tipoEvento === 'partido' ? (rival.trim() || null) : null,
        condicion: tipoEvento === 'partido' ? condicion : null,
      }

      if (recurrencia === 'no_repite') {
        const result = await crearEvento({
          ...baseEvento,
          fecha,
        })

        if (result.ok) {
          toast.success(result.message)
          setOpen(false)
          resetForm()
        } else {
          toast.error(result.message)
        }
      } else {
        // Recurrente: generar fechas
        if (finRecurrencia === 'cantidad' && cantidadRepeticiones < 1) {
          toast.error('La cantidad de eventos debe ser al menos 1.')
          return
        }
        if (finRecurrencia === 'fecha' && !fechaFinRecurrencia) {
          toast.error('Seleccioná una fecha de finalización.')
          return
        }

        const fechas = calcularFechasRecurrentes(
          fecha,
          recurrencia,
          finRecurrencia,
          cantidadRepeticiones,
          fechaFinRecurrencia
        )

        if (fechas.length === 0) {
          toast.error('No se generaron fechas con los parámetros seleccionados.')
          return
        }

        let exitosos = 0
        let errores = 0

        for (const f of fechas) {
          const result = await crearEvento({
            ...baseEvento,
            fecha: f,
          })

          if (result.ok) {
            exitosos++
          } else {
            errores++
          }
        }

        if (errores === 0) {
          toast.success(
            `Se crearon ${exitosos} evento${exitosos > 1 ? 's' : ''} correctamente.`
          )
          setOpen(false)
          resetForm()
        } else {
          toast.error(
            `Se crearon ${exitosos} eventos, pero ${errores} fallaron.`
          )
        }
      }
    })
  }

  function handleEliminar(eventoId: string) {
    startTransition(async () => {
      const result = await eliminarEvento(eventoId, equipoId)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  function openAsistencias(evento: Evento) {
    setAsistenciasEvento(evento)
    setAsistenciasOpen(true)
  }

  function openEditDialog(evento: Evento) {
    setEditEvento(evento)
    setEditFecha(evento.fecha ?? '')
    setEditHoraInicio(evento.hora_inicio?.slice(0, 5) ?? '')
    setEditHoraFin(evento.hora_fin?.slice(0, 5) ?? '')
    setEditTipoEvento(evento.tipo_evento_slug)
    setEditTitulo(evento.titulo ?? '')
    setEditSedeId(evento.sede_id ?? '')
    setEditCanchaId(evento.cancha_id ?? '')
    setEditHoraCitacion(evento.hora_citacion?.slice(0, 5) ?? '')
    setEditDescripcion(evento.descripcion ?? '')
    const pd = getPartido(evento)
    setEditRival(pd?.rival_texto ?? '')
    setEditCondicion(pd?.condicion ?? 'local')
    setEditNotasPre(evento.notas_pre ?? '')
    setEditNotasPost(evento.notas_post ?? '')
    setEditOpen(true)
  }

  const editCanchasFiltradas = editSedeId
    ? canchas.filter((c) => c.sede_id === editSedeId)
    : canchas

  function handleEditar(e: React.FormEvent) {
    e.preventDefault()
    if (!editEvento) return

    if (!editFecha || !editHoraInicio || !editHoraFin || !editTipoEvento) {
      toast.error('Fecha, hora inicio, hora fin y tipo son obligatorios.')
      return
    }

    startTransition(async () => {
      const result = await editarEvento(editEvento.id, equipoId, {
        fecha: editFecha,
        hora_inicio: editHoraInicio,
        hora_fin: editHoraFin,
        tipo_evento_slug: editTipoEvento,
        titulo: editTitulo || null,
        sede_id: editSedeId || null,
        cancha_id: editCanchaId || null,
        hora_citacion: editHoraCitacion || null,
        descripcion: editDescripcion || null,
        rival: editTipoEvento === 'partido' ? (editRival || null) : null,
        condicion: editTipoEvento === 'partido' ? editCondicion : null,
        notas_pre: editNotasPre || null,
        notas_post: editNotasPost || null,
      })
      if (result.ok) {
        toast.success(result.message)
        setEditOpen(false)
        setEditEvento(null)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-medium text-muted-foreground">Calendario</h3>

        <div className="flex items-center gap-2">
          {/* Toggle vista */}
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

          {/* Boton nuevo evento */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo evento
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo evento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrear} className="space-y-4">
                {/* Fecha */}
                <div className="space-y-2">
                  <Label htmlFor="evento-fecha">Fecha</Label>
                  <Input
                    id="evento-fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                  />
                </div>

                {/* Hora inicio / fin */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="evento-hora-inicio">Hora inicio</Label>
                    <Input
                      id="evento-hora-inicio"
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evento-hora-fin">Hora fin</Label>
                    <Input
                      id="evento-hora-fin"
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Tipo evento */}
                <div className="space-y-2">
                  <Label>Tipo de evento</Label>
                  <Select
                    value={tipoEvento}
                    onValueChange={(v) => setTipoEvento(v ?? '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_EVENTO.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Titulo */}
                <div className="space-y-2">
                  <Label htmlFor="evento-titulo">Título (opcional)</Label>
                  <Input
                    id="evento-titulo"
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Partido vs River"
                  />
                </div>

                {/* Partido: rival + condicion */}
                {tipoEvento === 'partido' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="evento-rival">Rival (opcional)</Label>
                      <Input
                        id="evento-rival"
                        type="text"
                        value={rival}
                        onChange={(e) => setRival(e.target.value)}
                        placeholder="Ej: River Plate"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Condición</Label>
                      <Select
                        value={condicion}
                        onValueChange={(v) => setCondicion(v ?? 'local')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDICIONES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Sede */}
                <div className="space-y-2">
                  <Label>Sede (opcional)</Label>
                  <Select
                    value={sedeId}
                    onValueChange={(v) => {
                      setSedeId(v ?? '')
                      setCanchaId('')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sede" />
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
                {canchasFiltradas.length > 0 && (
                  <div className="space-y-2">
                    <Label>Cancha (opcional)</Label>
                    <Select
                      value={canchaId}
                      onValueChange={(v) => setCanchaId(v ?? '')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cancha" />
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
                )}

                {/* Hora citacion */}
                <div className="space-y-2">
                  <Label htmlFor="evento-citacion">Hora de citación (opcional)</Label>
                  <Input
                    id="evento-citacion"
                    type="time"
                    value={horaCitacion}
                    onChange={(e) => setHoraCitacion(e.target.value)}
                  />
                </div>

                {/* Descripcion */}
                <div className="space-y-2">
                  <Label htmlFor="evento-descripcion">Descripción (opcional)</Label>
                  <Textarea
                    id="evento-descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={2}
                    placeholder="Notas adicionales..."
                  />
                </div>

                {/* Repetir */}
                <div className="space-y-3 border-t pt-4">
                  <div className="space-y-2">
                    <Label>Repetir</Label>
                    <Select
                      value={recurrencia}
                      onValueChange={(v) => setRecurrencia(v ?? 'no_repite')}
                    >
                      <SelectTrigger>
                        <SelectValue />
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

                  {recurrencia !== 'no_repite' && (
                    <div className="space-y-3 pl-2 border-l-2 border-muted ml-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Finaliza
                      </p>

                      {/* Opcion: despues de N eventos */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="fin-recurrencia"
                          checked={finRecurrencia === 'cantidad'}
                          onChange={() => setFinRecurrencia('cantidad')}
                          className="accent-primary"
                        />
                        <span className="text-sm">Después de</span>
                        <Input
                          type="number"
                          min={1}
                          max={52}
                          value={cantidadRepeticiones}
                          onChange={(e) =>
                            setCantidadRepeticiones(
                              Math.min(52, Math.max(1, Number(e.target.value)))
                            )
                          }
                          className="w-16 h-8 text-sm"
                          disabled={finRecurrencia !== 'cantidad'}
                        />
                        <span className="text-sm">eventos</span>
                      </label>

                      {/* Opcion: en fecha */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="fin-recurrencia"
                          checked={finRecurrencia === 'fecha'}
                          onChange={() => setFinRecurrencia('fecha')}
                          className="accent-primary"
                        />
                        <span className="text-sm">En fecha</span>
                        <Input
                          type="date"
                          value={fechaFinRecurrencia}
                          onChange={(e) => setFechaFinRecurrencia(e.target.value)}
                          className="w-auto h-8 text-sm"
                          disabled={finRecurrencia !== 'fecha'}
                          min={fecha}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
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

      {/* Vistas */}
      {viewMode === 'lista' && (
        <ListaView
          eventos={eventos}
          isPending={isPending}
          onEliminar={handleEliminar}
          onEditar={openEditDialog}
          onAsistencias={openAsistencias}
          sedes={sedes}
          canchas={canchas}
        />
      )}

      {viewMode === 'calendario' && (
        <CalendarioSemanalView
          eventos={eventos}
          sedes={sedes}
          canchas={canchas}
        />
      )}

      {/* Dialog asistencias */}
      <Dialog open={asistenciasOpen} onOpenChange={setAsistenciasOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Asistencias — {asistenciasEvento?.titulo ?? getTipoLabel(asistenciasEvento?.tipo_evento_slug ?? '')}
              {asistenciasEvento?.fecha && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {formatFechaCorta(asistenciasEvento.fecha)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {asistenciasEvento && (
            <AsistenciasEvento
              eventoId={asistenciasEvento.id}
              equipoId={equipoId}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog editar evento */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fecha">Fecha</Label>
              <Input
                id="edit-fecha"
                type="date"
                value={editFecha}
                onChange={(e) => setEditFecha(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hora-inicio">Hora inicio</Label>
                <Input
                  id="edit-hora-inicio"
                  type="time"
                  value={editHoraInicio}
                  onChange={(e) => setEditHoraInicio(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hora-fin">Hora fin</Label>
                <Input
                  id="edit-hora-fin"
                  type="time"
                  value={editHoraFin}
                  onChange={(e) => setEditHoraFin(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de evento</Label>
              <Select
                value={editTipoEvento}
                onValueChange={(v) => setEditTipoEvento(v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_EVENTO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-titulo">Título (opcional)</Label>
              <Input
                id="edit-titulo"
                type="text"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                placeholder="Ej: Partido vs River"
              />
            </div>

            <div className="space-y-2">
              <Label>Sede (opcional)</Label>
              <Select
                value={editSedeId}
                onValueChange={(v) => {
                  setEditSedeId(v ?? '')
                  setEditCanchaId('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sede" />
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

            {editCanchasFiltradas.length > 0 && (
              <div className="space-y-2">
                <Label>Cancha (opcional)</Label>
                <Select
                  value={editCanchaId}
                  onValueChange={(v) => setEditCanchaId(v ?? '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cancha" />
                  </SelectTrigger>
                  <SelectContent>
                    {editCanchasFiltradas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-citacion">Hora de citación (opcional)</Label>
              <Input
                id="edit-citacion"
                type="time"
                value={editHoraCitacion}
                onChange={(e) => setEditHoraCitacion(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descripcion">Descripción (opcional)</Label>
              <Textarea
                id="edit-descripcion"
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                rows={2}
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Partido: rival + condicion */}
            {editTipoEvento === 'partido' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-rival">Rival (opcional)</Label>
                  <Input
                    id="edit-rival"
                    type="text"
                    value={editRival}
                    onChange={(e) => setEditRival(e.target.value)}
                    placeholder="Ej: River Plate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Condición</Label>
                  <Select
                    value={editCondicion}
                    onValueChange={(v) => setEditCondicion(v ?? 'local')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDICIONES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Notas pre-evento */}
            <div className="space-y-2">
              <Label htmlFor="edit-notas-pre">Notas pre-evento (opcional)</Label>
              <Textarea
                id="edit-notas-pre"
                value={editNotasPre}
                onChange={(e) => setEditNotasPre(e.target.value)}
                rows={2}
                placeholder="Indicaciones previas al evento..."
              />
            </div>

            {/* Notas post-evento */}
            <div className="space-y-2">
              <Label htmlFor="edit-notas-post">Notas post-evento (opcional)</Label>
              <Textarea
                id="edit-notas-post"
                value={editNotasPost}
                onChange={(e) => setEditNotasPost(e.target.value)}
                rows={2}
                placeholder="Resumen, observaciones posteriores..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

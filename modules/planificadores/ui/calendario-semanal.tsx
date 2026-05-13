'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, type SlotInfo } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { moverEventoAction } from '../lib/actions'
import { ModalDetalleEvento } from './modal-detalle-evento'
import { ModalMoverRecurrente } from './modal-mover-recurrente'
import { WarningOverlap } from './warning-overlap'
import type { EventoCalendar, ConflictoOverlap, MoverEventoScope } from '../lib/types'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

const locales = { es }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

const DnDCalendar = withDragAndDrop(Calendar<EventoCalendar>)

const COLORES_TIPO: Record<string, string> = {
  entrenamiento: '#2563eb',
  partido: '#dc2626',
}

function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

type PendienteDrop = {
  event: EventoCalendar
  start: Date
  end: Date
}

export function CalendarioSemanal({
  eventos: eventosIniciales,
  fechaInicioStr,
}: {
  eventos: EventoCalendar[]
  fechaInicioStr: string // 'yyyy-MM-dd' — constructed to Date on client to avoid timezone shift
  personaId: string
  tenantId: string
}) {
  const fechaInicio = useMemo(() => new Date(`${fechaInicioStr}T12:00:00`), [fechaInicioStr])
  const router = useRouter()
  const [eventos, setEventos] = useState(eventosIniciales)
  const [seleccionado, setSeleccionado] = useState<EventoCalendar | null>(null)
  const [pendienteRecurrente, setPendienteRecurrente] = useState<PendienteDrop | null>(null)
  const [conflictoInfo, setConflictoInfo] = useState<{ drop: PendienteDrop; conflicto: ConflictoOverlap; scope: MoverEventoScope } | null>(null)
  const [moviendo, setMoviendo] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [nuevoEventoSlot, setNuevoEventoSlot] = useState<{ start: Date; end: Date } | null>(null)

  useEffect(() => {
    setIsTouch(isTouchDevice())
  }, [])

  const ejecutarMover = useCallback(async (
    event: EventoCalendar,
    start: Date,
    end: Date,
    scope: MoverEventoScope,
    ignorarOverlap = false,
  ) => {
    setMoviendo(true)
    try {
      const result = await moverEventoAction({
        evento_id: event.id,
        nueva_fecha: format(start, 'yyyy-MM-dd'),
        nueva_hora_inicio: format(start, 'HH:mm:ss'),
        nueva_hora_fin: format(end, 'HH:mm:ss'),
        scope,
        ignorar_overlap: ignorarOverlap,
      })

      if (!result.ok) {
        if (result.conflicto) {
          setConflictoInfo({ drop: { event, start, end }, conflicto: result.conflicto, scope })
          return
        }
        alert(`Error: ${result.error}`)
        return
      }

      if (scope === 'esta_ocurrencia' && event.resource.es_recurrente && result.evento_nuevo_id) {
        setEventos(prev => [...prev, {
          ...event,
          id: result.evento_nuevo_id!,
          start,
          end,
          resource: { ...event.resource, es_recurrente: false, evento_padre_id: event.id },
        }])
      } else {
        setEventos(prev => prev.map(e =>
          e.id === event.id
            ? { ...e, start, end, resource: { ...e.resource, fecha: format(start, 'yyyy-MM-dd') } }
            : e
        ))
      }
    } finally {
      setMoviendo(false)
    }
  }, [])

  const handleEventDrop = useCallback(({ event, start, end }: { event: EventoCalendar; start: string | Date; end: string | Date }) => {
    const startDate = new Date(start)
    const endDate = new Date(end)

    if (event.resource.es_recurrente) {
      setPendienteRecurrente({ event, start: startDate, end: endDate })
      return
    }

    ejecutarMover(event, startDate, endDate, 'esta_ocurrencia')
  }, [ejecutarMover])

  const handleEventResize = useCallback(({ event, start, end }: { event: EventoCalendar; start: string | Date; end: string | Date }) => {
    const startDate = new Date(start)
    const endDate = new Date(end)

    if (event.resource.es_recurrente) {
      setPendienteRecurrente({ event, start: startDate, end: endDate })
      return
    }

    ejecutarMover(event, startDate, endDate, 'esta_ocurrencia')
  }, [ejecutarMover])

  const handleRecurrenteConfirm = useCallback((scope: MoverEventoScope) => {
    if (!pendienteRecurrente) return
    const { event, start, end } = pendienteRecurrente
    setPendienteRecurrente(null)
    ejecutarMover(event, start, end, scope)
  }, [pendienteRecurrente, ejecutarMover])

  const handleOverlapConfirm = useCallback(() => {
    if (!conflictoInfo) return
    const { drop, scope } = conflictoInfo
    setConflictoInfo(null)
    ejecutarMover(drop.event, drop.start, drop.end, scope, true)
  }, [conflictoInfo, ejecutarMover])

  const eventPropGetter = useCallback((event: EventoCalendar) => ({
    style: {
      backgroundColor: event.resource.color ?? COLORES_TIPO[event.resource.tipo_evento_slug] ?? '#6b7280',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
    },
    'data-testid': `evento-card-${event.id}`,
  }), [])

  const handleNavigate = useCallback((date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    router.push(`/admin/planificadores/semanal?fecha=${format(d, 'yyyy-MM-dd')}`)
  }, [router])

  const messages = useMemo(() => ({
    today: 'Hoy',
    previous: 'Anterior',
    next: 'Siguiente',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay eventos en este rango.',
  }), [])

  const minTime = useMemo(() => new Date(0, 0, 0, 6, 0, 0), [])
  const maxTime = useMemo(() => new Date(0, 0, 0, 23, 0, 0), [])

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setNuevoEventoSlot({ start: slotInfo.start, end: slotInfo.end })
  }, [])

  const handleNuevoEvento = useCallback(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    setNuevoEventoSlot({ start, end })
  }, [])

  return (
    <div data-testid="planificador-calendario">
      <div className="flex items-center justify-end mb-3">
        <button
          type="button"
          onClick={handleNuevoEvento}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          data-testid="btn-nuevo-evento-planificador"
        >
          + Nuevo evento
        </button>
      </div>

      {nuevoEventoSlot && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md text-sm">
          <div className="flex items-center justify-between">
            <span>
              Nuevo evento: {format(nuevoEventoSlot.start, 'dd/MM HH:mm')} - {format(nuevoEventoSlot.end, 'HH:mm')}
            </span>
            <button
              type="button"
              onClick={() => setNuevoEventoSlot(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Funcionalidad de creacion de eventos disponible en Sprint A2.
          </p>
        </div>
      )}

      {isTouch && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-700 dark:text-blue-300">
          Para mover o redimensionar eventos, usá la versión de escritorio.
        </div>
      )}

      {moviendo && (
        <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-center">
          Actualizando evento...
        </div>
      )}

      <DnDCalendar
        localizer={localizer}
        events={eventos}
        titleAccessor="titulo"
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={['week']}
        defaultDate={fechaInicio}
        min={minTime}
        max={maxTime}
        step={30}
        timeslots={2}
        onEventDrop={isTouch ? undefined : handleEventDrop}
        onEventResize={isTouch ? undefined : handleEventResize}
        resizable={!isTouch}
        draggableAccessor={() => !isTouch}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={(event) => setSeleccionado(event as EventoCalendar)}
        eventPropGetter={eventPropGetter}
        onNavigate={handleNavigate}
        messages={messages}
        culture="es"
        style={{ height: 700 }}
      />

      {seleccionado && (
        <ModalDetalleEvento
          evento={seleccionado}
          onClose={() => setSeleccionado(null)}
        />
      )}

      {pendienteRecurrente && (
        <ModalMoverRecurrente
          onConfirm={handleRecurrenteConfirm}
          onCancel={() => setPendienteRecurrente(null)}
        />
      )}

      {conflictoInfo && (
        <WarningOverlap
          conflicto={conflictoInfo.conflicto}
          onMoverIgual={handleOverlapConfirm}
          onCancelar={() => setConflictoInfo(null)}
        />
      )}
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { TareaModal } from './tarea-modal'
import type { TareaConRelaciones, EstadoTareaCatalogo } from '../lib/tipos'
import { PRIORIDAD_COLORS } from '../lib/tipos'

import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { es }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

interface Props {
  proyectoId: string
  tareas: TareaConRelaciones[]
  estados: EstadoTareaCatalogo[]
  colorProyecto?: string
  miembros?: { id: string; nombre: string; apellido: string }[]
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: TareaConRelaciones
}

export function CalendarioProyecto({ proyectoId, tareas, estados, colorProyecto, miembros = [] }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTarea, setSelectedTarea] = useState<TareaConRelaciones | null>(null)

  const events = useMemo<CalendarEvent[]>(() => {
    return tareas
      .filter(t => t.fecha_limite)
      .map(t => {
        const date = new Date(t.fecha_limite!)
        return {
          id: t.id,
          title: t.titulo,
          start: date,
          end: date,
          resource: t,
        }
      })
  }, [tareas])

  function handleSelectEvent(event: CalendarEvent) {
    setSelectedTarea(event.resource)
    setModalOpen(true)
  }

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: colorProyecto ?? PRIORIDAD_COLORS[event.resource.prioridad],
      borderRadius: '4px',
      opacity: 0.9,
      color: '#fff',
      border: 'none',
      fontSize: '12px',
    },
  })

  const messages = {
    today: 'Hoy',
    previous: 'Anterior',
    next: 'Siguiente',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    noEventsInRange: 'Sin tareas en este rango',
  }

  return (
    <>
      <div className="h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          culture="es"
          views={['month', 'week', 'agenda']}
          defaultView="month"
        />
      </div>

      <TareaModal
        open={modalOpen}
        onOpenChange={(open) => { setModalOpen(open); if (!open) setSelectedTarea(null) }}
        proyectoId={proyectoId}
        tarea={selectedTarea}
        estados={estados}
        miembros={miembros}
      />
    </>
  )
}

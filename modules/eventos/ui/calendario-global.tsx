'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { ModalDetalleEvento } from './modal-detalle-evento'
import type { EventoCalendarioItem } from './types'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { es }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

const COLORES_TIPO: Record<string, string> = {
  entrenamiento: '#2563eb',
  partido: '#dc2626',
  amistoso: '#f59e0b',
  reunion: '#8b5cf6',
  vencimiento: '#ef4444',
  reserva: '#10b981',
  mantenimiento: '#6b7280',
  asamblea: '#ec4899',
}

export type CalendarioGlobalProps = {
  eventos: EventoCalendarioItem[]
  year: number
  month: number
  tenantId: string
}

export function CalendarioGlobal({
  eventos: eventosIniciales,
  year,
  month,
  tenantId,
}: CalendarioGlobalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [seleccionado, setSeleccionado] = useState<EventoCalendarioItem | null>(null)

  const defaultDate = useMemo(() => new Date(year, month - 1), [year, month])

  const eventos = useMemo(() => {
    return eventosIniciales.map(e => ({
      ...e,
      start: new Date(`${e.fecha_inicio}T${e.hora_inicio ?? '00:00:00'}`),
      end: new Date(`${e.fecha_fin}T${e.hora_fin ?? e.hora_inicio ?? '00:00:00'}`),
    }))
  }, [eventosIniciales])

  const eventPropGetter = useCallback((event: EventoCalendarioItem & { start: Date; end: Date }) => ({
    style: {
      backgroundColor: event.color ?? COLORES_TIPO[event.tipo_evento_slug] ?? '#6b7280',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
    },
  }), [])

  const handleNavigate = useCallback((date: Date) => {
    const newYear = date.getFullYear()
    const newMonth = date.getMonth() + 1
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', String(newYear))
    params.set('month', String(newMonth))
    router.push(`/admin/${tenantId}/calendario?${params.toString()}`)
  }, [router, tenantId, searchParams])

  const messages = useMemo(() => ({
    today: 'Hoy',
    previous: 'Anterior',
    next: 'Siguiente',
    month: 'Mes',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay eventos en este rango.',
  }), [])

  return (
    <div data-testid="calendario-global">
      <Calendar
        localizer={localizer}
        events={eventos}
        titleAccessor={(e) => (e as EventoCalendarioItem).titulo ?? '(sin titulo)'}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={['month', 'week', 'agenda']}
        defaultDate={defaultDate}
        onSelectEvent={(event) => setSeleccionado(event as EventoCalendarioItem & { start: Date; end: Date })}
        eventPropGetter={eventPropGetter as never}
        onNavigate={handleNavigate}
        messages={messages}
        culture="es"
        popup
        style={{ height: 700 }}
      />

      {seleccionado && (
        <ModalDetalleEvento
          evento={seleccionado}
          onClose={() => setSeleccionado(null)}
          tenantId={tenantId}
        />
      )}
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  Clock,
  Swords,
} from 'lucide-react'
import type { EventoSemana, EquipoSimple } from '../_lib/queries'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const TIPOS_ACTIVIDAD = [
  { value: 'entrenamiento', label: 'Entrenamiento', color: 'bg-blue-100 text-blue-800' },
  { value: 'partido_oficial', label: 'Partido oficial', color: 'bg-red-100 text-red-800' },
  { value: 'partido_amistoso', label: 'Amistoso', color: 'bg-orange-100 text-orange-800' },
  { value: 'viaje', label: 'Viaje', color: 'bg-purple-100 text-purple-800' },
  { value: 'reunion', label: 'Reunion', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'otro', label: 'Otro', color: 'bg-gray-100 text-gray-800' },
] as const

const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
  'Domingo',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Devuelve el lunes de la semana que contiene `date` */
function getLunes(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=dom, 1=lun, ...
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatFecha(date: Date): string {
  return date.toISOString().slice(0, 10) // yyyy-mm-dd
}

function formatFechaDisplay(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  })
}

function formatRangoSemana(lunes: Date): string {
  const domingo = addDays(lunes, 6)
  const mesIgual =
    lunes.getMonth() === domingo.getMonth() &&
    lunes.getFullYear() === domingo.getFullYear()

  if (mesIgual) {
    return `${lunes.getDate()} - ${domingo.getDate()} de ${lunes.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
  }
  return `${formatFechaDisplay(lunes)} - ${formatFechaDisplay(domingo)} ${domingo.getFullYear()}`
}

function getTipoBadge(tipo: string) {
  const found = TIPOS_ACTIVIDAD.find((t) => t.value === tipo)
  return found ?? { value: tipo, label: tipo, color: 'bg-gray-100 text-gray-800' }
}

function formatHora(h: string | null): string {
  if (!h) return ''
  return h.slice(0, 5) // "08:00:00" -> "08:00"
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SemanaOperacionesProps {
  eventosIniciales: EventoSemana[]
  equipos: EquipoSimple[]
  lunesInicialISO: string
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function SemanaOperaciones({
  eventosIniciales,
  equipos,
  lunesInicialISO,
}: SemanaOperacionesProps) {
  const [lunes, setLunes] = useState(() => new Date(lunesInicialISO + 'T00:00:00'))
  const [eventos, setEventos] = useState<EventoSemana[]>(eventosIniciales)
  const [loading, setLoading] = useState(false)

  // Filtros
  const [filtroEquipo, setFiltroEquipo] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')

  // --------------------------------------------------
  // Fetch client-side cuando cambia la semana
  // --------------------------------------------------
  async function cargarSemana(nuevoLunes: Date) {
    setLunes(nuevoLunes)
    setLoading(true)
    try {
      const inicio = formatFecha(nuevoLunes)
      const fin = formatFecha(addDays(nuevoLunes, 6))
      const res = await fetch(
        `/api/operaciones/eventos?inicio=${inicio}&fin=${fin}`
      )
      if (!res.ok) throw new Error('Error al cargar eventos')
      const data: EventoSemana[] = await res.json()
      setEventos(data)
    } catch {
      // Si falla el fetch, mantener lo que hay
    } finally {
      setLoading(false)
    }
  }

  function irSemanaAnterior() {
    cargarSemana(addDays(lunes, -7))
  }

  function irSemanaSiguiente() {
    cargarSemana(addDays(lunes, 7))
  }

  function irSemanaActual() {
    cargarSemana(getLunes(new Date()))
  }

  // --------------------------------------------------
  // Filtrar y agrupar por dia
  // --------------------------------------------------
  const eventosFiltrados = useMemo(() => {
    let filtered = eventos
    if (filtroEquipo) {
      filtered = filtered.filter((e) => e.equipo?.id === filtroEquipo)
    }
    if (filtroTipo) {
      filtered = filtered.filter((e) => e.tipo_actividad === filtroTipo)
    }
    return filtered
  }, [eventos, filtroEquipo, filtroTipo])

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, EventoSemana[]>()
    for (let i = 0; i < 7; i++) {
      const dia = formatFecha(addDays(lunes, i))
      map.set(dia, [])
    }
    for (const ev of eventosFiltrados) {
      if (ev.fecha) {
        const list = map.get(ev.fecha)
        if (list) list.push(ev)
      }
    }
    return map
  }, [eventosFiltrados, lunes])

  const totalEventos = eventosFiltrados.length

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Operaciones</h1>
        <p className="text-sm text-muted-foreground">
          Vista semanal de actividades de todos los equipos
        </p>
      </div>

      {/* Navegacion semana + filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Navegacion */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={irSemanaAnterior} disabled={loading}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={irSemanaActual} disabled={loading}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={irSemanaSiguiente} disabled={loading}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-sm font-medium sm:text-base">
            {formatRangoSemana(lunes)}
          </span>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2">
          <Select
            value={filtroEquipo}
            onValueChange={(v) => setFiltroEquipo(v ?? '')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los equipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los equipos</SelectItem>
              {equipos.map((eq) => (
                <SelectItem key={eq.id} value={eq.id}>
                  {eq.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filtroTipo}
            onValueChange={(v) => setFiltroTipo(v ?? '')}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los tipos</SelectItem>
              {TIPOS_ACTIVIDAD.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumen */}
      <p className="text-xs text-muted-foreground">
        {totalEventos} {totalEventos === 1 ? 'actividad' : 'actividades'} esta semana
        {loading && ' — cargando...'}
      </p>

      {/* Dias de la semana */}
      <div className="space-y-3">
        {Array.from(eventosPorDia.entries()).map(([fechaStr, eventosDelDia], idx) => {
          const fechaDate = new Date(fechaStr + 'T00:00:00')
          const hoy = formatFecha(new Date()) === fechaStr
          const diaNombre = DIAS_SEMANA[idx]

          return (
            <div key={fechaStr}>
              {/* Encabezado del dia */}
              <div
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold ${
                  hoy
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                {diaNombre} {formatFechaDisplay(fechaDate)}
                {eventosDelDia.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {eventosDelDia.length}
                  </Badge>
                )}
              </div>

              {/* Eventos del dia */}
              {eventosDelDia.length === 0 ? (
                <p className="py-2 pl-3 text-xs text-muted-foreground italic">
                  Sin actividades
                </p>
              ) : (
                <div className="mt-1 space-y-1.5">
                  {eventosDelDia.map((ev) => {
                    const tipoBadge = getTipoBadge(ev.tipo_actividad)
                    const esPartido =
                      ev.tipo_actividad === 'partido_oficial' ||
                      ev.tipo_actividad === 'partido_amistoso'

                    return (
                      <Card key={ev.id} className="border-l-4" style={{
                        borderLeftColor: ev.equipo?.color_principal ?? '#94a3b8',
                      }}>
                        <CardContent className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:gap-4">
                          {/* Horario */}
                          <div className="flex items-center gap-1 text-sm font-medium tabular-nums shrink-0">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatHora(ev.hora_inicio)} - {formatHora(ev.hora_fin)}
                          </div>

                          {/* Equipo */}
                          <div className="shrink-0">
                            {ev.equipo ? (
                              <Link
                                href={`/admin/equipos/${ev.equipo.id}`}
                                className="text-sm font-medium hover:underline"
                              >
                                {ev.equipo.nombre}
                              </Link>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Sin equipo
                              </span>
                            )}
                          </div>

                          {/* Badge tipo */}
                          <Badge
                            variant="secondary"
                            className={`w-fit text-xs ${tipoBadge.color}`}
                          >
                            {tipoBadge.label}
                          </Badge>

                          {/* Titulo / Rival */}
                          <div className="flex-1 text-sm">
                            {ev.titulo && (
                              <span className="font-medium">{ev.titulo}</span>
                            )}
                            {esPartido && ev.rival && (
                              <span className="inline-flex items-center gap-1 ml-2 text-muted-foreground">
                                <Swords className="h-3.5 w-3.5" />
                                vs {ev.rival}
                              </span>
                            )}
                          </div>

                          {/* Sede / Cancha */}
                          {(ev.sede || ev.cancha) && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                              <MapPin className="h-3.5 w-3.5" />
                              {ev.sede?.nombre}
                              {ev.sede && ev.cancha && ' — '}
                              {ev.cancha?.nombre}
                            </div>
                          )}

                          {/* Hora citacion */}
                          {ev.hora_citacion && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              Citacion: {formatHora(ev.hora_citacion)}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state global */}
      {totalEventos === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">
              No hay actividades esta semana
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Probá cambiar los filtros o navegar a otra semana.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

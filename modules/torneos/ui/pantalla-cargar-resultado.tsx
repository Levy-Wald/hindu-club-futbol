'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  obtenerDatosPartidoAction,
  cargarEventoAction,
  eliminarEventoAction,
  confirmarResultadoAction,
} from '../lib/resultado-actions'
import type { TipoEventoPartido, JugadorPlantel } from '../lib/resultado-types'
import { Paso1MarcadorPlantel } from './paso-1-marcador-plantel'
import { Paso2Eventos } from './paso-2-eventos'
import { Paso3Revision } from './paso-3-revision'

type DatosPartido = Awaited<ReturnType<typeof obtenerDatosPartidoAction>> & { ok: true }

export function PantallaCargarResultado({ eventoId }: { eventoId: string }) {
  const [isPending, startTransition] = useTransition()
  const [paso, setPaso] = useState(1)
  const [datos, setDatos] = useState<DatosPartido | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Step 1 state
  const [marcadorLocal, setMarcadorLocal] = useState(0)
  const [marcadorVisitante, setMarcadorVisitante] = useState(0)
  const [jugadores, setJugadores] = useState<JugadorPlantel[]>([])

  // Step 2 state - events loaded from server
  const [eventosPartido, setEventosPartido] = useState<DatosPartido['eventosPartido']>([])

  // Confirmed state
  const [confirmado, setConfirmado] = useState(false)

  useEffect(() => {
    startTransition(async () => {
      const res = await obtenerDatosPartidoAction(eventoId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setDatos(res)
      setMarcadorLocal(res.partido.marcador_local ?? 0)
      setMarcadorVisitante(res.partido.marcador_visitante ?? 0)
      setEventosPartido(res.eventosPartido)
      setConfirmado(res.partido.convocatoria_cerrada ?? false)
      // Initialize jugadores from plantel
      setJugadores(
        res.plantel.map((p) => ({
          ...p,
          jugo: true,
          minutos: 90,
        }))
      )
    })
  }, [eventoId])

  async function handleAgregarEvento(input: {
    minuto: number
    tipo: TipoEventoPartido
    persona_id?: string
    equipo_id?: string
    equipo_externo_nombre?: string
    persona_relacionada_id?: string
    descripcion?: string
  }) {
    const res = await cargarEventoAction({
      partido_evento_id: eventoId,
      ...input,
    })
    if (!res.ok) return res
    // Reload eventos
    const reload = await obtenerDatosPartidoAction(eventoId)
    if (reload.ok) {
      setEventosPartido(reload.eventosPartido)
    }
    return res
  }

  async function handleEliminarEvento(id: string) {
    const res = await eliminarEventoAction(id)
    if (res.ok) {
      setEventosPartido((prev) => prev.filter((e) => e.id !== id))
    }
    return res
  }

  async function handleConfirmar() {
    const res = await confirmarResultadoAction({
      partido_evento_id: eventoId,
      marcador_local: marcadorLocal,
      marcador_visitante: marcadorVisitante,
    })
    if (res.ok) {
      setConfirmado(true)
    }
    return res
  }

  if (isPending && !datos) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="pantalla-cargar-resultado">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="pantalla-cargar-resultado">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </div>
    )
  }

  if (!datos) return null

  const titulo = datos.evento.titulo ?? `Partido ${datos.partido.condicion ?? ''}`
  const torneoId = datos.partido.torneo_id

  return (
    <div data-testid="pantalla-cargar-resultado">
      <div className="flex items-center gap-3 mb-6">
        <Link href={torneoId ? `/admin/competencias/torneos/${torneoId}` : '/admin/competencias/torneos'}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Cargar resultado</h1>
          <p className="text-sm text-muted-foreground">
            {titulo} — {datos.evento.fecha}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((p) => (
          <button
            key={p}
            onClick={() => !confirmado && setPaso(p)}
            disabled={confirmado}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              paso === p
                ? 'bg-primary text-primary-foreground'
                : p < paso
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
              {p}
            </span>
            {p === 1 && 'Marcador'}
            {p === 2 && 'Eventos'}
            {p === 3 && 'Revisión'}
          </button>
        ))}
      </div>

      {confirmado && (
        <div className="rounded-lg border border-green-500 bg-green-500/10 p-3 mb-4 text-sm text-green-700 dark:text-green-400" data-testid="resultado-confirmado">
          Resultado confirmado. Los datos fueron guardados.
        </div>
      )}

      {paso === 1 && (
        <Paso1MarcadorPlantel
          datos={datos}
          marcadorLocal={marcadorLocal}
          setMarcadorLocal={setMarcadorLocal}
          marcadorVisitante={marcadorVisitante}
          setMarcadorVisitante={setMarcadorVisitante}
          jugadores={jugadores}
          setJugadores={setJugadores}
          onSiguiente={() => setPaso(2)}
          confirmado={confirmado}
        />
      )}

      {paso === 2 && (
        <Paso2Eventos
          datos={datos}
          jugadores={jugadores}
          eventosPartido={eventosPartido}
          onAgregarEvento={handleAgregarEvento}
          onEliminarEvento={handleEliminarEvento}
          onSiguiente={() => setPaso(3)}
          onAnterior={() => setPaso(1)}
          confirmado={confirmado}
        />
      )}

      {paso === 3 && (
        <Paso3Revision
          datos={datos}
          marcadorLocal={marcadorLocal}
          marcadorVisitante={marcadorVisitante}
          eventosPartido={eventosPartido}
          onConfirmar={handleConfirmar}
          onAnterior={() => setPaso(2)}
          confirmado={confirmado}
        />
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TipoEventoPartido } from '../lib/resultado-types'
import type { obtenerDatosPartidoAction } from '../lib/resultado-actions'

type DatosPartido = Awaited<ReturnType<typeof obtenerDatosPartidoAction>> & { ok: true }
type EventoRow = DatosPartido['eventosPartido'][number]

const TIPOS_LABELS: Record<string, string> = {
  gol: 'Gol',
  asistencia: 'Asistencia',
  tarjeta_amarilla: 'Tarjeta amarilla',
  tarjeta_roja: 'Tarjeta roja',
  cambio: 'Cambio',
  penal_atajado: 'Penal atajado',
  penal_errado: 'Penal errado',
  autogol: 'Autogol',
}

export function Paso3Revision({
  datos,
  marcadorLocal,
  marcadorVisitante,
  eventosPartido,
  onConfirmar,
  onAnterior,
  confirmado,
}: {
  datos: DatosPartido
  marcadorLocal: number
  marcadorVisitante: number
  eventosPartido: EventoRow[]
  onConfirmar: () => Promise<{ ok: boolean; error?: string }>
  onAnterior: () => void
  confirmado: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const rivalNombre = datos.partido.rival_texto ?? 'Rival'

  // Count goals from events
  const golesLocalCargados = eventosPartido.filter(
    (e) => e.tipo === 'gol' && e.equipo_externo_nombre === null
  ).length
  const golesVisitanteCargados = eventosPartido.filter(
    (e) => e.tipo === 'gol' && e.equipo_externo_nombre !== null
  ).length
  const autogolesLocal = eventosPartido.filter(
    (e) => e.tipo === 'autogol' && e.equipo_externo_nombre === null
  ).length
  const autogolesVisitante = eventosPartido.filter(
    (e) => e.tipo === 'autogol' && e.equipo_externo_nombre !== null
  ).length

  // Autogol local = gol para visitante
  const golesEfectivosLocal = golesLocalCargados + autogolesVisitante
  const golesEfectivosVisitante = golesVisitanteCargados + autogolesLocal

  const marcadorNoCoincide =
    eventosPartido.length > 0 &&
    (golesEfectivosLocal !== marcadorLocal || golesEfectivosVisitante !== marcadorVisitante)

  // Build stats summary
  const statsMap = new Map<
    string,
    { nombre: string; goles: number; asistencias: number; amarillas: number; rojas: number }
  >()

  for (const e of eventosPartido) {
    if (!e.persona_id || e.equipo_externo_nombre !== null) continue
    const plantel = datos.plantel.find((p) => p.persona_id === e.persona_id)
    const nombre = plantel ? `${plantel.apellido}, ${plantel.nombre}` : e.persona_id.slice(0, 8)

    if (!statsMap.has(e.persona_id)) {
      statsMap.set(e.persona_id, { nombre, goles: 0, asistencias: 0, amarillas: 0, rojas: 0 })
    }
    const s = statsMap.get(e.persona_id)!

    if (e.tipo === 'gol') s.goles++
    if (e.tipo === 'tarjeta_amarilla') s.amarillas++
    if (e.tipo === 'tarjeta_roja') s.rojas++

    // Assist via persona_relacionada_id on gol events
    if (e.tipo === 'gol' && e.persona_relacionada_id) {
      const asistente = datos.plantel.find((p) => p.persona_id === e.persona_relacionada_id)
      const aNombre = asistente
        ? `${asistente.apellido}, ${asistente.nombre}`
        : e.persona_relacionada_id.slice(0, 8)
      if (!statsMap.has(e.persona_relacionada_id)) {
        statsMap.set(e.persona_relacionada_id, {
          nombre: aNombre,
          goles: 0,
          asistencias: 0,
          amarillas: 0,
          rojas: 0,
        })
      }
      statsMap.get(e.persona_relacionada_id)!.asistencias++
    }
  }

  function handleConfirmar() {
    setError(null)
    startTransition(async () => {
      const res = await onConfirmar()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(res.error ?? 'Error al confirmar')
      }
    })
  }

  const sorted = eventosPartido.slice().sort((a, b) => a.minuto - b.minuto)

  return (
    <div data-testid="paso-3-revision">
      {/* Marcador */}
      <div className="rounded-lg border p-6 mb-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Marcador final</p>
        <p className="text-4xl font-bold">
          {marcadorLocal} — {marcadorVisitante}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Local vs {rivalNombre}
        </p>
      </div>

      {/* Warning */}
      {marcadorNoCoincide && (
        <div
          className="rounded-lg border border-yellow-500 bg-yellow-500/10 p-3 mb-4 flex items-start gap-2"
          data-testid="warning-marcador-no-coincide"
        >
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-yellow-700 dark:text-yellow-400">
              El marcador no coincide con los goles cargados
            </p>
            <p className="text-yellow-600 dark:text-yellow-500">
              Marcador: {marcadorLocal}-{marcadorVisitante} · Goles cargados:{' '}
              {golesEfectivosLocal}-{golesEfectivosVisitante}
            </p>
          </div>
        </div>
      )}

      {/* Events timeline */}
      <div className="rounded-lg border p-4 mb-4">
        <h3 className="font-semibold mb-3">Eventos ({sorted.length})</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos cargados</p>
        ) : (
          <div className="space-y-1">
            {sorted.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-sm py-1 border-b last:border-b-0">
                <span className="font-mono text-muted-foreground w-8">{e.minuto}&apos;</span>
                <span>{TIPOS_LABELS[e.tipo] ?? e.tipo}</span>
                {e.equipo_externo_nombre && (
                  <span className="text-muted-foreground">({e.equipo_externo_nombre})</span>
                )}
                {e.descripcion && (
                  <span className="text-muted-foreground">— {e.descripcion}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats preview */}
      {statsMap.size > 0 && (
        <div className="rounded-lg border p-4 mb-6">
          <h3 className="font-semibold mb-3">Stats jugadores (local)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-1">Jugador</th>
                <th className="py-1 text-center w-10">G</th>
                <th className="py-1 text-center w-10">A</th>
                <th className="py-1 text-center w-10">TA</th>
                <th className="py-1 text-center w-10">TR</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(statsMap.entries()).map(([pid, s]) => (
                <tr key={pid} className="border-b last:border-b-0">
                  <td className="py-1">{s.nombre}</td>
                  <td className="py-1 text-center">{s.goles || ''}</td>
                  <td className="py-1 text-center">{s.asistencias || ''}</td>
                  <td className="py-1 text-center">{s.amarillas || ''}</td>
                  <td className="py-1 text-center">{s.rojas || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 mb-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {(success || confirmado) && (
        <div className="rounded-lg border border-green-500 bg-green-500/10 p-3 mb-4 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          Resultado confirmado exitosamente.
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onAnterior} disabled={confirmado}>
          Anterior
        </Button>
        {!confirmado && !success && (
          <Button
            onClick={handleConfirmar}
            disabled={isPending}
            data-testid="btn-confirmar-resultado"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Confirmar resultado
          </Button>
        )}
      </div>
    </div>
  )
}

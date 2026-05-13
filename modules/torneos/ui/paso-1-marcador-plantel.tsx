'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { JugadorPlantel } from '../lib/resultado-types'
import type { obtenerDatosPartidoAction } from '../lib/resultado-actions'

type DatosPartido = Awaited<ReturnType<typeof obtenerDatosPartidoAction>> & { ok: true }

export function Paso1MarcadorPlantel({
  datos,
  marcadorLocal,
  setMarcadorLocal,
  marcadorVisitante,
  setMarcadorVisitante,
  jugadores,
  setJugadores,
  onSiguiente,
  confirmado,
}: {
  datos: DatosPartido
  marcadorLocal: number
  setMarcadorLocal: (v: number) => void
  marcadorVisitante: number
  setMarcadorVisitante: (v: number) => void
  jugadores: JugadorPlantel[]
  setJugadores: (j: JugadorPlantel[]) => void
  onSiguiente: () => void
  confirmado: boolean
}) {
  const rivalNombre = datos.partido.rival_texto ?? 'Rival'

  function toggleJugo(personaId: string) {
    setJugadores(
      jugadores.map((j) =>
        j.persona_id === personaId ? { ...j, jugo: !j.jugo } : j
      )
    )
  }

  function setMinutos(personaId: string, min: number) {
    setJugadores(
      jugadores.map((j) =>
        j.persona_id === personaId ? { ...j, minutos: min } : j
      )
    )
  }

  return (
    <div data-testid="paso-1-marcador">
      {/* Marcador */}
      <div className="rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Marcador final</h2>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Local</p>
            <Input
              type="number"
              min={0}
              max={99}
              value={marcadorLocal}
              onChange={(e) => setMarcadorLocal(parseInt(e.target.value) || 0)}
              className="w-20 text-center text-2xl font-bold"
              data-testid="input-marcador-local"
              disabled={confirmado}
            />
          </div>
          <span className="text-2xl font-bold text-muted-foreground">—</span>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">{rivalNombre}</p>
            <Input
              type="number"
              min={0}
              max={99}
              value={marcadorVisitante}
              onChange={(e) => setMarcadorVisitante(parseInt(e.target.value) || 0)}
              className="w-20 text-center text-2xl font-bold"
              data-testid="input-marcador-visitante"
              disabled={confirmado}
            />
          </div>
        </div>
      </div>

      {/* Plantel */}
      {jugadores.length > 0 && (
        <div className="rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Plantel convocado</h2>
          <div className="space-y-2">
            {jugadores.map((j) => (
              <div
                key={j.persona_id}
                className="flex items-center gap-3 py-1"
                data-testid={`checkbox-jugador-${j.persona_id}`}
              >
                <Checkbox
                  checked={j.jugo}
                  onCheckedChange={() => toggleJugo(j.persona_id)}
                  disabled={confirmado}
                />
                <Label className="flex-1 text-sm cursor-pointer">
                  {j.dorsal !== null && (
                    <span className="font-mono text-muted-foreground mr-2">#{j.dorsal}</span>
                  )}
                  {j.apellido}, {j.nombre}
                </Label>
                {j.jugo && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={130}
                      value={j.minutos}
                      onChange={(e) =>
                        setMinutos(j.persona_id, parseInt(e.target.value) || 0)
                      }
                      className="w-16 text-center text-sm"
                      data-testid={`input-minutos-${j.persona_id}`}
                      disabled={confirmado}
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onSiguiente} data-testid="btn-siguiente-paso1">
          Siguiente
        </Button>
      </div>
    </div>
  )
}

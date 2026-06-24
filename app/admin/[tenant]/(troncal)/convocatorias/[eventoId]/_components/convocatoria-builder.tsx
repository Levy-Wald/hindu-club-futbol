'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { guardarConvocatoria } from '../../_actions'
import { resumenConvocatoria, resumenRespuestas, type EstadoConvocatoria } from '../../_lib/calculos'
import type { JugadorConvocatoria, RespuestaJugador } from '../../_lib/queries'

const OPCIONES: { value: EstadoConvocatoria; label: string }[] = [
  { value: null, label: 'No' },
  { value: 'convocado', label: 'Conv.' },
  { value: 'suplente', label: 'Supl.' },
  { value: 'titular', label: 'Titular' },
]

const RESPUESTA_META: Record<RespuestaJugador, { label: string; cls: string }> = {
  aceptado: { label: '✓ Confirmó', cls: 'text-green-700 bg-green-100' },
  rechazado: { label: '✗ No va', cls: 'text-red-700 bg-red-100' },
  tentativa: { label: '? Duda', cls: 'text-amber-700 bg-amber-100' },
  pendiente: { label: 'Sin responder', cls: 'text-muted-foreground bg-muted' },
}

export function ConvocatoriaBuilder({ eventoId, jugadores }: { eventoId: string; jugadores: JugadorConvocatoria[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [estados, setEstados] = useState<Record<string, EstadoConvocatoria>>(
    Object.fromEntries(jugadores.map((j) => [j.persona_id, j.estado])),
  )

  const resumen = resumenConvocatoria(jugadores.map((j) => ({ estado: estados[j.persona_id] ?? null })))
  const respuestas = resumenRespuestas(
    jugadores.map((j) => ({ estado: estados[j.persona_id] ?? null, respuesta: j.respuesta })),
  )

  function set(personaId: string, estado: EstadoConvocatoria) {
    setEstados((prev) => ({ ...prev, [personaId]: estado }))
  }

  function guardar() {
    startTransition(async () => {
      const r = await guardarConvocatoria(
        eventoId,
        jugadores.map((j) => ({ persona_id: j.persona_id, estado: estados[j.persona_id] ?? null })),
      )
      if (r.ok) {
        toast.success(r.message)
        router.refresh()
      } else {
        toast.error(r.message)
      }
    })
  }

  if (jugadores.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          El equipo de este partido no tiene plantel cargado.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumen citación */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium">Citados: {resumen.total}</span>
        <span className="text-muted-foreground">Titulares {resumen.titulares}</span>
        <span className="text-muted-foreground">Suplentes {resumen.suplentes}</span>
        <span className="text-muted-foreground">Convocados {resumen.convocados}</span>
      </div>

      {/* Resumen de respuestas de los jugadores */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-muted-foreground">Respuestas:</span>
        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ {respuestas.aceptados} confirmaron</span>
        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">✗ {respuestas.rechazados} no van</span>
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">? {respuestas.tentativa} en duda</span>
        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{respuestas.pendientes} sin responder</span>
      </div>

      {/* Plantel */}
      <div className="rounded-md border divide-y">
        {jugadores.map((j) => {
          const estado = estados[j.persona_id] ?? null
          return (
            <div key={j.persona_id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {j.dorsal != null && <span className="text-muted-foreground mr-1">#{j.dorsal}</span>}
                  {j.apellido}, {j.nombre}
                </p>
                <div className="flex items-center gap-2">
                  {j.posicion && <p className="text-xs text-muted-foreground">{j.posicion}</p>}
                  {estado != null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${RESPUESTA_META[j.respuesta].cls}`}
                      title={j.motivo_respuesta ?? undefined}>
                      {RESPUESTA_META[j.respuesta].label}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {OPCIONES.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => set(j.persona_id, o.value)}
                    className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                      estado === o.value ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={guardar} disabled={isPending}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? 'Guardando...' : 'Guardar convocatoria'}
        </Button>
      </div>
    </div>
  )
}

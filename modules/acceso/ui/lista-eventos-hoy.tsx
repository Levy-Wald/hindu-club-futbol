'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { EventoMinimal } from '../lib/types'
import { marcarPresenteEnEventoAction } from '../lib/actions'

type Props = {
  eventos: EventoMinimal[]
  personaId: string
  personaNombre: string
  accesoLogId: string
}

export function ListaEventosHoy({ eventos, personaId, personaNombre, accesoLogId }: Props) {
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)

  if (eventos.length === 0) return null

  const handleMarcar = async (eventoId: string, eventoTitulo: string) => {
    if (!confirm(`¿Marcar a ${personaNombre} como presente en "${eventoTitulo}"?`)) return

    setLoading(eventoId)
    const result = await marcarPresenteEnEventoAction({
      persona_id: personaId,
      evento_id: eventoId,
      acceso_log_id: accesoLogId,
    })
    setLoading(null)

    if (result.ok) {
      setMarcados(prev => new Set(prev).add(eventoId))
      toast.success('Asistencia marcada')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3" data-testid="lista-eventos-hoy">
      <h3 className="text-sm font-semibold text-neutral-700">Eventos de hoy</h3>
      {eventos.map((ev) => {
        const yaMarcado = marcados.has(ev.evento_id)
        return (
          <div key={ev.evento_id} className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900 truncate">{ev.titulo}</p>
              {ev.hora_inicio && (
                <p className="text-xs text-neutral-500">{ev.hora_inicio.slice(0, 5)}</p>
              )}
            </div>
            <button
              type="button"
              disabled={yaMarcado || loading === ev.evento_id}
              onClick={() => handleMarcar(ev.evento_id, ev.titulo)}
              data-testid={`btn-marcar-presente-${ev.evento_id}`}
              className={
                yaMarcado
                  ? 'text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium'
                  : 'text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50'
              }
            >
              {yaMarcado ? 'Marcado' : loading === ev.evento_id ? '...' : 'Marcar presente'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

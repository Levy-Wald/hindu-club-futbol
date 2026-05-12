'use client'

import { cn } from '@/lib/utils'
import type { EquipoInvitado, EstadoAsistencia } from '../lib/types'
import { ESTADOS_ASISTENCIA } from '../lib/types'

type Props = {
  equipo: EquipoInvitado
  onMarcar: (equipoId: string, estado: EstadoAsistencia) => void
  onExpandir: (equipoId: string) => void
  isMutating: boolean
}

export function FilaEquipo({ equipo, onMarcar, onExpandir, isMutating }: Props) {
  const estadoActual = equipo.asistencia.estado

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3"
      data-testid={`fila-equipo-${equipo.equipo_id}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-8 w-8 rounded-full bg-info-100 flex items-center justify-center shrink-0 text-xs font-medium text-info-700">
          {equipo.nombre?.[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-900 truncate">
            {equipo.nombre}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onExpandir(equipo.equipo_id)}
          className="text-xs text-brand-600 hover:text-brand-800 font-medium shrink-0"
          data-testid={`btn-expandir-${equipo.equipo_id}`}
        >
          Expandir plantel
        </button>
      </div>

      {equipo.marca_asistencia && (
        <div className="flex gap-1.5 overflow-x-auto">
          {ESTADOS_ASISTENCIA.map((est) => {
            const isActive = estadoActual === est.valor
            return (
              <button
                key={est.valor}
                data-testid={`btn-estado-equipo-${equipo.equipo_id}-${est.valor}`}
                disabled={isMutating}
                onClick={() => onMarcar(equipo.equipo_id, est.valor)}
                className={cn(
                  'flex-1 min-w-[48px] h-12 rounded-lg text-sm font-bold transition-all',
                  'border-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
                  isActive
                    ? `${est.color} border-transparent shadow-sm`
                    : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                )}
                title={est.label}
              >
                {est.shortLabel}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

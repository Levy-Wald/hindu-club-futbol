'use client'

import { cn } from '@/lib/utils'
import type { EntidadInvitada, EstadoAsistencia } from '../lib/types'
import { ESTADOS_ASISTENCIA } from '../lib/types'

type Props = {
  entidad: EntidadInvitada
  onMarcar: (entidadId: string, estado: EstadoAsistencia) => void
  isMutating: boolean
}

export function FilaEntidad({ entidad, onMarcar, isMutating }: Props) {
  const estadoActual = entidad.asistencia.estado

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3"
      data-testid={`fila-entidad-${entidad.entidad_id}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 text-xs font-medium text-brand-700">
          {entidad.nombre?.[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-900 truncate">
            {entidad.nombre}
          </p>
          <p className="text-xs text-neutral-500">{entidad.tipo}</p>
        </div>
      </div>

      {entidad.marca_asistencia && (
        <div className="flex gap-1.5 overflow-x-auto">
          {ESTADOS_ASISTENCIA.map((est) => {
            const isActive = estadoActual === est.valor
            return (
              <button
                key={est.valor}
                data-testid={`btn-estado-entidad-${entidad.entidad_id}-${est.valor}`}
                disabled={isMutating}
                onClick={() => onMarcar(entidad.entidad_id, est.valor)}
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

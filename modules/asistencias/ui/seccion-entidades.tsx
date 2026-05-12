'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { EntidadInvitada, EstadoAsistencia } from '../lib/types'
import { FilaEntidad } from './fila-entidad'

type Props = {
  entidades: EntidadInvitada[]
  onMarcar: (entidadId: string, estado: EstadoAsistencia) => void
  mutatingId: string | null
}

export function SeccionEntidades({ entidades, onMarcar, mutatingId }: Props) {
  const [open, setOpen] = useState(false)

  const conAsistencia = entidades.filter(e => e.marca_asistencia)
  const presentes = conAsistencia.filter(e => e.asistencia.estado === 'presente').length
  const total = entidades.length

  if (total === 0) return null

  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white overflow-hidden"
      data-testid="seccion-entidades"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
      >
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Entidades</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {presentes}/{conAsistencia.length} presentes · {total} invitadas
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-neutral-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-neutral-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-neutral-100 p-3 space-y-2">
          {entidades.map((entidad) => (
            <FilaEntidad
              key={entidad.entidad_id}
              entidad={entidad}
              onMarcar={onMarcar}
              isMutating={mutatingId === entidad.entidad_id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

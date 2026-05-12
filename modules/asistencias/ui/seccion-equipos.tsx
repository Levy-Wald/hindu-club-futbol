'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { EquipoInvitado, EstadoAsistencia } from '../lib/types'
import { FilaEquipo } from './fila-equipo'

type Props = {
  equipos: EquipoInvitado[]
  onMarcar: (equipoId: string, estado: EstadoAsistencia) => void
  onExpandir: (equipoId: string) => void
  mutatingId: string | null
}

export function SeccionEquipos({ equipos, onMarcar, onExpandir, mutatingId }: Props) {
  const [open, setOpen] = useState(false)

  const conAsistencia = equipos.filter(e => e.marca_asistencia)
  const presentes = conAsistencia.filter(e => e.asistencia.estado === 'presente').length
  const total = equipos.length

  if (total === 0) return null

  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white overflow-hidden"
      data-testid="seccion-equipos"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
      >
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Equipos</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {presentes}/{conAsistencia.length} presentes · {total} invitados
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
          {equipos.map((equipo) => (
            <FilaEquipo
              key={equipo.equipo_id}
              equipo={equipo}
              onMarcar={onMarcar}
              onExpandir={onExpandir}
              isMutating={mutatingId === equipo.equipo_id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { PersonaInvitada, EstadoAsistencia, CategoriaRolEquipo } from '../lib/types'
import { FilaPersona } from './fila-persona'

type Props = {
  titulo: string
  categoria: CategoriaRolEquipo
  invitados: PersonaInvitada[]
  defaultOpen?: boolean
  onMarcar: (personaId: string, estado: EstadoAsistencia) => void
  mutatingPersonaId: string | null
}

export function SeccionCategoria({
  titulo,
  categoria,
  invitados,
  defaultOpen = false,
  onMarcar,
  mutatingPersonaId,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  const presentes = invitados.filter(i => i.asistencia.estado === 'presente').length
  const total = invitados.length

  if (total === 0) return null

  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white overflow-hidden"
      data-testid={`seccion-${categoria}`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
      >
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{titulo}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {presentes}/{total} presentes
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
          {invitados.map((persona) => {
            const rolesEnCategoria = (persona.roles ?? []).filter(
              r => r.categoria === categoria
            )
            return (
              <FilaPersona
                key={persona.persona_id}
                persona={persona}
                rolesEnCategoria={rolesEnCategoria}
                onMarcar={onMarcar}
                isMutating={mutatingPersonaId === persona.persona_id}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

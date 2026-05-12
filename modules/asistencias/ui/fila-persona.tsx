'use client'

import { cn } from '@/lib/utils'
import type { PersonaInvitada, EstadoAsistencia, RolEnEquipo } from '../lib/types'
import { ESTADOS_ASISTENCIA } from '../lib/types'
import { LabelRol } from './label-rol'

type Props = {
  persona: PersonaInvitada
  rolesEnCategoria: RolEnEquipo[]
  onMarcar: (personaId: string, estado: EstadoAsistencia) => void
  isMutating: boolean
}

export function FilaPersona({ persona, rolesEnCategoria, onMarcar, isMutating }: Props) {
  const estadoActual = persona.asistencia.estado

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3"
      data-testid={`fila-persona-${persona.persona_id}`}
    >
      {/* Header: nombre + roles */}
      <div className="flex items-center gap-2 min-w-0">
        {persona.foto_url ? (
          <img
            src={persona.foto_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center shrink-0 text-xs font-medium text-neutral-600">
            {persona.apellido?.[0]}{persona.nombre?.[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-900 truncate">
            {persona.apellido}, {persona.nombre}
            {rolesEnCategoria.some(r => r.dorsal != null) && (
              <span className="ml-1 text-neutral-500">
                #{rolesEnCategoria.find(r => r.dorsal != null)?.dorsal}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {rolesEnCategoria.map((rol) => (
              <LabelRol key={rol.rol_equipo_slug} rol={rol} />
            ))}
          </div>
        </div>
      </div>

      {/* Botones de estado */}
      <div className="flex gap-1.5 overflow-x-auto">
        {ESTADOS_ASISTENCIA.map((est) => {
          const isActive = estadoActual === est.valor
          return (
            <button
              key={est.valor}
              data-testid={`btn-estado-${persona.persona_id}-${est.valor}`}
              disabled={isMutating}
              onClick={() => onMarcar(persona.persona_id, est.valor)}
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
    </div>
  )
}

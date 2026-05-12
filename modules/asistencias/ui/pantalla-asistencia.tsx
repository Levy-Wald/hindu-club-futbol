'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { obtenerInvitadosDeEvento } from '../lib/queries'
import { marcarAsistenciaAction } from '../lib/actions'
import { SeccionCategoria } from './seccion-categoria'
import { SumarioAsistencia } from './sumario-asistencia'
import type { InvitadosPorCategoria, EstadoAsistencia, PersonaInvitada } from '../lib/types'

type Props = {
  eventoId: string
  tenantId: string
  initialData: InvitadosPorCategoria
  eventoInfo: {
    titulo: string | null
    fecha: string | null
    tipo_evento_slug: string
    equipo_nombre: string | null
  }
}

function actualizarAsistenciaEnCache(
  old: InvitadosPorCategoria,
  personaId: string,
  estado: EstadoAsistencia
): InvitadosPorCategoria {
  const update = (personas: PersonaInvitada[]) =>
    personas.map(p =>
      p.persona_id === personaId
        ? {
            ...p,
            asistencia: {
              ...p.asistencia,
              estado,
              respondido_at: new Date().toISOString(),
              id: p.asistencia.id ?? 'optimistic',
            },
          }
        : p
    )

  return {
    deportivo: update(old.deportivo),
    cuerpo_tecnico: update(old.cuerpo_tecnico),
    comision_delegados: update(old.comision_delegados),
  }
}

export function PantallaAsistencia({ eventoId, tenantId, initialData, eventoInfo }: Props) {
  const queryClient = useQueryClient()
  const [mutatingPersonaId, setMutatingPersonaId] = useState<string | null>(null)

  const { data: invitados } = useQuery({
    queryKey: ['invitados', eventoId],
    queryFn: () => obtenerInvitadosDeEvento(eventoId, tenantId),
    initialData,
    staleTime: 30_000,
  })

  const mutation = useMutation({
    mutationFn: marcarAsistenciaAction,
    onMutate: async (vars) => {
      setMutatingPersonaId(vars.persona_id)
      await queryClient.cancelQueries({ queryKey: ['invitados', vars.evento_id] })
      const previo = queryClient.getQueryData<InvitadosPorCategoria>(['invitados', vars.evento_id])
      queryClient.setQueryData<InvitadosPorCategoria>(
        ['invitados', vars.evento_id],
        (old) => old ? actualizarAsistenciaEnCache(old, vars.persona_id, vars.estado) : old
      )
      return { previo }
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previo) {
        queryClient.setQueryData(['invitados', vars.evento_id], ctx.previo)
      }
      toast.error('Error guardando asistencia, reintentá')
    },
    onSettled: (_data, _err, vars) => {
      setMutatingPersonaId(null)
      queryClient.invalidateQueries({ queryKey: ['invitados', vars.evento_id] })
    },
  })

  const handleMarcar = (personaId: string, estado: EstadoAsistencia) => {
    mutation.mutate({ evento_id: eventoId, persona_id: personaId, estado })
  }

  const tipoLabel = eventoInfo.tipo_evento_slug === 'entrenamiento' ? 'Entrenamiento' : 'Partido'

  return (
    <div className="space-y-4 pb-20" data-testid="pantalla-asistencia">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">
          Asistencia
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {tipoLabel}
          {eventoInfo.titulo && ` — ${eventoInfo.titulo}`}
          {eventoInfo.equipo_nombre && ` · ${eventoInfo.equipo_nombre}`}
          {eventoInfo.fecha && ` · ${new Date(eventoInfo.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`}
        </p>
      </div>

      <SumarioAsistencia invitados={invitados} />

      <SeccionCategoria
        titulo="Plantel"
        categoria="deportivo"
        invitados={invitados.deportivo}
        defaultOpen
        onMarcar={handleMarcar}
        mutatingPersonaId={mutatingPersonaId}
      />
      <SeccionCategoria
        titulo="Cuerpo Técnico"
        categoria="cuerpo_tecnico"
        invitados={invitados.cuerpo_tecnico}
        onMarcar={handleMarcar}
        mutatingPersonaId={mutatingPersonaId}
      />
      <SeccionCategoria
        titulo="Comisión y Delegados"
        categoria="comision_delegados"
        invitados={invitados.comision_delegados}
        onMarcar={handleMarcar}
        mutatingPersonaId={mutatingPersonaId}
      />
    </div>
  )
}

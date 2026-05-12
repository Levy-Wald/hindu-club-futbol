'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { obtenerInvitadosCompletoDeEvento } from '../lib/queries'
import {
  marcarAsistenciaAction,
  marcarAsistenciaEntidadAction,
  marcarAsistenciaEquipoAction,
  expandirEquipoAction,
} from '../lib/actions'
import { SeccionCategoria } from './seccion-categoria'
import { SeccionEntidades } from './seccion-entidades'
import { SeccionEquipos } from './seccion-equipos'
import { SumarioAsistencia } from './sumario-asistencia'
import type { InvitadosCompleto, EstadoAsistencia, PersonaInvitada } from '../lib/types'

type Props = {
  eventoId: string
  tenantId: string
  initialData: InvitadosCompleto
  eventoInfo: {
    titulo: string | null
    fecha: string | null
    tipo_evento_slug: string
    equipo_nombre: string | null
  }
}

function actualizarAsistenciaEnCache(
  old: InvitadosCompleto,
  personaId: string,
  estado: EstadoAsistencia
): InvitadosCompleto {
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
    entidades: old.entidades,
    equipos: old.equipos,
  }
}

function actualizarAsistenciaEntidadEnCache(
  old: InvitadosCompleto,
  entidadId: string,
  estado: EstadoAsistencia
): InvitadosCompleto {
  return {
    ...old,
    entidades: old.entidades.map(e =>
      e.entidad_id === entidadId
        ? { ...e, asistencia: { ...e.asistencia, estado, respondido_at: new Date().toISOString(), id: e.asistencia.id ?? 'optimistic' } }
        : e
    ),
  }
}

function actualizarAsistenciaEquipoEnCache(
  old: InvitadosCompleto,
  equipoId: string,
  estado: EstadoAsistencia
): InvitadosCompleto {
  return {
    ...old,
    equipos: old.equipos.map(e =>
      e.equipo_id === equipoId
        ? { ...e, asistencia: { ...e.asistencia, estado, respondido_at: new Date().toISOString(), id: e.asistencia.id ?? 'optimistic' } }
        : e
    ),
  }
}

export function PantallaAsistencia({ eventoId, tenantId, initialData, eventoInfo }: Props) {
  const queryClient = useQueryClient()
  const [mutatingPersonaId, setMutatingPersonaId] = useState<string | null>(null)
  const [mutatingEntidadId, setMutatingEntidadId] = useState<string | null>(null)
  const [mutatingEquipoId, setMutatingEquipoId] = useState<string | null>(null)

  const queryKey = ['invitados', eventoId]

  const { data: invitados } = useQuery({
    queryKey,
    queryFn: () => obtenerInvitadosCompletoDeEvento(eventoId, tenantId),
    initialData,
    staleTime: 30_000,
  })

  // Mutation: persona
  const mutationPersona = useMutation({
    mutationFn: marcarAsistenciaAction,
    onMutate: async (vars) => {
      setMutatingPersonaId(vars.persona_id)
      await queryClient.cancelQueries({ queryKey })
      const previo = queryClient.getQueryData<InvitadosCompleto>(queryKey)
      queryClient.setQueryData<InvitadosCompleto>(
        queryKey,
        (old) => old ? actualizarAsistenciaEnCache(old, vars.persona_id, vars.estado) : old
      )
      return { previo }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previo) queryClient.setQueryData(queryKey, ctx.previo)
      toast.error('Error guardando asistencia, reintentá')
    },
    onSettled: () => {
      setMutatingPersonaId(null)
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Mutation: entidad
  const mutationEntidad = useMutation({
    mutationFn: marcarAsistenciaEntidadAction,
    onMutate: async (vars) => {
      setMutatingEntidadId(vars.entidad_id)
      await queryClient.cancelQueries({ queryKey })
      const previo = queryClient.getQueryData<InvitadosCompleto>(queryKey)
      queryClient.setQueryData<InvitadosCompleto>(
        queryKey,
        (old) => old ? actualizarAsistenciaEntidadEnCache(old, vars.entidad_id, vars.estado) : old
      )
      return { previo }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previo) queryClient.setQueryData(queryKey, ctx.previo)
      toast.error('Error guardando asistencia de entidad')
    },
    onSettled: () => {
      setMutatingEntidadId(null)
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Mutation: equipo
  const mutationEquipo = useMutation({
    mutationFn: marcarAsistenciaEquipoAction,
    onMutate: async (vars) => {
      setMutatingEquipoId(vars.equipo_id)
      await queryClient.cancelQueries({ queryKey })
      const previo = queryClient.getQueryData<InvitadosCompleto>(queryKey)
      queryClient.setQueryData<InvitadosCompleto>(
        queryKey,
        (old) => old ? actualizarAsistenciaEquipoEnCache(old, vars.equipo_id, vars.estado) : old
      )
      return { previo }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previo) queryClient.setQueryData(queryKey, ctx.previo)
      toast.error('Error guardando asistencia de equipo')
    },
    onSettled: () => {
      setMutatingEquipoId(null)
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Mutation: expandir equipo
  const mutationExpandir = useMutation({
    mutationFn: expandirEquipoAction,
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`${result.data.insertados} personas agregadas al evento`)
        queryClient.invalidateQueries({ queryKey })
      } else {
        toast.error(result.error)
      }
    },
    onError: () => toast.error('Error expandiendo equipo'),
  })

  const handleMarcarPersona = (personaId: string, estado: EstadoAsistencia) => {
    mutationPersona.mutate({ evento_id: eventoId, persona_id: personaId, estado })
  }

  const handleMarcarEntidad = (entidadId: string, estado: EstadoAsistencia) => {
    mutationEntidad.mutate({ evento_id: eventoId, entidad_id: entidadId, estado })
  }

  const handleMarcarEquipo = (equipoId: string, estado: EstadoAsistencia) => {
    mutationEquipo.mutate({ evento_id: eventoId, equipo_id: equipoId, estado })
  }

  const handleExpandirEquipo = (equipoId: string) => {
    mutationExpandir.mutate({ evento_id: eventoId, equipo_id: equipoId })
  }

  const tipoLabel = eventoInfo.tipo_evento_slug === 'entrenamiento' ? 'Entrenamiento' : 'Partido'

  return (
    <div className="space-y-4 pb-20" data-testid="pantalla-asistencia">
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
        onMarcar={handleMarcarPersona}
        mutatingPersonaId={mutatingPersonaId}
      />
      <SeccionCategoria
        titulo="Cuerpo Técnico"
        categoria="cuerpo_tecnico"
        invitados={invitados.cuerpo_tecnico}
        onMarcar={handleMarcarPersona}
        mutatingPersonaId={mutatingPersonaId}
      />
      <SeccionCategoria
        titulo="Comisión y Delegados"
        categoria="comision_delegados"
        invitados={invitados.comision_delegados}
        onMarcar={handleMarcarPersona}
        mutatingPersonaId={mutatingPersonaId}
      />

      <SeccionEntidades
        entidades={invitados.entidades}
        onMarcar={handleMarcarEntidad}
        mutatingId={mutatingEntidadId}
      />

      <SeccionEquipos
        equipos={invitados.equipos}
        onMarcar={handleMarcarEquipo}
        onExpandir={handleExpandirEquipo}
        mutatingId={mutatingEquipoId}
      />
    </div>
  )
}

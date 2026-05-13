'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SelectorFormacion } from './selector-formacion'
import { CanchaVisual } from './cancha-visual'
import { PanelPlantel } from './panel-plantel'
import { ModalAsignarJugador } from './modal-asignar-jugador'
import { getFormacionPorSlug, FORMACIONES } from '../lib/formaciones'
import {
  crearOActualizarEsquemaAction,
  asignarJugadorASlotAction,
  quitarJugadorDeSlotAction,
} from '../lib/actions'
import type { EsquemaCompleto, JugadorPlantel, SlotConJugador } from '../lib/types'

export function EditorTactico({
  eventoId,
  esquemaInicial,
  plantel,
  puedeEditar,
}: {
  eventoId: string
  esquemaInicial: EsquemaCompleto | null
  plantel: JugadorPlantel[]
  puedeEditar: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [formacionSlug, setFormacionSlug] = useState(
    esquemaInicial?.esquema.formacion ?? FORMACIONES[0].slug
  )
  const [esquemaId, setEsquemaId] = useState(esquemaInicial?.esquema.id ?? null)
  const [posiciones, setPosiciones] = useState(esquemaInicial?.posiciones ?? [])
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotConJugador | null>(null)

  const formacion = getFormacionPorSlug(formacionSlug)

  // Build slots with assigned players
  const slots: SlotConJugador[] = useMemo(() => {
    if (!formacion) return []
    return formacion.slots.map((slot) => {
      const pos = posiciones.find((p) => p.posicion === slot.slug)
      const jugador = pos
        ? plantel.find((j) => j.persona_id === pos.persona_id) ?? null
        : null
      return {
        ...slot,
        jugador: jugador
          ? {
              ...jugador,
              nombre: pos?.persona_nombre ?? jugador.nombre,
              apellido: pos?.persona_apellido ?? jugador.apellido,
            }
          : null,
        posicion_id: pos?.id ?? null,
      }
    })
  }, [formacion, posiciones, plantel])

  const asignadosIds = useMemo(
    () => new Set(posiciones.map((p) => p.persona_id)),
    [posiciones]
  )

  async function handleFormacionChange(slug: string) {
    setFormacionSlug(slug)

    // Create/update esquema with new formacion
    startTransition(async () => {
      const result = await crearOActualizarEsquemaAction({
        evento_id: eventoId,
        formacion: slug,
      })
      if (result.ok) {
        setEsquemaId(result.esquema_id)
        // Clear positions when changing formation
        setPosiciones([])
        router.refresh()
      }
    })
  }

  async function handleAsignar(persona_id: string) {
    if (!esquemaId || !slotSeleccionado) return

    setSlotSeleccionado(null)
    startTransition(async () => {
      const result = await asignarJugadorASlotAction({
        esquema_id: esquemaId,
        posicion_slug: slotSeleccionado.slug,
        persona_id,
        evento_id: eventoId,
      })
      if (result.ok) {
        router.refresh()
        // Optimistic: update local posiciones
        const jugador = plantel.find((j) => j.persona_id === persona_id)
        setPosiciones((prev) => {
          const filtered = prev.filter(
            (p) => p.persona_id !== persona_id && p.posicion !== slotSeleccionado.slug
          )
          return [
            ...filtered,
            {
              id: crypto.randomUUID(),
              posicion: slotSeleccionado.slug,
              persona_id,
              persona_nombre: jugador?.nombre ?? '',
              persona_apellido: jugador?.apellido ?? '',
              es_titular: true,
              orden: null,
            },
          ]
        })
      }
    })
  }

  async function handleQuitar() {
    if (!esquemaId || !slotSeleccionado) return

    setSlotSeleccionado(null)
    startTransition(async () => {
      const result = await quitarJugadorDeSlotAction({
        esquema_id: esquemaId,
        posicion_slug: slotSeleccionado.slug,
        evento_id: eventoId,
      })
      if (result.ok) {
        router.refresh()
        setPosiciones((prev) =>
          prev.filter((p) => p.posicion !== slotSeleccionado.slug)
        )
      }
    })
  }

  function handleSlotClick(slot: SlotConJugador) {
    if (!puedeEditar) return
    if (!esquemaId) {
      // Auto-create esquema first
      startTransition(async () => {
        const result = await crearOActualizarEsquemaAction({
          evento_id: eventoId,
          formacion: formacionSlug,
        })
        if (result.ok) {
          setEsquemaId(result.esquema_id)
          setSlotSeleccionado(slot)
        }
      })
      return
    }
    setSlotSeleccionado(slot)
  }

  function handleJugadorClickFromPanel(jugador: JugadorPlantel) {
    // Find first empty slot to suggest
    const emptySlot = slots.find((s) => !s.jugador)
    if (emptySlot) {
      setSlotSeleccionado(emptySlot)
    }
  }

  return (
    <div className="space-y-4">
      {/* Formation selector */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <SelectorFormacion
          value={formacionSlug}
          onChange={handleFormacionChange}
          disabled={!puedeEditar || isPending}
        />
        {isPending && (
          <span className="text-xs text-muted-foreground animate-pulse">Guardando...</span>
        )}
      </div>

      {/* Main layout: cancha + panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <CanchaVisual
          slots={slots}
          onSlotClick={handleSlotClick}
          puedeEditar={puedeEditar}
        />

        <PanelPlantel
          plantel={plantel}
          asignadosIds={asignadosIds}
          onJugadorClick={handleJugadorClickFromPanel}
          puedeEditar={puedeEditar}
        />
      </div>

      {/* Description */}
      {formacion && (
        <p className="text-xs text-muted-foreground">{formacion.descripcion}</p>
      )}

      {/* Modal */}
      <ModalAsignarJugador
        slot={slotSeleccionado}
        plantel={plantel}
        asignadosIds={asignadosIds}
        onAsignar={handleAsignar}
        onQuitar={handleQuitar}
        onClose={() => setSlotSeleccionado(null)}
      />
    </div>
  )
}

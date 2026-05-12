'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { BloqueCard } from './bloque-card'
import { ModalAgregarBloque } from './modal-agregar-bloque'
import {
  agregarBloqueAction,
  eliminarBloqueAction,
  reordenarBloquesAction,
} from '../lib/actions'
import type { Bloque, Ejercicio, Intensidad } from '../lib/types'

export function ListaBloques({
  bloques: initial,
  planId,
  eventoId,
  puedeEditar,
  ejercicios,
}: {
  bloques: Bloque[]
  planId: string | undefined
  eventoId: string
  puedeEditar: boolean
  ejercicios: Ejercicio[]
}) {
  const [bloques, setBloques] = useState(initial)
  const [showModal, setShowModal] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !planId) return

    const oldIndex = bloques.findIndex(b => b.id === active.id)
    const newIndex = bloques.findIndex(b => b.id === over.id)
    const reordenados = arrayMove(bloques, oldIndex, newIndex)
      .map((b, i) => ({ ...b, orden: i + 1 }))

    setBloques(reordenados)

    await reordenarBloquesAction({
      plan_id: planId,
      evento_id: eventoId,
      orden: reordenados.map(b => ({ id: b.id, orden: b.orden })),
    })
  }, [bloques, planId, eventoId])

  const handleAgregar = useCallback(async (data: {
    ejercicio_id: string | null
    nombre_personalizado: string | null
    duracion_min: number | null
    repeticiones: number | null
    series: number | null
    intensidad_override: Intensidad | null
    notas_bloque: string | null
  }) => {
    if (!planId) return
    setShowModal(false)

    const result = await agregarBloqueAction({
      plan_id: planId,
      evento_id: eventoId,
      ...data,
    })

    if (result.ok) {
      const nuevoBloque: Bloque = {
        id: result.bloque_id,
        tenant_id: '',
        plan_id: planId,
        orden: bloques.length + 1,
        ejercicio_id: data.ejercicio_id,
        ejercicio: data.ejercicio_id
          ? ejercicios.find(e => e.id === data.ejercicio_id) ?? null
          : null,
        nombre_personalizado: data.nombre_personalizado,
        duracion_min: data.duracion_min,
        repeticiones: data.repeticiones,
        series: data.series,
        intensidad_override: data.intensidad_override,
        notas_bloque: data.notas_bloque,
      }
      setBloques(prev => [...prev, nuevoBloque])
    }
  }, [planId, eventoId, bloques.length, ejercicios])

  const handleEliminar = useCallback(async (bloqueId: string) => {
    if (!planId) return
    const result = await eliminarBloqueAction({
      bloque_id: bloqueId,
      evento_id: eventoId,
      plan_id: planId,
    })
    if (result.ok) {
      setBloques(prev =>
        prev.filter(b => b.id !== bloqueId).map((b, i) => ({ ...b, orden: i + 1 }))
      )
    }
  }, [planId, eventoId])

  if (!planId) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        Creá el plan primero para agregar bloques.
      </div>
    )
  }

  return (
    <div data-testid="lista-bloques">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={bloques.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {bloques.map(b => (
            <BloqueCard
              key={b.id}
              bloque={b}
              puedeEditar={puedeEditar}
              onEditar={() => {/* TODO: modal editar */}}
              onEliminar={() => handleEliminar(b.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {bloques.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-8 border rounded-lg">
          No hay bloques en este plan. Agregá el primero.
        </div>
      )}

      {puedeEditar && (
        <button
          onClick={() => setShowModal(true)}
          className="mt-3 flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-accent w-full justify-center"
          data-testid="btn-agregar-bloque"
        >
          <Plus className="h-4 w-4" />
          Agregar bloque
        </button>
      )}

      {showModal && (
        <ModalAgregarBloque
          ejercicios={ejercicios}
          onConfirm={handleAgregar}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TareaCard } from './tarea-card'
import { TareaModal } from './tarea-modal'
import { actualizarEstadoTarea } from '../lib/actions'
import type { TareaConRelaciones, EstadoTareaCatalogo, EstadoTarea } from '../lib/tipos'

interface Props {
  proyectoId: string
  tareas: TareaConRelaciones[]
  estados: EstadoTareaCatalogo[]
  miembros?: { id: string; nombre: string; apellido: string }[]
}

function KanbanColumn({
  estado,
  tareas,
  onClickTarea,
  onAddTarea,
}: {
  estado: EstadoTareaCatalogo
  tareas: TareaConRelaciones[]
  onClickTarea: (t: TareaConRelaciones) => void
  onAddTarea: (estadoSlug: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado.slug })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[260px] w-[260px] rounded-lg border bg-muted/30 ${isOver ? 'ring-2 ring-primary/50' : ''}`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: estado.color ?? '#94A3B8' }} />
          <span className="text-sm font-medium">{estado.nombre}</span>
          <span className="text-xs text-muted-foreground">({tareas.length})</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddTarea(estado.slug)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[100px] overflow-y-auto max-h-[calc(100vh-280px)]">
        <SortableContext items={tareas.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tareas.map(t => (
            <TareaCard key={t.id} tarea={t} onClick={() => onClickTarea(t)} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export function KanbanBoard({ proyectoId, tareas: initialTareas, estados, miembros = [] }: Props) {
  const [tareas, setTareas] = useState(initialTareas)
  const [activeTarea, setActiveTarea] = useState<TareaConRelaciones | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTarea, setEditingTarea] = useState<TareaConRelaciones | null>(null)
  const [defaultEstado, setDefaultEstado] = useState<string>('backlog')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const tareasPorEstado = new Map<string, TareaConRelaciones[]>()
  for (const e of estados) {
    tareasPorEstado.set(e.slug, [])
  }
  for (const t of tareas) {
    const list = tareasPorEstado.get(t.estado_slug)
    if (list) list.push(t)
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const tarea = tareas.find(t => t.id === event.active.id)
    setActiveTarea(tarea ?? null)
  }, [tareas])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTarea(null)
    const { active, over } = event
    if (!over) return

    const tareaId = active.id as string
    const tarea = tareas.find(t => t.id === tareaId)
    if (!tarea) return

    // Determine target column
    let targetEstado: string | null = null

    // Check if dropped on a column
    const esEstado = estados.find(e => e.slug === over.id)
    if (esEstado) {
      targetEstado = esEstado.slug
    } else {
      // Dropped on another card — find its column
      const targetTarea = tareas.find(t => t.id === over.id)
      if (targetTarea) {
        targetEstado = targetTarea.estado_slug
      }
    }

    if (!targetEstado || targetEstado === tarea.estado_slug) return

    // Optimistic update
    setTareas(prev => prev.map(t =>
      t.id === tareaId ? { ...t, estado_slug: targetEstado as EstadoTarea } : t
    ))

    const res = await actualizarEstadoTarea(tareaId, proyectoId, targetEstado as EstadoTarea)
    if (!res.ok) {
      // Rollback
      setTareas(prev => prev.map(t =>
        t.id === tareaId ? { ...t, estado_slug: tarea.estado_slug } : t
      ))
      toast.error(res.message)
    }
  }, [tareas, estados, proyectoId])

  function handleClickTarea(t: TareaConRelaciones) {
    setEditingTarea(t)
    setModalOpen(true)
  }

  function handleAddTarea(estadoSlug: string) {
    setEditingTarea(null)
    setDefaultEstado(estadoSlug)
    setModalOpen(true)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {estados.map(estado => (
            <KanbanColumn
              key={estado.slug}
              estado={estado}
              tareas={tareasPorEstado.get(estado.slug) ?? []}
              onClickTarea={handleClickTarea}
              onAddTarea={handleAddTarea}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTarea && <TareaCard tarea={activeTarea} />}
        </DragOverlay>
      </DndContext>

      <TareaModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingTarea(null)
        }}
        proyectoId={proyectoId}
        tarea={editingTarea}
        estados={estados}
        miembros={miembros}
      />
    </>
  )
}

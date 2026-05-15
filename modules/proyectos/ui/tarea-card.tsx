'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Calendar, Clock, User } from 'lucide-react'
import type { TareaConRelaciones } from '../lib/tipos'
import { PRIORIDAD_LABELS, PRIORIDAD_COLORS } from '../lib/tipos'

interface Props {
  tarea: TareaConRelaciones
  onClick?: () => void
}

export function TareaCard({ tarea, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarea.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{tarea.titulo}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <Badge
              variant="outline"
              className="text-[10px] h-5"
              style={{ borderColor: PRIORIDAD_COLORS[tarea.prioridad], color: PRIORIDAD_COLORS[tarea.prioridad] }}
            >
              {PRIORIDAD_LABELS[tarea.prioridad]}
            </Badge>
            {tarea.fecha_limite && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(tarea.fecha_limite).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
              </span>
            )}
            {tarea.tiempo_estimado_horas && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {tarea.tiempo_estimado_horas}h
              </span>
            )}
          </div>
          {tarea.asignado && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
              <User className="h-3 w-3" />
              {tarea.asignado.apellido}, {tarea.asignado.nombre}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

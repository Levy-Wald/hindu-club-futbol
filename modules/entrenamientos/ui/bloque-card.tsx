'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { Bloque } from '../lib/types'

const CATEGORIA_COLORS: Record<string, string> = {
  calentamiento: 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400',
  tecnica: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
  fisico: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
  tactico: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400',
  mental: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
  enfriamiento: 'bg-cyan-100 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400',
}

export function BloqueCard({
  bloque,
  puedeEditar,
  onEditar,
  onEliminar,
}: {
  bloque: Bloque
  puedeEditar: boolean
  onEditar: () => void
  onEliminar: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bloque.id, disabled: !puedeEditar })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const nombre = bloque.ejercicio?.nombre ?? bloque.nombre_personalizado ?? '(sin nombre)'
  const categoria = bloque.ejercicio?.categoria
  const duracion = bloque.duracion_min ?? bloque.ejercicio?.duracion_min_sugerida
  const intensidad = bloque.intensidad_override ?? bloque.ejercicio?.intensidad

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border rounded-lg p-3 mb-2 bg-background"
      data-testid={`bloque-card-${bloque.id}`}
    >
      {puedeEditar && (
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground w-5">{bloque.orden}.</span>
          <span className="font-medium text-sm truncate">{nombre}</span>
          {categoria && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORIA_COLORS[categoria] ?? 'bg-gray-100 text-gray-600'}`}>
              {categoria}
            </span>
          )}
          {!bloque.ejercicio_id && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">libre</span>
          )}
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
          {duracion && <span>{duracion} min</span>}
          {bloque.repeticiones && <span>{bloque.repeticiones} reps</span>}
          {bloque.series && <span>{bloque.series} series</span>}
          {intensidad && <span className="capitalize">{intensidad.replace('_', ' ')}</span>}
        </div>
        {bloque.notas_bloque && (
          <p className="text-xs text-muted-foreground italic mt-1 truncate">{bloque.notas_bloque}</p>
        )}
      </div>

      {puedeEditar && (
        <div className="flex gap-1">
          <button
            onClick={onEditar}
            className="p-1.5 hover:bg-accent rounded"
            data-testid={`btn-editar-bloque-${bloque.id}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onEliminar}
            className="p-1.5 hover:bg-destructive/10 text-destructive rounded"
            data-testid={`btn-eliminar-bloque-${bloque.id}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

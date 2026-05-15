'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, GripVertical, Trash2, Loader2 } from 'lucide-react'
import {
  crearPaso,
  actualizarPaso,
  reordenarPasos,
  eliminarPaso,
} from '@/modules/comunicaciones/lib/actions'

interface Paso {
  id: string
  tipo_paso: string
  config_json: Record<string, unknown>
  orden: number
}

interface WorkflowEditorProps {
  automatizacionId: string
  pasos: Paso[]
  plantillas: Array<{ slug: string; nombre: string }>
}

const PASO_TIPOS = [
  { value: 'enviar_plantilla', label: 'Enviar plantilla' },
  { value: 'esperar', label: 'Esperar (delay)' },
  { value: 'condicion', label: 'Condicion' },
]

function SortableStepCard({
  paso,
  plantillas,
  onUpdate,
  onDelete,
  isPending,
}: {
  paso: Paso
  plantillas: Array<{ slug: string; nombre: string }>
  onUpdate: (id: string, config: Record<string, unknown>) => void
  onDelete: (id: string) => void
  isPending: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: paso.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="border-l-4 border-l-brand-500">
        <CardContent className="flex items-start gap-3 py-3">
          <button
            type="button"
            className="mt-1 cursor-grab text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Paso {paso.orden}
              </span>
              <span className="text-xs">
                {PASO_TIPOS.find(t => t.value === paso.tipo_paso)?.label ?? paso.tipo_paso}
              </span>
            </div>

            {paso.tipo_paso === 'enviar_plantilla' && (
              <div className="space-y-1">
                <Label className="text-[11px]">Plantilla</Label>
                <Select
                  value={(paso.config_json?.plantilla_slug as string) ?? ''}
                  onValueChange={(v) =>
                    onUpdate(paso.id, { ...paso.config_json, plantilla_slug: v })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plantillas.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {paso.tipo_paso === 'esperar' && (
              <div className="space-y-1">
                <Label className="text-[11px]">Minutos de espera</Label>
                <Input
                  type="number"
                  className="h-8 text-xs w-32"
                  value={(paso.config_json?.minutos as number) ?? 0}
                  onChange={(e) =>
                    onUpdate(paso.id, { ...paso.config_json, minutos: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            )}

            {paso.tipo_paso === 'condicion' && (
              <div className="space-y-1">
                <Label className="text-[11px]">Expresion</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="ej: persona.email != null"
                  value={(paso.config_json?.expresion as string) ?? ''}
                  onChange={(e) =>
                    onUpdate(paso.id, { ...paso.config_json, expresion: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive mt-1"
            onClick={() => onDelete(paso.id)}
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function WorkflowEditor({ automatizacionId, pasos: initialPasos, plantillas }: WorkflowEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pasos, setPasos] = useState(initialPasos)
  const [nuevoTipo, setNuevoTipo] = useState('enviar_plantilla')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = pasos.findIndex((p) => p.id === active.id)
    const newIndex = pasos.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(pasos, oldIndex, newIndex).map((p, i) => ({
      ...p,
      orden: i + 1,
    }))

    setPasos(reordered)

    startTransition(async () => {
      const result = await reordenarPasos(
        automatizacionId,
        reordered.map((p) => p.id)
      )
      if (!result.ok) {
        toast.error(result.message)
        setPasos(initialPasos)
      }
    })
  }

  function handleAddPaso() {
    startTransition(async () => {
      const result = await crearPaso({
        automatizacion_id: automatizacionId,
        tipo_paso: nuevoTipo,
        config_json: {},
        orden: pasos.length + 1,
      })
      if (result.ok) {
        toast.success('Paso agregado')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleUpdatePaso(id: string, config: Record<string, unknown>) {
    setPasos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, config_json: config } : p))
    )
    startTransition(async () => {
      const result = await actualizarPaso(id, { config_json: config })
      if (!result.ok) toast.error(result.message)
    })
  }

  function handleDeletePaso(id: string) {
    startTransition(async () => {
      const result = await eliminarPaso(id)
      if (result.ok) {
        toast.success('Paso eliminado')
        setPasos((prev) => prev.filter((p) => p.id !== id))
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pasos del workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pasos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No hay pasos configurados. Agrega uno para empezar.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pasos.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {pasos.map((paso) => (
                  <SortableStepCard
                    key={paso.id}
                    paso={paso}
                    plantillas={plantillas}
                    onUpdate={handleUpdatePaso}
                    onDelete={handleDeletePaso}
                    isPending={isPending}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <Select value={nuevoTipo} onValueChange={(v) => setNuevoTipo(v ?? 'enviar_plantilla')}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PASO_TIPOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleAddPaso} disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Agregar paso
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

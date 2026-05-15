'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import { crearTarea, actualizarTarea, softDeleteTarea } from '../lib/actions'
import type { TareaConRelaciones, EstadoTarea, Prioridad, EstadoTareaCatalogo } from '../lib/tipos'
import { PRIORIDAD_LABELS } from '../lib/tipos'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyectoId: string
  tarea?: TareaConRelaciones | null
  estados: EstadoTareaCatalogo[]
  miembros?: { id: string; nombre: string; apellido: string }[]
}

export function TareaModal({ open, onOpenChange, proyectoId, tarea, estados, miembros = [] }: Props) {
  const [saving, setSaving] = useState(false)
  const isEdit = !!tarea

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const fd = new FormData(e.currentTarget)
    const input = {
      titulo: fd.get('titulo') as string,
      descripcion: (fd.get('descripcion') as string) || undefined,
      estado_slug: (fd.get('estado_slug') as EstadoTarea) || undefined,
      asignado_persona_id: (fd.get('asignado_persona_id') as string) || undefined,
      prioridad: (fd.get('prioridad') as Prioridad) || undefined,
      fecha_limite: (fd.get('fecha_limite') as string) || undefined,
      tiempo_estimado_horas: fd.get('tiempo_estimado_horas') ? Number(fd.get('tiempo_estimado_horas')) : undefined,
      tiempo_real_horas: fd.get('tiempo_real_horas') ? Number(fd.get('tiempo_real_horas')) : undefined,
    }

    const res = isEdit
      ? await actualizarTarea(tarea.id, proyectoId, input)
      : await crearTarea({ proyecto_id: proyectoId, ...input })

    setSaving(false)

    if (res.ok) {
      toast.success(res.message)
      onOpenChange(false)
    } else {
      toast.error(res.message)
    }
  }

  async function handleDelete() {
    if (!tarea || !confirm('¿Eliminar esta tarea?')) return
    const res = await softDeleteTarea(tarea.id, proyectoId)
    if (res.ok) {
      toast.success(res.message)
      onOpenChange(false)
    } else {
      toast.error(res.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" name="titulo" required defaultValue={tarea?.titulo ?? ''} />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" name="descripcion" rows={3} defaultValue={tarea?.descripcion ?? ''} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estado_slug">Estado</Label>
              <Select name="estado_slug" defaultValue={tarea?.estado_slug ?? 'backlog'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {estados.map(e => (
                    <SelectItem key={e.slug} value={e.slug}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select name="prioridad" defaultValue={tarea?.prioridad ?? 'media'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORIDAD_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asignado_persona_id">Asignado</Label>
              <Select name="asignado_persona_id" defaultValue={tarea?.asignado_persona_id ?? ''}>
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {miembros.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.apellido}, {m.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fecha_limite">Fecha límite</Label>
              <Input id="fecha_limite" name="fecha_limite" type="date" defaultValue={tarea?.fecha_limite ?? ''} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tiempo_estimado_horas">Horas estimadas</Label>
              <Input id="tiempo_estimado_horas" name="tiempo_estimado_horas" type="number" step="0.5" defaultValue={tarea?.tiempo_estimado_horas ?? ''} />
            </div>
            {isEdit && (
              <div>
                <Label htmlFor="tiempo_real_horas">Horas reales</Label>
                <Input id="tiempo_real_horas" name="tiempo_real_horas" type="number" step="0.5" defaultValue={tarea?.tiempo_real_horas ?? ''} />
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            {isEdit && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" /> Eliminar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

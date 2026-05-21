'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { crearProyecto, actualizarProyecto } from '../lib/actions'
import type { ProyectoConRelaciones, EstadoProyecto } from '../lib/tipos'
import { ESTADO_PROYECTO_LABELS } from '../lib/tipos'

interface Props {
  proyecto?: ProyectoConRelaciones
  personas?: { id: string; nombre: string; apellido: string }[]
  entidades?: { id: string; nombre: string }[]
}

export function ProyectoForm({ proyecto, personas = [], entidades = [] }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const isEdit = !!proyecto

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const fd = new FormData(e.currentTarget)
    const input = {
      nombre: fd.get('nombre') as string,
      descripcion: (fd.get('descripcion') as string) || undefined,
      codigo: (fd.get('codigo') as string) || undefined,
      responsable_persona_id: (fd.get('responsable_persona_id') as string) || undefined,
      cliente_persona_id: (fd.get('cliente_persona_id') as string) || undefined,
      cliente_entidad_id: (fd.get('cliente_entidad_id') as string) || undefined,
      fecha_inicio: (fd.get('fecha_inicio') as string) || undefined,
      fecha_fin_estimada: (fd.get('fecha_fin_estimada') as string) || undefined,
      estado: (fd.get('estado') as EstadoProyecto) || undefined,
      presupuesto_total: fd.get('presupuesto_total') ? Number(fd.get('presupuesto_total')) : undefined,
      moneda: (fd.get('moneda') as string) || undefined,
      color: (fd.get('color') as string) || undefined,
    }

    // Mutex: only one client type
    if (input.cliente_persona_id && input.cliente_entidad_id) {
      toast.error('Seleccione persona O entidad como cliente, no ambos')
      setSaving(false)
      return
    }

    const res = isEdit
      ? await actualizarProyecto(proyecto.id, input)
      : await crearProyecto(input)

    setSaving(false)

    if (res.ok) {
      toast.success(res.message)
      if (!isEdit && res.id) {
        router.push(`/admin/proyectos/${res.id}`)
      }
    } else {
      toast.error(res.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">
          {isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}
        </h1>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar cambios' : 'Crear proyecto'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" name="nombre" required defaultValue={proyecto?.nombre ?? ''} />
        </div>

        <div>
          <Label htmlFor="codigo">Código</Label>
          <Input id="codigo" name="codigo" placeholder="PRJ-001" defaultValue={proyecto?.codigo ?? ''} />
        </div>

        <div>
          <Label htmlFor="estado">Estado</Label>
          <Select name="estado" defaultValue={proyecto?.estado ?? 'planificado'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ESTADO_PROYECTO_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" name="descripcion" rows={3} defaultValue={proyecto?.descripcion ?? ''} />
        </div>

        <div>
          <Label htmlFor="responsable_persona_id">Responsable</Label>
          <Select name="responsable_persona_id" defaultValue={proyecto?.responsable_persona_id ?? ''}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin responsable</SelectItem>
              {personas.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.apellido}, {p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="color">Color</Label>
          <Input id="color" name="color" type="color" defaultValue={proyecto?.color ?? '#475569'} className="h-10 w-20" />
        </div>

        <div>
          <Label htmlFor="fecha_inicio">Fecha inicio</Label>
          <Input id="fecha_inicio" name="fecha_inicio" type="date" defaultValue={proyecto?.fecha_inicio ?? ''} />
        </div>

        <div>
          <Label htmlFor="fecha_fin_estimada">Fecha fin estimada</Label>
          <Input id="fecha_fin_estimada" name="fecha_fin_estimada" type="date" defaultValue={proyecto?.fecha_fin_estimada ?? ''} />
        </div>

        <div>
          <Label htmlFor="presupuesto_total">Presupuesto</Label>
          <Input id="presupuesto_total" name="presupuesto_total" type="number" step="0.01" defaultValue={proyecto?.presupuesto_total ?? ''} />
        </div>

        <div>
          <Label htmlFor="moneda">Moneda</Label>
          <Select name="moneda" defaultValue={proyecto?.moneda ?? 'ARS'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS">ARS</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cliente_persona_id">Cliente (persona)</Label>
          <Select name="cliente_persona_id" defaultValue={proyecto?.cliente_persona_id ?? ''}>
            <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Ninguno</SelectItem>
              {personas.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.apellido}, {p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cliente_entidad_id">Cliente (entidad)</Label>
          <Select name="cliente_entidad_id" defaultValue={proyecto?.cliente_entidad_id ?? ''}>
            <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Ninguna</SelectItem>
              {entidades.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

    </form>
  )
}

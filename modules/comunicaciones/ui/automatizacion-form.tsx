'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import {
  crearAutomatizacion,
  actualizarAutomatizacion,
} from '@/modules/comunicaciones/lib/actions'

interface Automatizacion {
  id: string
  nombre: string
  slug: string
  trigger_evento: string
  descripcion: string | null
  condiciones_json: Record<string, unknown> | null
  activo: boolean
}

interface AutomatizacionFormProps {
  automatizacion?: Automatizacion
}

const TRIGGERS = [
  { value: 'persona_creada', label: 'Persona creada' },
  { value: 'cuota_emitida', label: 'Cuota emitida' },
  { value: 'cuota_vencida', label: 'Cuota vencida' },
  { value: 'evento_confirmado', label: 'Evento confirmado' },
  { value: 'equipo_inscripcion', label: 'Inscripcion a equipo' },
  { value: 'apto_vence_7d', label: 'Apto medico vence en 7 dias' },
  { value: 'cuota_vence_7d', label: 'Cuota vence en 7 dias' },
  { value: 'cuota_vencida_7d', label: 'Cuota vencida hace 7 dias' },
  { value: 'manual', label: 'Manual' },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function AutomatizacionForm({ automatizacion }: AutomatizacionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = !!automatizacion

  const [nombre, setNombre] = useState(automatizacion?.nombre ?? '')
  const [slug, setSlug] = useState(automatizacion?.slug ?? '')
  const [triggerEvento, setTriggerEvento] = useState(automatizacion?.trigger_evento ?? '')
  const [descripcion, setDescripcion] = useState(automatizacion?.descripcion ?? '')
  const [activo, setActivo] = useState(automatizacion?.activo ?? false)

  function handleNombreChange(value: string) {
    setNombre(value)
    if (!isEdit) {
      setSlug(slugify(value))
    }
  }

  function handleGuardar() {
    if (!nombre.trim() || !slug.trim() || !triggerEvento) {
      toast.error('Nombre, slug y trigger son obligatorios')
      return
    }

    startTransition(async () => {
      if (isEdit) {
        const result = await actualizarAutomatizacion(automatizacion.id, {
          nombre: nombre.trim(),
          trigger_evento: triggerEvento,
          descripcion: descripcion.trim() || null,
          activo,
        })
        if (result.ok) {
          toast.success('Automatizacion actualizada')
          router.push('/admin/comunicaciones')
          router.refresh()
        } else {
          toast.error(result.message)
        }
      } else {
        const result = await crearAutomatizacion({
          nombre: nombre.trim(),
          slug: slug.trim(),
          trigger_evento: triggerEvento,
          descripcion: descripcion.trim() || null,
          activo,
        })
        if (result.ok) {
          toast.success('Automatizacion creada')
          if (result.id) {
            router.push(`/admin/comunicaciones/automatizaciones/${result.id}`)
          } else {
            router.push('/admin/comunicaciones')
          }
          router.refresh()
        } else {
          toast.error(result.message)
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/comunicaciones')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold sm:text-2xl flex-1">
          {isEdit ? 'Editar automatizacion' : 'Nueva automatizacion'}
        </h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleGuardar} disabled={isPending} size="sm">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear automatizacion'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/comunicaciones')}>
            Cancelar
          </Button>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Configuracion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Ej: Bienvenida automatica"
                value={nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="bienvenida-automatica"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={isEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={triggerEvento} onValueChange={(v) => setTriggerEvento(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar evento..." />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-3 pb-1">
              <div className="flex items-center gap-2">
                <Switch
                  id="activo"
                  checked={activo}
                  onCheckedChange={setActivo}
                />
                <Label htmlFor="activo" className="text-sm">
                  {activo ? 'Activo' : 'Inactivo'}
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion (opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Que hace esta automatizacion..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

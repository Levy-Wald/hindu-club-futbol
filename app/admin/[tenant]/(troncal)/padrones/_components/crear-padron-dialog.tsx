'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { crearPadron } from '../_actions'
import type { CrearPadronInput } from '../_actions'
import { obtenerPipelines } from '@/lib/imports/actions'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const INITIAL: CrearPadronInput = {
  nombre: '',
  slug: '',
  tipo: '',
  pipeline_slug: '',
}

export function CrearPadronDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CrearPadronInput>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pipelines, setPipelines] = useState<{ slug: string; nombre: string; descripcion: string | null }[]>([])

  useEffect(() => {
    if (open && pipelines.length === 0) {
      obtenerPipelines().then(setPipelines)
    }
  }, [open, pipelines.length])

  function updateNombre(value: string) {
    setForm((prev) => ({
      ...prev,
      nombre: value,
      slug: slugify(value),
    }))
    setErrors((prev) => ({ ...prev, nombre: '' }))
  }

  function updateSlug(value: string) {
    setForm((prev) => ({ ...prev, slug: value }))
    setErrors((prev) => ({ ...prev, slug: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!form.nombre.trim()) {
      setErrors((prev) => ({ ...prev, nombre: 'El nombre es obligatorio' }))
      return
    }
    if (!form.slug.trim()) {
      setErrors((prev) => ({ ...prev, slug: 'El slug es obligatorio' }))
      return
    }

    setLoading(true)
    const result = await crearPadron(form)
    setLoading(false)

    if (result.ok) {
      toast.success(result.message)
      setForm(INITIAL)
      setOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-2 h-4 w-4" />
        Nuevo padron
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo padron</DialogTitle>
          <DialogDescription>
            Crea un nuevo padron. El slug se genera automaticamente a partir del nombre.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="padron-nombre">Nombre *</Label>
            <Input
              id="padron-nombre"
              value={form.nombre}
              onChange={(e) => updateNombre(e.target.value)}
              placeholder="Ej: Socios Hockey"
            />
            {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="padron-slug">Slug *</Label>
            <Input
              id="padron-slug"
              value={form.slug}
              onChange={(e) => updateSlug(e.target.value)}
              placeholder="socios-hockey"
            />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="padron-tipo">Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm((prev) => ({ ...prev, tipo: v ?? '' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="deportivo">Deportivo</SelectItem>
                <SelectItem value="educativo">Educativo</SelectItem>
                <SelectItem value="residencial">Residencial</SelectItem>
                <SelectItem value="administrativo">Administrativo</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="padron-pipeline">Tipo de importacion</Label>
            <Select value={form.pipeline_slug} onValueChange={(v) => setForm((prev) => ({ ...prev, pipeline_slug: v ?? '' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de importacion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Sin tipo (legacy)</SelectItem>
                {pipelines.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.nombre}{p.descripcion ? ` — ${p.descripcion}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define como se importan datos a este padron. &quot;Sin tipo&quot; usa el flujo legacy.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear padron
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

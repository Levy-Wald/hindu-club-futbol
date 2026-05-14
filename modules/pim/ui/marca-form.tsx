'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { crearMarcaAction, editarMarcaAction } from '../lib/actions'
import type { Marca } from '../lib/tipos'
import { useRouter } from 'next/navigation'

interface MarcaFormDialogProps {
  mode: 'create' | 'edit'
  marca?: Marca
  triggerRender?: React.ReactElement
  triggerLabel?: string
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function MarcaFormDialog({
  mode,
  marca,
  triggerRender,
  triggerLabel,
}: MarcaFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [nombre, setNombre] = useState(marca?.nombre ?? '')
  const [slug, setSlug] = useState(marca?.slug ?? '')
  const [descripcion, setDescripcion] = useState(marca?.descripcion ?? '')
  const [sitioWeb, setSitioWeb] = useState(marca?.sitio_web ?? '')
  const [autoSlug, setAutoSlug] = useState(mode === 'create')

  function resetForm() {
    if (mode === 'create') {
      setNombre('')
      setSlug('')
      setDescripcion('')
      setSitioWeb('')
      setAutoSlug(true)
    }
    setError(null)
  }

  function handleNombreChange(val: string) {
    setNombre(val)
    if (autoSlug) setSlug(slugify(val))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (!slug.trim()) {
      setError('El slug es obligatorio')
      return
    }

    startTransition(async () => {
      const data = {
        nombre: nombre.trim(),
        slug: slug.trim(),
        descripcion: descripcion.trim() || undefined,
        sitio_web: sitioWeb.trim() || null,
      }

      const result =
        mode === 'edit' && marca
          ? await editarMarcaAction({ id: marca.id, ...data })
          : await crearMarcaAction(data)

      if (!result.ok) {
        setError(result.error)
        return
      }

      setOpen(false)
      resetForm()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setError(null) }}>
      <DialogTrigger render={triggerRender ?? <Button data-testid="btn-nueva-marca" />}>
        {triggerLabel ?? (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Nueva marca
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar marca' : 'Nueva marca'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="input-nombre-marca">Nombre *</Label>
            <Input
              id="input-nombre-marca"
              data-testid="input-nombre-marca"
              value={nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              placeholder="Nike"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="input-slug-marca">Slug *</Label>
            <Input
              id="input-slug-marca"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setAutoSlug(false) }}
              placeholder="nike"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="input-sitio-web-marca">Sitio web</Label>
            <Input
              id="input-sitio-web-marca"
              value={sitioWeb}
              onChange={(e) => setSitioWeb(e.target.value)}
              placeholder="https://nike.com"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion-marca">Descripcion</Label>
            <Textarea id="descripcion-marca" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear marca'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

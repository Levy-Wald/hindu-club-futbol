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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { crearCategoriaAction, editarCategoriaAction } from '../lib/actions'
import type { ProductoCategoria } from '../lib/tipos'
import { useRouter } from 'next/navigation'

interface CategoriaFormDialogProps {
  mode: 'create' | 'edit'
  categoria?: ProductoCategoria
  categorias: ProductoCategoria[]
  triggerRender?: React.ReactElement
  triggerLabel?: string
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CategoriaFormDialog({
  mode,
  categoria,
  categorias,
  triggerRender,
  triggerLabel,
}: CategoriaFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [nombre, setNombre] = useState(categoria?.nombre ?? '')
  const [slug, setSlug] = useState(categoria?.slug ?? '')
  const [parentId, setParentId] = useState<string>(categoria?.parent_id ?? '')
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '')

  function resetForm() {
    if (mode === 'create') {
      setNombre('')
      setSlug('')
      setParentId('')
      setDescripcion('')
    }
    setError(null)
  }

  function handleNombreChange(value: string) {
    setNombre(value)
    if (mode === 'create') {
      setSlug(generateSlug(value))
    }
  }

  // Exclude self and descendants for parent selector (prevent cycles)
  const availableParents = mode === 'edit' && categoria
    ? categorias.filter((c) => c.id !== categoria.id)
    : categorias

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    startTransition(async () => {
      const data = {
        nombre: nombre.trim(),
        slug: slug.trim() || generateSlug(nombre.trim()),
        parent_id: parentId || null,
        descripcion: descripcion.trim() || undefined,
      }

      const result =
        mode === 'edit' && categoria
          ? await editarCategoriaAction({ id: categoria.id, ...data })
          : await crearCategoriaAction(data)

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
      <DialogTrigger render={triggerRender ?? <Button data-testid="btn-nueva-categoria" />}>
        {triggerLabel ?? (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Nueva categoria
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar categoria' : 'Nueva categoria'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cat-nombre">Nombre *</Label>
            <Input id="cat-nombre" value={nombre} onChange={(e) => handleNombreChange(e.target.value)} placeholder="Indumentaria" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input id="cat-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="indumentaria" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-parent">Categoria padre</Label>
            <Select value={parentId} onValueChange={(v) => setParentId(v ?? '')}>
              <SelectTrigger id="cat-parent">
                <SelectValue placeholder="Sin padre (raiz)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin padre (raiz)</SelectItem>
                {availableParents.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.parent_id ? '  ' : ''}{c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-desc">Descripcion</Label>
            <Textarea id="cat-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar' : 'Crear categoria'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

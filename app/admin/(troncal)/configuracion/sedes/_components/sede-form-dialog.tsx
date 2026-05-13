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
import { Plus } from 'lucide-react'
import { crearSedeAction, editarSedeAction } from '../_actions'
import { useRouter } from 'next/navigation'

interface SedeFormDialogProps {
  mode: 'create' | 'edit'
  sede?: {
    id: string
    nombre: string
    slug: string
    direccion: Record<string, string> | null
  }
  triggerRender?: React.ReactElement
  triggerLabel?: string
}

export function SedeFormDialog({ mode, sede, triggerRender, triggerLabel }: SedeFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [nombre, setNombre] = useState(sede?.nombre ?? '')
  const [slug, setSlug] = useState(sede?.slug ?? '')
  const [calle, setCalle] = useState(sede?.direccion?.calle ?? '')
  const [numero, setNumero] = useState(sede?.direccion?.numero ?? '')
  const [ciudad, setCiudad] = useState(sede?.direccion?.ciudad ?? '')

  function resetForm() {
    if (mode === 'create') {
      setNombre('')
      setSlug('')
      setCalle('')
      setNumero('')
      setCiudad('')
    }
    setError(null)
  }

  function handleNombreChange(value: string) {
    setNombre(value)
    if (mode === 'create') {
      setSlug(
        value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      )
    }
  }

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
        slug: slug.trim() || nombre.trim().toLowerCase().replace(/\s+/g, '-'),
        direccion_calle: calle.trim() || undefined,
        direccion_numero: numero.trim() || undefined,
        direccion_ciudad: ciudad.trim() || undefined,
      }

      const result = mode === 'edit' && sede
        ? await editarSedeAction({ id: sede.id, ...data })
        : await crearSedeAction(data)

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
      <DialogTrigger render={triggerRender ?? <Button data-testid="btn-nueva-sede" />}>
        {triggerLabel ?? (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Nueva sede
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar sede' : 'Nueva sede'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sede-nombre">Nombre *</Label>
            <Input
              id="sede-nombre"
              value={nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              placeholder="Ej: Sede Central"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="sede-calle">Calle</Label>
              <Input id="sede-calle" value={calle} onChange={(e) => setCalle(e.target.value)} placeholder="Av. Test" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sede-numero">Numero</Label>
              <Input id="sede-numero" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sede-ciudad">Ciudad</Label>
            <Input id="sede-ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="CABA" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Crear sede'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

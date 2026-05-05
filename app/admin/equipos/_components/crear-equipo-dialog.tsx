'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { crearEquipo } from '../_actions'

interface Categoria {
  id: string
  nombre_display: string
  disciplina_slug: string
}

interface CrearEquipoDialogProps {
  categorias: Categoria[]
  disciplinas: string[]
}

export function CrearEquipoDialog({ categorias, disciplinas }: CrearEquipoDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [nombre, setNombre] = useState('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [disciplina, setDisciplina] = useState<string>('')
  const [modalidad, setModalidad] = useState<string>('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const result = await crearEquipo({
        nombre,
        categoria_equipo_id: categoriaId || null,
        disciplina_slug: disciplina,
        modalidad: modalidad || undefined,
      })

      if (result.ok) {
        toast.success(result.message)
        setOpen(false)
        setNombre('')
        setCategoriaId('')
        setDisciplina('')
        setModalidad('')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-4 w-4 mr-1" />
        Crear equipo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear equipo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Hockey Damas Primera"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="disciplina">Disciplina</Label>
            <Select value={disciplina} onValueChange={(v) => setDisciplina(v ?? '')}>
              <SelectTrigger id="disciplina">
                <SelectValue placeholder="Seleccionar disciplina" />
              </SelectTrigger>
              <SelectContent>
                {disciplinas.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoriaId} onValueChange={(v) => setCategoriaId(v ?? '')}>
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Seleccionar categoria (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre_display}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modalidad">Modalidad</Label>
            <Select value={modalidad} onValueChange={(v) => setModalidad(v ?? '')}>
              <SelectTrigger id="modalidad">
                <SelectValue placeholder="Seleccionar modalidad (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
                <SelectItem value="mixto">Mixto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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

const DISCIPLINAS = [
  { value: 'hockey', label: 'Hockey' },
  { value: 'futbol', label: 'Futbol' },
  { value: 'rugby', label: 'Rugby' },
  { value: 'natacion', label: 'Natacion' },
  { value: 'tenis', label: 'Tenis' },
  { value: 'padel', label: 'Padel' },
  { value: 'basquet', label: 'Basquet' },
  { value: 'voley', label: 'Voley' },
  { value: 'handball', label: 'Handball' },
  { value: 'atletismo', label: 'Atletismo' },
  { value: 'gimnasia', label: 'Gimnasia' },
  { value: 'otro', label: 'Otro' },
]

const MODALIDADES = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'mixto', label: 'Mixto' },
]

interface Categoria {
  id: string
  nombre_display: string
  disciplina_slug: string
}

interface CrearEquipoDialogProps {
  categorias: Categoria[]
  disciplinas: string[]
}

export function CrearEquipoDialog({ categorias }: CrearEquipoDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [nombre, setNombre] = useState('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [disciplina, setDisciplina] = useState<string>('')
  const [modalidad, setModalidad] = useState<string>('')

  const filteredCategorias = disciplina
    ? categorias.filter((c) => c.disciplina_slug === disciplina)
    : categorias

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !disciplina) {
      toast.error('Nombre y disciplina son obligatorios.')
      return
    }

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
            <Label htmlFor="eq-nombre">Nombre</Label>
            <Input
              id="eq-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Hockey Damas Primera"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Disciplina *</Label>
              <Select value={disciplina} onValueChange={(v) => { setDisciplina(v ?? ''); setCategoriaId('') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {DISCIPLINAS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modalidad</Label>
              <Select value={modalidad} onValueChange={(v) => setModalidad(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {MODALIDADES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredCategorias.length > 0 && (
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoriaId} onValueChange={(v) => setCategoriaId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre_display}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !nombre.trim() || !disciplina}>
              {isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

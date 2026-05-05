'use client'

import { useState, useTransition } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { editarEquipo } from '../../_actions'

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

interface Equipo {
  id: string
  nombre: string
  disciplina_slug: string
  modalidad: string | null
  activo: boolean
}

interface Categoria {
  id: string
  nombre_display: string
  disciplina_slug: string
}

interface EditarEquipoFormProps {
  equipo: Equipo
  categorias: Categoria[]
}

export function EditarEquipoForm({ equipo, categorias }: EditarEquipoFormProps) {
  const [isPending, startTransition] = useTransition()
  const [nombre, setNombre] = useState(equipo.nombre)
  const [disciplina, setDisciplina] = useState(equipo.disciplina_slug)
  const [modalidad, setModalidad] = useState(equipo.modalidad ?? '')
  const [activo, setActivo] = useState(equipo.activo)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio.')
      return
    }

    startTransition(async () => {
      const result = await editarEquipo(equipo.id, {
        nombre,
        disciplina_slug: disciplina,
        modalidad: modalidad || undefined,
        activo,
      })

      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="edit-nombre">Nombre</Label>
        <Input
          id="edit-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del equipo"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Disciplina</Label>
          <Select value={disciplina} onValueChange={(v) => setDisciplina(v ?? '')}>
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

      <div className="flex items-center gap-3">
        <Switch checked={activo} onCheckedChange={setActivo} />
        <Label>Activo</Label>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending || !nombre.trim()}>
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}

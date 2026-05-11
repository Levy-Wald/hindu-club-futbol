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
import { editarEquipo } from '@/modules/equipos/lib/actions'

const DISCIPLINAS = [
  { value: 'hockey', label: 'Hockey' },
  { value: 'futbol', label: 'Fútbol' },
  { value: 'rugby', label: 'Rugby' },
  { value: 'natacion', label: 'Natación' },
  { value: 'tenis', label: 'Tenis' },
  { value: 'padel', label: 'Pádel' },
  { value: 'basquet', label: 'Básquet' },
  { value: 'voley', label: 'Vóley' },
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
  color_principal: string | null
  color_secundario: string | null
  categoria_id: string | null
  entidad_id: string | null
  torneo: string | null
}

interface Categoria {
  id: string
  nombre_display: string
  disciplina_slug: string
  edad_min: number | null
  edad_max: number | null
}

interface Federacion {
  id: string
  nombre: string
  tipo: string
}

interface EditarEquipoFormProps {
  equipo: Equipo
  categorias: Categoria[]
  federaciones: Federacion[]
}

export function EditarEquipoForm({ equipo, categorias, federaciones }: EditarEquipoFormProps) {
  const [isPending, startTransition] = useTransition()
  const [nombre, setNombre] = useState(equipo.nombre)
  const [disciplina, setDisciplina] = useState(equipo.disciplina_slug)
  const [modalidad, setModalidad] = useState(equipo.modalidad ?? '')
  const [activo, setActivo] = useState(equipo.activo)
  const [colorPrincipal, setColorPrincipal] = useState(equipo.color_principal ?? '')
  const [colorSecundario, setColorSecundario] = useState(equipo.color_secundario ?? '')
  const [categoriaId, setCategoriaId] = useState(equipo.categoria_id ?? '')
  const [entidadId, setEntidadId] = useState(equipo.entidad_id ?? '')
  const [torneo, setTorneo] = useState(equipo.torneo ?? '')

  const categoriasFiltered = categorias.filter((c) => c.disciplina_slug === disciplina)
  const selectedCategoria = categorias.find((c) => c.id === categoriaId)

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
        categoria_equipo_id: categoriaId || null,
        color_principal: colorPrincipal || undefined,
        color_secundario: colorSecundario || undefined,
        entidad_id: entidadId || null,
        torneo: torneo || null,
      })

      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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

      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select value={categoriaId} onValueChange={(v) => setCategoriaId(v ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {categoriasFiltered.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre_display}
                {c.edad_min != null && c.edad_max != null && ` (${c.edad_min}–${c.edad_max} años)`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCategoria && selectedCategoria.edad_min != null && selectedCategoria.edad_max != null && (
          <p className="text-xs text-muted-foreground">
            Edades habilitadas: {selectedCategoria.edad_min} a {selectedCategoria.edad_max} años
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Federación / Liga</Label>
          <Select value={entidadId} onValueChange={(v) => setEntidadId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar federación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin federación</SelectItem>
              {federaciones.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="torneo">Torneo</Label>
          <Input
            id="torneo"
            value={torneo}
            onChange={(e) => setTorneo(e.target.value)}
            placeholder="Ej: Liga +28 2026"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color-principal">Color principal</Label>
          <div className="flex items-center gap-2">
            <Input
              id="color-principal"
              type="color"
              value={colorPrincipal || '#000000'}
              onChange={(e) => setColorPrincipal(e.target.value)}
              className="w-12 h-9 p-1 cursor-pointer"
            />
            <Input
              value={colorPrincipal}
              onChange={(e) => setColorPrincipal(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color-secundario">Color secundario</Label>
          <div className="flex items-center gap-2">
            <Input
              id="color-secundario"
              type="color"
              value={colorSecundario || '#ffffff'}
              onChange={(e) => setColorSecundario(e.target.value)}
              className="w-12 h-9 p-1 cursor-pointer"
            />
            <Input
              value={colorSecundario}
              onChange={(e) => setColorSecundario(e.target.value)}
              placeholder="#ffffff"
              className="flex-1"
            />
          </div>
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

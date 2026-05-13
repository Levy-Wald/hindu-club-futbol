'use client'

import { useState, useTransition } from 'react'
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
import type { TipoEspacio, Espacio, TipoEspacioSlug } from '../lib/tipos'

interface EspacioFormProps {
  sedes: { id: string; nombre: string }[]
  tiposEspacio: TipoEspacio[]
  espacio?: Espacio | null
  onSubmit: (data: {
    sede_id: string
    nombre: string
    tipo_slug: TipoEspacioSlug
    descripcion?: string
    capacidad_personas?: number
    dimensiones_m2?: number
  }) => Promise<{ ok: boolean; error?: string }>
  onCancel: () => void
}

export function EspacioForm({ sedes, tiposEspacio, espacio, onSubmit, onCancel }: EspacioFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [sedeId, setSedeId] = useState(espacio?.sede_id ?? '')
  const [nombre, setNombre] = useState(espacio?.nombre ?? '')
  const [tipoSlug, setTipoSlug] = useState<string>(espacio?.tipo_slug ?? '')
  const [descripcion, setDescripcion] = useState(espacio?.descripcion ?? '')
  const [capacidad, setCapacidad] = useState(espacio?.capacidad_personas?.toString() ?? '')
  const [dimensiones, setDimensiones] = useState(espacio?.dimensiones_m2?.toString() ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!sedeId || !nombre || !tipoSlug) {
      setError('Sede, nombre y tipo son obligatorios')
      return
    }

    startTransition(async () => {
      const result = await onSubmit({
        sede_id: sedeId,
        nombre: nombre.trim(),
        tipo_slug: tipoSlug as TipoEspacioSlug,
        descripcion: descripcion.trim() || undefined,
        capacidad_personas: capacidad ? parseInt(capacidad, 10) : undefined,
        dimensiones_m2: dimensiones ? parseFloat(dimensiones) : undefined,
      })
      if (!result.ok) setError(result.error ?? 'Error desconocido')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="sede">Sede *</Label>
        <Select value={sedeId} onValueChange={(v) => setSedeId(v ?? '')}>
          <SelectTrigger id="sede">
            <SelectValue placeholder="Seleccionar sede" />
          </SelectTrigger>
          <SelectContent>
            {sedes.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Cancha 1" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo *</Label>
        <Select value={tipoSlug} onValueChange={(v) => setTipoSlug(v ?? '')}>
          <SelectTrigger id="tipo">
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            {tiposEspacio.map((t) => (
              <SelectItem key={t.slug} value={t.slug}>{t.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripcion</Label>
        <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacidad">Capacidad (personas)</Label>
          <Input id="capacidad" type="number" min="1" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimensiones">Dimensiones (m2)</Label>
          <Input id="dimensiones" type="number" min="0.1" step="0.1" value={dimensiones} onChange={(e) => setDimensiones(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : espacio ? 'Guardar cambios' : 'Crear espacio'}
        </Button>
      </div>
    </form>
  )
}

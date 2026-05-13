'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { actualizarTorneoAction } from '../lib/actions'
import { FORMATOS } from '../lib/formatos'
import { CRITERIOS_LABELS } from '../lib/criterios-desempate'
import type {
  TorneoHidratado,
  Federacion,
  NivelCompetencia,
  EstadoTorneo,
} from '../lib/types'

export function TabDatosGenerales({
  torneo,
  federaciones,
  niveles,
  puedeAdmin,
}: {
  torneo: TorneoHidratado
  federaciones: Federacion[]
  niveles: NivelCompetencia[]
  puedeAdmin: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState(torneo.nombre)
  const [descripcion, setDescripcion] = useState(torneo.descripcion ?? '')
  const [estado, setEstado] = useState(torneo.estado)
  const [temporada, setTemporada] = useState(torneo.temporada ?? '')
  const [fechaInicio, setFechaInicio] = useState(torneo.fecha_inicio ?? '')
  const [fechaFin, setFechaFin] = useState(torneo.fecha_fin ?? '')

  function handleSave() {
    startTransition(async () => {
      const result = await actualizarTorneoAction({
        torneo_id: torneo.id,
        nombre,
        descripcion: descripcion || undefined,
        estado: estado as EstadoTorneo,
        temporada: temporada || undefined,
        fecha_inicio: fechaInicio || null,
        fecha_fin: fechaFin || null,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setEditing(false)
      setError('')
      router.refresh()
    })
  }

  const formatoLabel = FORMATOS.find((f) => f.slug === torneo.formato)?.nombre ?? torneo.formato

  if (!editing) {
    return (
      <div className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Tipo:</span>{' '}
            <span className="font-medium capitalize">{torneo.tipo}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Formato:</span>{' '}
            <span className="font-medium">{formatoLabel}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Temporada:</span>{' '}
            <span className="font-medium">{torneo.temporada ?? '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Nivel:</span>{' '}
            <span className="font-medium">{torneo.nivel_competencia_nombre ?? '—'}</span>
          </div>
          {torneo.federacion_nombre && (
            <div>
              <span className="text-muted-foreground">Federacion:</span>{' '}
              <span className="font-medium">{torneo.federacion_nombre}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Fechas:</span>{' '}
            <span className="font-medium">
              {torneo.fecha_inicio ?? '—'} / {torneo.fecha_fin ?? '—'}
            </span>
          </div>
        </div>
        {torneo.descripcion && (
          <div className="text-sm">
            <span className="text-muted-foreground">Descripcion:</span>{' '}
            {torneo.descripcion}
          </div>
        )}
        {torneo.criterios_desempate.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Desempate:</span>{' '}
            {torneo.criterios_desempate
              .map((c) => CRITERIOS_LABELS[c as keyof typeof CRITERIOS_LABELS] ?? c)
              .join(' > ')}
          </div>
        )}
        {puedeAdmin && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}
      <div>
        <Label>Nombre</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div>
        <Label>Descripcion</Label>
        <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Temporada</Label>
          <Input value={temporada} onChange={(e) => setTemporada(e.target.value)} />
        </div>
        <div>
          <Label>Estado</Label>
          <Select value={estado} onValueChange={(v) => setEstado((v ?? 'planificado') as EstadoTorneo)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planificado">Planificado</SelectItem>
              <SelectItem value="inscripcion">Inscripcion</SelectItem>
              <SelectItem value="en_curso">En curso</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Fecha inicio</Label>
          <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div>
          <Label>Fecha fin</Label>
          <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button variant="outline" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { crearEventoPlanificadorAction } from '../lib/crear-evento-action'
import { useRouter } from 'next/navigation'

const TIPOS_EVENTO = [
  { slug: 'entrenamiento', nombre: 'Entrenamiento' },
  { slug: 'partido', nombre: 'Partido' },
  { slug: 'amistoso', nombre: 'Amistoso' },
  { slug: 'actividad', nombre: 'Actividad general' },
  { slug: 'reserva', nombre: 'Reserva' },
  { slug: 'mantenimiento', nombre: 'Mantenimiento' },
  { slug: 'asamblea', nombre: 'Asamblea' },
  { slug: 'otro', nombre: 'Otro' },
]

interface CrearEventoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultFecha?: string
  defaultHoraInicio?: string
  defaultHoraFin?: string
  sedes: { id: string; nombre: string }[]
  equipos: { id: string; nombre: string }[]
}

export function CrearEventoDialog({
  open,
  onOpenChange,
  defaultFecha,
  defaultHoraInicio,
  defaultHoraFin,
  sedes,
  equipos,
}: CrearEventoDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [titulo, setTitulo] = useState('')
  const [tipoSlug, setTipoSlug] = useState('entrenamiento')
  const [fecha, setFecha] = useState(defaultFecha ?? '')
  const [horaInicio, setHoraInicio] = useState(defaultHoraInicio ?? '')
  const [horaFin, setHoraFin] = useState(defaultHoraFin ?? '')
  const [sedeId, setSedeId] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [descripcion, setDescripcion] = useState('')

  // Sync defaults when dialog opens with new values
  const [lastDefaults, setLastDefaults] = useState({ defaultFecha, defaultHoraInicio, defaultHoraFin })
  if (defaultFecha !== lastDefaults.defaultFecha || defaultHoraInicio !== lastDefaults.defaultHoraInicio || defaultHoraFin !== lastDefaults.defaultHoraFin) {
    setLastDefaults({ defaultFecha, defaultHoraInicio, defaultHoraFin })
    if (defaultFecha) setFecha(defaultFecha)
    if (defaultHoraInicio) setHoraInicio(defaultHoraInicio)
    if (defaultHoraFin) setHoraFin(defaultHoraFin)
  }

  function resetForm() {
    setTitulo('')
    setTipoSlug('entrenamiento')
    setFecha('')
    setHoraInicio('')
    setHoraFin('')
    setSedeId('')
    setEquipoId('')
    setDescripcion('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!titulo.trim() || !fecha || !horaInicio || !horaFin) {
      setError('Titulo, fecha, hora inicio y hora fin son obligatorios')
      return
    }

    startTransition(async () => {
      const result = await crearEventoPlanificadorAction({
        titulo: titulo.trim(),
        tipo_evento_slug: tipoSlug,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        sede_id: sedeId || undefined,
        equipo_id: equipoId || undefined,
        descripcion: descripcion.trim() || undefined,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      resetForm()
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setError(null) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ev-titulo">Titulo *</Label>
            <Input id="ev-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Entrenamiento Sub-20" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-tipo">Tipo *</Label>
            <Select value={tipoSlug} onValueChange={(v) => setTipoSlug(v ?? 'entrenamiento')}>
              <SelectTrigger id="ev-tipo">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_EVENTO.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>{t.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-fecha">Fecha *</Label>
            <Input id="ev-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ev-hora-inicio">Hora inicio *</Label>
              <Input id="ev-hora-inicio" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-hora-fin">Hora fin *</Label>
              <Input id="ev-hora-fin" type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
            </div>
          </div>

          {sedes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="ev-sede">Sede</Label>
              <Select value={sedeId} onValueChange={(v) => setSedeId(v ?? '')}>
                <SelectTrigger id="ev-sede">
                  <SelectValue placeholder="Sin sede" />
                </SelectTrigger>
                <SelectContent>
                  {sedes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {equipos.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="ev-equipo">Equipo</Label>
              <Select value={equipoId} onValueChange={(v) => setEquipoId(v ?? '')}>
                <SelectTrigger id="ev-equipo">
                  <SelectValue placeholder="Sin equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipos.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>{eq.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ev-descripcion">Descripcion</Label>
            <Textarea id="ev-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creando...' : 'Crear evento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { TipoEventoPartido, JugadorPlantel } from '../lib/resultado-types'
import type { obtenerDatosPartidoAction } from '../lib/resultado-actions'

type DatosPartido = Awaited<ReturnType<typeof obtenerDatosPartidoAction>> & { ok: true }
type EventoRow = DatosPartido['eventosPartido'][number]

const TIPOS_LABELS: Record<TipoEventoPartido, string> = {
  gol: 'Gol',
  asistencia: 'Asistencia',
  tarjeta_amarilla: 'Tarjeta amarilla',
  tarjeta_roja: 'Tarjeta roja',
  cambio: 'Cambio',
  penal_atajado: 'Penal atajado',
  penal_errado: 'Penal errado',
  autogol: 'Autogol',
}

export function Paso2Eventos({
  datos,
  jugadores,
  eventosPartido,
  onAgregarEvento,
  onEliminarEvento,
  onSiguiente,
  onAnterior,
  confirmado,
}: {
  datos: DatosPartido
  jugadores: JugadorPlantel[]
  eventosPartido: EventoRow[]
  onAgregarEvento: (input: {
    minuto: number
    tipo: TipoEventoPartido
    persona_id?: string
    equipo_id?: string
    equipo_externo_nombre?: string
    persona_relacionada_id?: string
    descripcion?: string
  }) => Promise<{ ok: boolean; error?: string }>
  onEliminarEvento: (id: string) => Promise<{ ok: boolean }>
  onSiguiente: () => void
  onAnterior: () => void
  confirmado: boolean
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalEquipo, setModalEquipo] = useState<'local' | 'visitante'>('local')
  const [isPending, startTransition] = useTransition()

  // Modal form state
  const [tipo, setTipo] = useState<TipoEventoPartido>('gol')
  const [minuto, setMinuto] = useState(0)
  const [personaId, setPersonaId] = useState('')
  const [personaRelId, setPersonaRelId] = useState('')
  const [nombreRival, setNombreRival] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)

  const rivalNombre = datos.partido.rival_texto ?? 'Rival'
  const equipoId = datos.evento.equipo_id

  const eventosLocal = eventosPartido.filter(
    (e) => e.equipo_id !== null || (e.equipo_externo_nombre === null && e.persona_id !== null)
  )
  const eventosVisitante = eventosPartido.filter(
    (e) => e.equipo_externo_nombre !== null
  )

  function openModal(equipo: 'local' | 'visitante') {
    setModalEquipo(equipo)
    setTipo('gol')
    setMinuto(0)
    setPersonaId('')
    setPersonaRelId('')
    setNombreRival('')
    setDescripcion('')
    setModalError(null)
    setModalOpen(true)
  }

  function handleSubmitEvento() {
    startTransition(async () => {
      const input: Parameters<typeof onAgregarEvento>[0] = {
        minuto,
        tipo,
        descripcion: descripcion || undefined,
      }

      if (modalEquipo === 'local') {
        input.equipo_id = equipoId ?? undefined
        if (personaId) input.persona_id = personaId
        if (tipo === 'gol' && personaRelId) input.persona_relacionada_id = personaRelId
        if (tipo === 'cambio' && personaRelId) input.persona_relacionada_id = personaRelId
      } else {
        input.equipo_externo_nombre = rivalNombre
        if (nombreRival) input.descripcion = nombreRival + (descripcion ? ` — ${descripcion}` : '')
      }

      const res = await onAgregarEvento(input)
      if (res.ok) {
        setModalOpen(false)
      } else {
        setModalError(res.error ?? 'Error al guardar')
      }
    })
  }

  function handleEliminar(id: string) {
    startTransition(async () => {
      await onEliminarEvento(id)
    })
  }

  function getPersonaNombre(pid: string | null) {
    if (!pid) return '—'
    const j = jugadores.find((j) => j.persona_id === pid)
    return j ? `${j.apellido}, ${j.nombre}` : pid.slice(0, 8)
  }

  function renderEventoRow(e: EventoRow) {
    return (
      <div
        key={e.id}
        className="flex items-center gap-2 py-1.5 border-b last:border-b-0"
        data-testid={`evento-cargado-${e.id}`}
      >
        <span className="text-xs font-mono text-muted-foreground w-8">{e.minuto}&apos;</span>
        <span className="text-sm font-medium flex-1">
          {TIPOS_LABELS[e.tipo as TipoEventoPartido] ?? e.tipo}
          {e.persona_id && ` — ${getPersonaNombre(e.persona_id)}`}
          {e.persona_relacionada_id && (
            <span className="text-muted-foreground">
              {e.tipo === 'gol' && ` (asist: ${getPersonaNombre(e.persona_relacionada_id)})`}
              {e.tipo === 'cambio' && ` (sale: ${getPersonaNombre(e.persona_relacionada_id)})`}
            </span>
          )}
          {e.equipo_externo_nombre && ` (${e.equipo_externo_nombre})`}
          {e.descripcion && <span className="text-muted-foreground"> — {e.descripcion}</span>}
        </span>
        {!confirmado && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleEliminar(e.id)}
            disabled={isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div data-testid="paso-2-eventos">
      {/* Local events */}
      <div className="rounded-lg border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Local</h3>
          {!confirmado && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openModal('local')}
              data-testid="btn-agregar-evento-local"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar evento
            </Button>
          )}
        </div>
        {eventosLocal.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos cargados</p>
        ) : (
          eventosLocal.map(renderEventoRow)
        )}
      </div>

      {/* Visitante events */}
      <div className="rounded-lg border p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{rivalNombre}</h3>
          {!confirmado && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openModal('visitante')}
              data-testid="btn-agregar-evento-visitante"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar evento
            </Button>
          )}
        </div>
        {eventosVisitante.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos cargados</p>
        ) : (
          eventosVisitante.map(renderEventoRow)
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onAnterior}>
          Anterior
        </Button>
        <Button onClick={onSiguiente} data-testid="btn-siguiente-paso2">
          Siguiente
        </Button>
      </div>

      {/* Modal agregar evento */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent data-testid="modal-evento">
          <DialogHeader>
            <DialogTitle>
              Agregar evento — {modalEquipo === 'local' ? 'Local' : rivalNombre}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo((v ?? 'gol') as TipoEventoPartido)}
              >
                <SelectTrigger data-testid="select-tipo-evento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Minuto</Label>
              <Input
                type="number"
                min={0}
                max={130}
                value={minuto}
                onChange={(e) => setMinuto(parseInt(e.target.value) || 0)}
                data-testid="input-minuto"
              />
            </div>

            {modalEquipo === 'local' && (
              <>
                <div>
                  <Label>Jugador</Label>
                  <Select value={personaId} onValueChange={(v) => setPersonaId(v ?? '')}>
                    <SelectTrigger data-testid="select-jugador-evento">
                      <SelectValue placeholder="Seleccionar jugador" />
                    </SelectTrigger>
                    <SelectContent>
                      {jugadores
                        .filter((j) => j.jugo)
                        .map((j) => (
                          <SelectItem key={j.persona_id} value={j.persona_id}>
                            {j.dorsal !== null ? `#${j.dorsal} ` : ''}
                            {j.apellido}, {j.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {(tipo === 'gol' || tipo === 'cambio') && (
                  <div>
                    <Label>
                      {tipo === 'gol' ? 'Asistencia (opcional)' : 'Sale'}
                    </Label>
                    <Select
                      value={personaRelId}
                      onValueChange={(v) => setPersonaRelId(v ?? '')}
                    >
                      <SelectTrigger data-testid="select-asistente-evento">
                        <SelectValue
                          placeholder={
                            tipo === 'gol' ? 'Sin asistencia' : 'Jugador que sale'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {jugadores
                          .filter((j) => j.jugo && j.persona_id !== personaId)
                          .map((j) => (
                            <SelectItem key={j.persona_id} value={j.persona_id}>
                              {j.dorsal !== null ? `#${j.dorsal} ` : ''}
                              {j.apellido}, {j.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {modalEquipo === 'visitante' && (
              <div>
                <Label>Jugador rival (nombre)</Label>
                <Input
                  value={nombreRival}
                  onChange={(e) => setNombreRival(e.target.value)}
                  placeholder="Nombre del jugador"
                  data-testid="input-jugador-rival"
                />
              </div>
            )}

            <div>
              <Label>Descripción (opcional)</Label>
              <Input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: penal, tiro libre"
              />
            </div>

            {modalError && (
              <p className="text-sm text-destructive">{modalError}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitEvento} disabled={isPending} data-testid="btn-guardar-evento">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

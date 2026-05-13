'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { inscribirEquipoEnTorneoExternoAction } from '../lib/inscripciones-actions'
import type { TorneoHidratado, EquipoPropio } from '../lib/types'

export function ModalInscribirEquipo({
  torneosExternos,
  equiposPropios,
  onClose,
}: {
  torneosExternos: TorneoHidratado[]
  equiposPropios: EquipoPropio[]
  onClose: () => void
}) {
  const [torneoId, setTorneoId] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [categoriaExterna, setCategoriaExterna] = useState('')
  const [numeroAfiliacion, setNumeroAfiliacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const torneoSeleccionado = useMemo(
    () => torneosExternos.find((t) => t.id === torneoId),
    [torneosExternos, torneoId]
  )

  async function handleSubmit() {
    if (!torneoId || !equipoId) {
      setError('Seleccione torneo y equipo')
      return
    }
    setLoading(true)
    setError(null)

    const res = await inscribirEquipoEnTorneoExternoAction({
      torneo_id: torneoId,
      equipo_id: equipoId,
      categoria_externa: categoriaExterna || undefined,
      numero_afiliacion: numeroAfiliacion || undefined,
    })

    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent data-testid="modal-inscribir">
        <DialogHeader>
          <DialogTitle>Inscribir equipo en torneo externo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Torneo externo</Label>
            <Select
              value={torneoId}
              onValueChange={(v) => setTorneoId(v ?? '')}
            >
              <SelectTrigger data-testid="select-torneo">
                <SelectValue placeholder="Seleccionar torneo..." />
              </SelectTrigger>
              <SelectContent>
                {torneosExternos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre} {t.federacion_nombre ? `(${t.federacion_nombre})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Equipo propio</Label>
            <Select
              value={equipoId}
              onValueChange={(v) => setEquipoId(v ?? '')}
            >
              <SelectTrigger data-testid="select-equipo">
                <SelectValue placeholder="Seleccionar equipo..." />
              </SelectTrigger>
              <SelectContent>
                {equiposPropios.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {torneoSeleccionado?.federacion_nombre && (
            <div>
              <Label>Federación</Label>
              <Input value={torneoSeleccionado.federacion_nombre} disabled />
            </div>
          )}

          <div>
            <Label>Categoría externa (cómo se llama en la federación)</Label>
            <Input
              placeholder="Ej: Primera División, Categoría B"
              value={categoriaExterna}
              onChange={(e) => setCategoriaExterna(e.target.value)}
            />
          </div>

          <div>
            <Label>Número de afiliación (opcional)</Label>
            <Input
              placeholder="Ej: 12345"
              value={numeroAfiliacion}
              onChange={(e) => setNumeroAfiliacion(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              data-testid="btn-submit-inscripcion"
              onClick={handleSubmit}
              disabled={loading || !torneoId || !equipoId}
            >
              {loading ? 'Inscribiendo...' : 'Inscribir'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

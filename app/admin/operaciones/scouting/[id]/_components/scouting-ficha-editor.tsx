'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Star, Save, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { editarScoutingFicha, eliminarScoutingFicha } from '../../_actions'
import type { ScoutingFichaDetalle } from '../../_lib/queries'

const ESTADOS_SCOUTING = [
  { value: 'observado', label: 'Observado' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'en_negociacion', label: 'En negociación' },
  { value: 'descartado', label: 'Descartado' },
  { value: 'incorporado', label: 'Incorporado' },
]

interface Equipo {
  id: string
  nombre: string
}

interface ScoutingFichaEditorProps {
  ficha: ScoutingFichaDetalle
  equipos: Equipo[]
}

function EstrellasInteractivas({
  valor,
  onChange,
}: {
  valor: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(valor === n ? null : n)}
          className="p-0.5 hover:scale-110 transition-transform"
          title={valor === n ? 'Quitar evaluación' : `${n} estrella${n > 1 ? 's' : ''}`}
        >
          <Star
            className={`h-5 w-5 ${
              valor !== null && n <= valor
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-muted-foreground/40 hover:text-amber-300'
            }`}
          />
        </button>
      ))}
      {valor !== null && (
        <span className="text-sm text-muted-foreground ml-1">{valor}/5</span>
      )}
    </div>
  )
}

export function ScoutingFichaEditor({ ficha, equipos }: ScoutingFichaEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [nombre, setNombre] = useState(ficha.nombre)
  const [apellido, setApellido] = useState(ficha.apellido)
  const [fechaNacimiento, setFechaNacimiento] = useState(ficha.fecha_nacimiento ?? '')
  const [posicion, setPosicion] = useState(ficha.posicion ?? '')
  const [clubActual, setClubActual] = useState(ficha.club_actual ?? '')
  const [contacto, setContacto] = useState(ficha.contacto ?? '')
  const [estado, setEstado] = useState(ficha.estado)
  const [observaciones, setObservaciones] = useState(ficha.observaciones ?? '')
  const [evaluacion, setEvaluacion] = useState<number | null>(ficha.evaluacion)
  const [equipoId, setEquipoId] = useState(ficha.equipo_id ?? '')

  function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !apellido.trim()) {
      toast.error('Nombre y apellido son obligatorios.')
      return
    }

    startTransition(async () => {
      const result = await editarScoutingFicha(ficha.id, {
        nombre,
        apellido,
        fecha_nacimiento: fechaNacimiento || null,
        posicion: posicion || null,
        club_actual: clubActual || null,
        contacto: contacto || null,
        estado,
        observaciones: observaciones || null,
        evaluacion,
        equipo_id: equipoId || null,
      })

      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleEliminar() {
    startTransition(async () => {
      const result = await eliminarScoutingFicha(ficha.id)
      if (result.ok) {
        toast.success(result.message)
        router.push('/admin/operaciones/scouting')
      } else {
        toast.error(result.message)
      }
      setShowDeleteDialog(false)
    })
  }

  return (
    <>
      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar ficha de scouting</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que querés eliminar la ficha de{' '}
              <strong>
                {ficha.nombre} {ficha.apellido}
              </strong>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminar} disabled={isPending}>
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form onSubmit={handleGuardar} className="space-y-6">
        {/* Datos principales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del jugador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ed-nombre">Nombre *</Label>
                <Input
                  id="ed-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-apellido">Apellido *</Label>
                <Input
                  id="ed-apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ed-fecha">Fecha de nacimiento</Label>
                <Input
                  id="ed-fecha"
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-posicion">Posición</Label>
                <Input
                  id="ed-posicion"
                  value={posicion}
                  onChange={(e) => setPosicion(e.target.value)}
                  placeholder="Ej: Delantero, Arquero"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ed-club">Club actual</Label>
                <Input
                  id="ed-club"
                  value={clubActual}
                  onChange={(e) => setClubActual(e.target.value)}
                  placeholder="Club donde juega"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ed-contacto">Contacto</Label>
                <Input
                  id="ed-contacto"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Tel / email / representante"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado y evaluación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado y evaluación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={estado} onValueChange={(v) => setEstado(v ?? 'observado')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_SCOUTING.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Equipo interesado</Label>
                <Select value={equipoId} onValueChange={(v) => setEquipoId(v === 'ninguno' ? '' : (v ?? ''))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin equipo asignado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin equipo asignado</SelectItem>
                    {equipos.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Evaluación</Label>
              <EstrellasInteractivas valor={evaluacion} onChange={setEvaluacion} />
            </div>
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas sobre el jugador, performance, actitud, etc."
              rows={5}
            />
          </CardContent>
        </Card>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
          <span>Creado: {new Date(ficha.created_at).toLocaleDateString('es-AR')}</span>
          <span>
            Actualizado: {new Date(ficha.updated_at).toLocaleDateString('es-AR')}
          </span>
          {ficha.scout_nombre && <span>Scout: {ficha.scout_nombre}</span>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
          <Button type="submit" disabled={isPending || !nombre.trim() || !apellido.trim()}>
            <Save className="h-4 w-4 mr-1" />
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </>
  )
}

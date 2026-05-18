'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Combobox } from '@/components/ui/combobox'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { crearTrayectoriaClub, actualizarTrayectoriaClub, fetchDistinctClubNombresAction } from '../lib/actions'
import type { TrayectoriaClub } from '../lib/tipos'

const CATEGORIAS = [
  'Primera', 'Reserva', 'Sub-20', 'Sub-18', 'Sub-17', 'Sub-16', 'Sub-15', 'Sub-14', 'Sub-13', 'Infantiles', 'Otra',
] as const

const POSICIONES = [
  'Arquero', 'Defensor central', 'Lateral derecho', 'Lateral izquierdo',
  'Mediocampista central', 'Mediocampista ofensivo', 'Mediocampista defensivo',
  'Volante derecho', 'Volante izquierdo', 'Enganche',
  'Delantero centro', 'Extremo derecho', 'Extremo izquierdo',
  'Otra',
] as const

const DISCIPLINAS = [
  { value: 'futbol', label: 'Fútbol' },
  { value: 'futsal', label: 'Futsal' },
  { value: 'hockey', label: 'Hockey' },
  { value: 'rugby', label: 'Rugby' },
  { value: 'basquet', label: 'Básquet' },
  { value: 'voley', label: 'Vóley' },
  { value: 'tenis', label: 'Tenis' },
  { value: 'natacion', label: 'Natación' },
  { value: 'otro', label: 'Otro' },
] as const

interface TrayectoriaFormProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  personaId: string
  editData?: TrayectoriaClub
}

export function TrayectoriaForm({ open, onOpenChange, onSuccess, personaId, editData }: TrayectoriaFormProps) {
  const isEdit = !!editData

  const [clubNombre, setClubNombre] = useState(editData?.club_nombre ?? '')
  const [clubPais, setClubPais] = useState(editData?.club_pais ?? '')
  const [clubCiudad, setClubCiudad] = useState(editData?.club_ciudad ?? '')
  const [disciplina, setDisciplina] = useState(editData?.disciplina_slug ?? '')
  const [categoria, setCategoria] = useState(editData?.categoria ?? '')
  const [posicion, setPosicion] = useState(editData?.posicion ?? '')
  const [numeroCamiseta, setNumeroCamiseta] = useState(editData?.numero_camiseta?.toString() ?? '')
  const [fechaDesde, setFechaDesde] = useState(editData?.fecha_desde ?? '')
  const [fechaHasta, setFechaHasta] = useState(editData?.fecha_hasta ?? '')
  const [pj, setPj] = useState(editData?.partidos_jugados?.toString() ?? '')
  const [goles, setGoles] = useState(editData?.goles?.toString() ?? '')
  const [asistencias, setAsistencias] = useState(editData?.asistencias?.toString() ?? '')
  const [observaciones, setObservaciones] = useState(editData?.observaciones ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [clubOptions, setClubOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    if (open) {
      fetchDistinctClubNombresAction().then(names =>
        setClubOptions(names.map(n => ({ value: n, label: n })))
      )
    }
  }, [open])

  async function handleSubmit() {
    setSubmitting(true)

    const payload = {
      club_nombre: clubNombre,
      club_pais: clubPais || undefined,
      club_ciudad: clubCiudad || undefined,
      disciplina_slug: disciplina || undefined,
      categoria: categoria || undefined,
      posicion: posicion || undefined,
      numero_camiseta: numeroCamiseta ? parseInt(numeroCamiseta) : undefined,
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined,
      partidos_jugados: pj ? parseInt(pj) : undefined,
      goles: goles ? parseInt(goles) : undefined,
      asistencias: asistencias ? parseInt(asistencias) : undefined,
      observaciones: observaciones || undefined,
    }

    const res = isEdit && editData
      ? await actualizarTrayectoriaClub(editData.id, payload)
      : await crearTrayectoriaClub({ persona_id: personaId, ...payload })

    setSubmitting(false)
    if (!res.ok) { toast.error(res.error ?? 'Error'); return }
    toast.success(isEdit ? 'Club actualizado' : 'Club agregado')
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar club' : 'Agregar club previo'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Club *</Label>
              <Combobox
                value={clubNombre}
                onChange={setClubNombre}
                options={clubOptions}
                placeholder="Ej: River Plate"
                allowCreate
              />
            </div>
            <div className="space-y-1.5">
              <Label>Disciplina</Label>
              <Select value={disciplina} onValueChange={(v) => setDisciplina(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {DISCIPLINAS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>País</Label>
              <Input value={clubPais} onChange={e => setClubPais(e.target.value)} placeholder="Ej: Argentina" />
            </div>
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Input value={clubCiudad} onChange={e => setClubCiudad(e.target.value)} placeholder="Ej: Buenos Aires" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Posición</Label>
              <Select value={posicion} onValueChange={(v) => setPosicion(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {POSICIONES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>N° camiseta</Label>
              <Input type="number" value={numeroCamiseta} onChange={e => setNumeroCamiseta(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Desde</Label>
              <Input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hasta</Label>
              <Input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>PJ</Label>
              <Input type="number" value={pj} onChange={e => setPj(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Goles</Label>
              <Input type="number" value={goles} onChange={e => setGoles(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Asistencias</Label>
              <Input type="number" value={asistencias} onChange={e => setAsistencias(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observaciones</Label>
            <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || !clubNombre}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { registrarLesion, actualizarLesion } from '../lib/actions'
import type { TipoLesion } from '../lib/tipos'

const GRAVEDADES = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'grave', label: 'Grave' },
  { value: 'muy_grave', label: 'Muy grave' },
] as const

interface LesionFormProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  personaId: string
  tiposLesion: TipoLesion[]
  equipos: { id: string; nombre: string }[]
  editData?: {
    id: string
    tipo_lesion_slug: string | null
    zona_corporal: string | null
    gravedad: string | null
    fecha_inicio: string | null
    equipo_id: string | null
    restriccion_actividad: string | null
    diagnostico_medico: string | null
    tratamiento: string | null
    descripcion: string | null
    notas: string | null
  }
}

export function LesionForm({ open, onOpenChange, onSuccess, personaId, tiposLesion, equipos, editData }: LesionFormProps) {
  const isEdit = !!editData

  const [tipoSlug, setTipoSlug] = useState(editData?.tipo_lesion_slug ?? '')
  const [zona, setZona] = useState(editData?.zona_corporal ?? '')
  const [gravedad, setGravedad] = useState(editData?.gravedad ?? '')
  const [fechaInicio, setFechaInicio] = useState(editData?.fecha_inicio ?? new Date().toISOString().slice(0, 10))
  const [equipoId, setEquipoId] = useState(editData?.equipo_id ?? '')
  const [restriccion, setRestriccion] = useState(editData?.restriccion_actividad ?? '')
  const [diagnostico, setDiagnostico] = useState(editData?.diagnostico_medico ?? '')
  const [tratamiento, setTratamiento] = useState(editData?.tratamiento ?? '')
  const [descripcion, setDescripcion] = useState(editData?.descripcion ?? '')
  const [notas, setNotas] = useState(editData?.notas ?? '')
  const [submitting, setSubmitting] = useState(false)

  function onTipoChange(slug: string) {
    setTipoSlug(slug)
    const tipo = tiposLesion.find(t => t.slug === slug)
    if (tipo && !isEdit) {
      if (tipo.zona_corporal_default && tipo.zona_corporal_default !== 'variable') {
        setZona(tipo.zona_corporal_default)
      }
      if (tipo.gravedad_default) {
        setGravedad(tipo.gravedad_default)
      }
    }
  }

  async function handleSubmit() {
    setSubmitting(true)

    if (isEdit && editData) {
      const res = await actualizarLesion(editData.id, {
        tipo_lesion_slug: tipoSlug || undefined,
        zona_corporal: zona || undefined,
        gravedad: (gravedad as 'leve' | 'moderada' | 'grave' | 'muy_grave') || undefined,
        fecha_inicio: fechaInicio || undefined,
        equipo_id: equipoId || null,
        restriccion_actividad: restriccion || null,
        diagnostico_medico: diagnostico || null,
        tratamiento: tratamiento || null,
        descripcion: descripcion || null,
        notas: notas || null,
      })
      setSubmitting(false)
      if (!res.ok) { toast.error(res.error ?? 'Error al actualizar'); return }
      toast.success('Lesión actualizada')
    } else {
      const res = await registrarLesion({
        persona_id: personaId,
        tipo_lesion_slug: tipoSlug,
        zona_corporal: zona,
        gravedad: gravedad as 'leve' | 'moderada' | 'grave' | 'muy_grave',
        fecha_inicio: fechaInicio,
        equipo_id: equipoId || undefined,
        restriccion_actividad: restriccion || undefined,
        diagnostico_medico: diagnostico || undefined,
        tratamiento: tratamiento || undefined,
        descripcion: descripcion || undefined,
        notas: notas || undefined,
      })
      setSubmitting(false)
      if (!res.ok) { toast.error(res.error ?? 'Error al registrar'); return }
      toast.success('Lesión registrada')
    }

    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar lesión' : 'Registrar lesión'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo de lesión *</Label>
              <Select value={tipoSlug} onValueChange={(v) => onTipoChange(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {tiposLesion.map(t => (
                    <SelectItem key={t.slug} value={t.slug}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Gravedad *</Label>
              <Select value={gravedad} onValueChange={(v) => setGravedad(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {GRAVEDADES.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Zona corporal *</Label>
              <Input value={zona} onChange={e => setZona(e.target.value)} placeholder="Ej: tobillo derecho" />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Equipo</Label>
            <Select value={equipoId} onValueChange={(v) => setEquipoId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Sin equipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin equipo</SelectItem>
                {equipos.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Restricción de actividad</Label>
            <Input value={restriccion} onChange={e => setRestriccion(e.target.value)} placeholder="Ej: no puede correr" />
          </div>

          <div className="space-y-1.5">
            <Label>Diagnóstico médico</Label>
            <Textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label>Tratamiento</Label>
            <Textarea value={tratamiento} onChange={e => setTratamiento(e.target.value)} rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} placeholder="Contexto de cómo ocurrió..." />
          </div>

          <div className="space-y-1.5">
            <Label>Notas internas</Label>
            <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || !tipoSlug || !zona || !gravedad || !fechaInicio}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

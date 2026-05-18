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
import { crearLogro, actualizarLogro } from '../lib/actions'
import { TIPOS_LOGRO } from '../lib/tipos'
import type { Logro } from '../lib/tipos'

interface LogroFormProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  personaId: string
  editData?: Logro
}

export function LogroForm({ open, onOpenChange, onSuccess, personaId, editData }: LogroFormProps) {
  const isEdit = !!editData

  const [tipoLogro, setTipoLogro] = useState(editData?.tipo_logro ?? '')
  const [descripcion, setDescripcion] = useState(editData?.descripcion ?? '')
  const [torneoNombre, setTorneoNombre] = useState(editData?.torneo_nombre ?? '')
  const [equipoNombre, setEquipoNombre] = useState(editData?.equipo_nombre ?? '')
  const [anio, setAnio] = useState(editData?.anio?.toString() ?? '')
  const [fechaOtorgado, setFechaOtorgado] = useState(editData?.fecha_otorgado ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)

    const payload = {
      tipo_logro: tipoLogro as any,
      descripcion,
      torneo_nombre: torneoNombre || undefined,
      equipo_nombre: equipoNombre || undefined,
      anio: anio ? parseInt(anio) : undefined,
      fecha_otorgado: fechaOtorgado || undefined,
    }

    const res = isEdit && editData
      ? await actualizarLogro(editData.id, payload)
      : await crearLogro({ persona_id: personaId, ...payload })

    setSubmitting(false)
    if (!res.ok) { toast.error(res.error ?? 'Error'); return }
    toast.success(isEdit ? 'Logro actualizado' : 'Logro agregado')
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar logro' : 'Agregar logro'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo de logro *</Label>
              <Select value={tipoLogro} onValueChange={(v) => setTipoLogro(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {TIPOS_LOGRO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Año</Label>
              <Input type="number" value={anio} onChange={e => setAnio(e.target.value)} placeholder="Ej: 2024" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descripción *</Label>
            <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} placeholder="Ej: Campeón torneo apertura..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Torneo</Label>
              <Input value={torneoNombre} onChange={e => setTorneoNombre(e.target.value)} placeholder="Ej: Apertura 2024" />
            </div>
            <div className="space-y-1.5">
              <Label>Equipo</Label>
              <Input value={equipoNombre} onChange={e => setEquipoNombre(e.target.value)} placeholder="Ej: Hindu Club" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={fechaOtorgado} onChange={e => setFechaOtorgado(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting || !tipoLogro || !descripcion}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

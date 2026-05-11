'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserMinus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { darDeBaja } from '../../_actions'

interface DarDeBajaDialogProps {
  personaId: string
  personaEstado: string
  catalogoMotivos: { slug: string; nombre: string }[]
}

export function DarDeBajaDialog({ personaId, personaEstado, catalogoMotivos }: DarDeBajaDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [motivoSlug, setMotivoSlug] = useState('')
  const [detalle, setDetalle] = useState('')
  const [fechaBaja, setFechaBaja] = useState(() => new Date().toISOString().split('T')[0])

  if (personaEstado === 'baja') return null

  async function handleSubmit() {
    if (!motivoSlug) {
      toast.error('Selecciona un motivo de baja')
      return
    }
    if (!fechaBaja) {
      toast.error('Selecciona una fecha de baja')
      return
    }

    setLoading(true)
    const result = await darDeBaja({
      personaId,
      motivo_baja_slug: motivoSlug,
      motivo_baja_detalle: detalle || undefined,
      fecha_baja: fechaBaja,
    })
    setLoading(false)

    if (result.ok) {
      toast.success(result.message)
      setOpen(false)
      setMotivoSlug('')
      setDetalle('')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <UserMinus className="h-3.5 w-3.5 sm:mr-2" />
        <span className="hidden sm:inline">Dar de baja</span>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dar de baja</DialogTitle>
          <DialogDescription>
            Esta accion marcara a la persona como baja y propagara a todos sus padrones activos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Motivo de baja *</Label>
            <Select value={motivoSlug} onValueChange={(v) => setMotivoSlug(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar motivo..." />
              </SelectTrigger>
              <SelectContent>
                {catalogoMotivos.map((m) => (
                  <SelectItem key={m.slug} value={m.slug}>
                    {m.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha de baja *</Label>
            <Input
              type="date"
              value={fechaBaja}
              onChange={(e) => setFechaBaja(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Detalle (opcional)</Label>
            <Textarea
              placeholder="Motivo adicional o notas..."
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Confirmar baja
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
import { crearReservaAction } from '../lib/actions'
import type { CanchaDisponible } from '../lib/types'

export function ModalNuevaReserva({
  open,
  onClose,
  onCreated,
  canchas,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  canchas: CanchaDisponible[]
}) {
  const [isPending, startTransition] = useTransition()
  const [canchaId, setCanchaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [tipoCliente, setTipoCliente] = useState<'externo'>('externo')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')

  const canchaSeleccionada = canchas.find(c => c.id === canchaId)

  function resetForm() {
    setCanchaId('')
    setFecha('')
    setHoraInicio('')
    setHoraFin('')
    setClienteNombre('')
    setClienteTelefono('')
    setClienteEmail('')
    setNotas('')
    setError('')
  }

  function handleSubmit() {
    if (!canchaId || !fecha || !horaInicio || !horaFin) {
      setError('Completa cancha, fecha y horarios.')
      return
    }

    setError('')
    startTransition(async () => {
      const result = await crearReservaAction({
        cancha_id: canchaId,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        cliente_nombre_externo: clienteNombre || undefined,
        cliente_contacto_telefono: clienteTelefono || undefined,
        cliente_contacto_email: clienteEmail || undefined,
        notas: notas || undefined,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      resetForm()
      onCreated()
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose() } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="modal-nueva-reserva">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cancha */}
          <div className="space-y-1.5">
            <Label>Cancha</Label>
            <Select value={canchaId} onValueChange={(v) => setCanchaId(v ?? '')}>
              <SelectTrigger data-testid="select-cancha">
                <SelectValue placeholder="Elegir cancha" />
              </SelectTrigger>
              <SelectContent>
                {canchas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre} {c.precio_alquiler_hora ? `($${c.precio_alquiler_hora}/h)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canchaSeleccionada?.precio_alquiler_hora && (
              <p className="text-xs text-muted-foreground">
                Tarifa: ${canchaSeleccionada.precio_alquiler_hora}/hora
              </p>
            )}
          </div>

          {/* Fecha + horarios */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                data-testid="input-fecha"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Inicio</Label>
              <Input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                data-testid="input-hora-inicio"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fin</Label>
              <Input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                data-testid="input-hora-fin"
              />
            </div>
          </div>

          {/* Cliente (solo externo por ahora) */}
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Input
              placeholder="Nombre del cliente"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              data-testid="input-cliente-nombre"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Telefono</Label>
              <Input
                placeholder="+54..."
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                data-testid="input-cliente-telefono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@..."
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                data-testid="input-cliente-email"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea
              placeholder="Notas adicionales..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              data-testid="textarea-notas"
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { resetForm(); onClose() }} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} data-testid="btn-crear-reserva">
              {isPending ? 'Creando...' : 'Crear reserva'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

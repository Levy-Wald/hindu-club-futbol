'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { BadgeEstado } from './badge-estado'
import { actualizarEstadoReservaAction, cancelarReservaAction } from '../lib/actions'
import type { ReservaHidratada } from '../lib/types'

export function ModalDetalleReserva({
  reserva,
  onClose,
  onUpdated,
  puedeEditar,
}: {
  reserva: ReservaHidratada | null
  onClose: () => void
  onUpdated: () => void
  puedeEditar: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [metodoPago, setMetodoPago] = useState('')

  if (!reserva) return null

  const formatHora = (h: string) => h?.slice(0, 5) ?? ''

  async function handleConfirmar() {
    startTransition(async () => {
      const result = await actualizarEstadoReservaAction({
        reserva_id: reserva!.id,
        estado: 'confirmada',
      })
      if (result.ok) { onUpdated(); onClose() }
    })
  }

  async function handleMarcarPagada() {
    startTransition(async () => {
      const result = await actualizarEstadoReservaAction({
        reserva_id: reserva!.id,
        estado: 'pagada',
        metodo_pago: metodoPago || 'efectivo',
      })
      if (result.ok) { onUpdated(); onClose() }
    })
  }

  async function handleCompletar() {
    startTransition(async () => {
      const result = await actualizarEstadoReservaAction({
        reserva_id: reserva!.id,
        estado: 'completada',
      })
      if (result.ok) { onUpdated(); onClose() }
    })
  }

  async function handleCancelar() {
    startTransition(async () => {
      const result = await cancelarReservaAction({ reserva_id: reserva!.id })
      if (result.ok) { onUpdated(); onClose() }
    })
  }

  return (
    <Dialog open={!!reserva} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm" data-testid="modal-detalle-reserva">
        <DialogHeader>
          <DialogTitle className="text-base">Detalle de reserva</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado</span>
            <BadgeEstado estado={reserva.estado} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cancha</span>
            <span className="font-medium">{reserva.cancha.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha</span>
            <span>{reserva.evento.fecha}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Horario</span>
            <span>{formatHora(reserva.evento.hora_inicio)} - {formatHora(reserva.evento.hora_fin ?? '')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium">{reserva.cliente_display}</span>
          </div>
          {reserva.tarifa_total != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto</span>
              <span className="font-bold">${reserva.tarifa_total.toLocaleString('es-AR')}</span>
            </div>
          )}
          {reserva.notas && (
            <div>
              <span className="text-muted-foreground">Notas: </span>
              <span>{reserva.notas}</span>
            </div>
          )}
        </div>

        {puedeEditar && (
          <div className="space-y-2 mt-4 pt-4 border-t">
            {reserva.estado === 'pendiente' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleConfirmar} disabled={isPending} data-testid="btn-confirmar-reserva">
                  Confirmar
                </Button>
                <Button size="sm" variant="destructive" onClick={handleCancelar} disabled={isPending} data-testid="btn-cancelar-reserva">
                  Cancelar
                </Button>
              </div>
            )}
            {reserva.estado === 'confirmada' && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Metodo de pago</Label>
                  <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v ?? '')}>
                    <SelectTrigger className="h-8" data-testid="select-metodo-pago">
                      <SelectValue placeholder="Elegir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="mercadopago">MercadoPago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleMarcarPagada} disabled={isPending} data-testid="btn-marcar-pagada">
                    Marcar pagada
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleCancelar} disabled={isPending} data-testid="btn-cancelar-reserva">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
            {reserva.estado === 'pagada' && (
              <Button size="sm" onClick={handleCompletar} disabled={isPending}>
                Marcar completada
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

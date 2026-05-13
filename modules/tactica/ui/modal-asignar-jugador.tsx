'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { SlotConJugador, JugadorPlantel } from '../lib/types'

export function ModalAsignarJugador({
  slot,
  plantel,
  asignadosIds,
  onAsignar,
  onQuitar,
  onClose,
}: {
  slot: SlotConJugador | null
  plantel: JugadorPlantel[]
  asignadosIds: Set<string>
  onAsignar: (persona_id: string) => void
  onQuitar: () => void
  onClose: () => void
}) {
  if (!slot) return null

  const disponibles = plantel.filter((j) => !asignadosIds.has(j.persona_id))

  return (
    <Dialog open={!!slot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto" data-testid="modal-asignar">
        <DialogHeader>
          <DialogTitle className="text-base">{slot.nombre}</DialogTitle>
        </DialogHeader>

        {slot.jugador && (
          <div className="flex items-center justify-between p-2 rounded bg-accent/50 mb-2">
            <span className="text-sm font-medium">
              {slot.jugador.apellido}, {slot.jugador.nombre}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onQuitar}
              className="text-destructive hover:text-destructive"
              data-testid="btn-quitar-jugador"
            >
              Quitar
            </Button>
          </div>
        )}

        <div className="space-y-1">
          {disponibles.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              Todos los jugadores estan asignados.
            </p>
          )}
          {disponibles.map((j) => (
            <button
              key={j.persona_id}
              type="button"
              onClick={() => onAsignar(j.persona_id)}
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent flex items-center gap-2"
              data-testid={`asignar-${j.persona_id}`}
            >
              {j.numero_camiseta && (
                <span className="text-xs font-bold text-muted-foreground w-6 text-right">
                  {j.numero_camiseta}
                </span>
              )}
              <span className="font-medium">
                {j.apellido}, {j.nombre}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

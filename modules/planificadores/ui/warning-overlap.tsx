'use client'

import type { ConflictoOverlap } from '../lib/types'

export function WarningOverlap({
  conflicto,
  onMoverIgual,
  onCancelar,
}: {
  conflicto: ConflictoOverlap
  onMoverIgual: () => void
  onCancelar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancelar}>
      <div
        className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="warning-overlap"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-500 text-xl">&#9888;</span>
          <h2 className="text-lg font-semibold">Conflicto de cancha</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          La cancha <strong>{conflicto.cancha_nombre}</strong> ya tiene eventos en ese horario:
        </p>

        <ul className="space-y-2 mb-6">
          {conflicto.eventos_en_conflicto.map(ev => (
            <li key={ev.id} className="text-sm bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2 border border-amber-200 dark:border-amber-800">
              <span className="font-medium">{ev.titulo}</span>
              <span className="text-muted-foreground ml-2">
                {ev.hora_inicio?.slice(0, 5)} – {ev.hora_fin?.slice(0, 5)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancelar}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            onClick={onMoverIgual}
            className="px-4 py-2 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700"
            data-testid="btn-mover-igual"
          >
            Mover igual
          </button>
        </div>
      </div>
    </div>
  )
}

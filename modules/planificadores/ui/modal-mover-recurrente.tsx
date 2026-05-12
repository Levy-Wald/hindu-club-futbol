'use client'

export function ModalMoverRecurrente({
  onConfirm,
  onCancel,
}: {
  onConfirm: (scope: 'esta_ocurrencia' | 'toda_la_serie') => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-background rounded-lg shadow-lg w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-mover-recurrente"
      >
        <h2 className="text-lg font-semibold mb-2">Evento recurrente</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Este evento forma parte de una serie. ¿Qué querés mover?
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onConfirm('esta_ocurrencia')}
            className="w-full text-left px-4 py-3 border rounded-md hover:bg-accent transition-colors"
            data-testid="btn-scope-esta-ocurrencia"
          >
            <div className="font-medium text-sm">Solo esta fecha</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Crea una excepción. Las demás fechas de la serie no cambian.
            </div>
          </button>

          <button
            onClick={() => onConfirm('toda_la_serie')}
            className="w-full text-left px-4 py-3 border rounded-md hover:bg-accent transition-colors"
            data-testid="btn-scope-toda-la-serie"
          >
            <div className="font-medium text-sm">Toda la serie</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Mueve el evento base y todas las repeticiones futuras.
            </div>
          </button>

          <button
            onClick={onCancel}
            className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="btn-scope-cancelar"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

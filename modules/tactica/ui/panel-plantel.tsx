'use client'

import type { JugadorPlantel } from '../lib/types'

export function PanelPlantel({
  plantel,
  asignadosIds,
  onJugadorClick,
  puedeEditar,
}: {
  plantel: JugadorPlantel[]
  asignadosIds: Set<string>
  onJugadorClick: (jugador: JugadorPlantel) => void
  puedeEditar: boolean
}) {
  const sinAsignar = plantel.filter((j) => !asignadosIds.has(j.persona_id))
  const asignados = plantel.filter((j) => asignadosIds.has(j.persona_id))

  return (
    <div className="space-y-3" data-testid="panel-plantel">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Plantel ({sinAsignar.length} disponibles)
      </h3>

      {sinAsignar.length === 0 && asignados.length === 0 && (
        <p className="text-xs text-muted-foreground">No hay jugadores en el plantel del equipo.</p>
      )}

      {sinAsignar.length > 0 && (
        <div className="space-y-1">
          {sinAsignar.map((j) => (
            <button
              key={j.persona_id}
              type="button"
              onClick={() => onJugadorClick(j)}
              disabled={!puedeEditar}
              className={`
                w-full text-left px-3 py-2 rounded-md text-sm
                border border-border bg-card
                flex items-center gap-2
                ${puedeEditar ? 'hover:bg-accent cursor-pointer' : 'cursor-default'}
              `}
            >
              {j.numero_camiseta && (
                <span className="text-xs font-bold text-muted-foreground w-6 text-right">
                  {j.numero_camiseta}
                </span>
              )}
              <span className="font-medium">
                {j.apellido}, {j.nombre}
              </span>
              {j.posicion_habitual && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {j.posicion_habitual}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {asignados.length > 0 && (
        <>
          <h4 className="text-xs font-medium text-muted-foreground mt-3">
            Asignados ({asignados.length})
          </h4>
          <div className="space-y-1 opacity-60">
            {asignados.map((j) => (
              <div
                key={j.persona_id}
                className="px-3 py-2 rounded-md text-sm border border-border/50 flex items-center gap-2"
              >
                {j.numero_camiseta && (
                  <span className="text-xs font-bold text-muted-foreground w-6 text-right">
                    {j.numero_camiseta}
                  </span>
                )}
                <span className="font-medium text-muted-foreground">
                  {j.apellido}, {j.nombre}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

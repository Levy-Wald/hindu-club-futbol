'use client'

import { useState, useTransition } from 'react'
import { responderInvitacionAction } from '../lib/actions'
import type { InvitacionPendiente } from '../lib/types'

// F1.4 — Panel in-app para que la persona logueada responda sus invitaciones a
// eventos (Aceptar / Rechazar) sin salir del calendario. Cablea la query
// obtenerInvitacionesPendientes + responderInvitacionAction (ya existentes).
export function PanelInvitacionesPendientes({
  invitaciones,
}: {
  invitaciones: InvitacionPendiente[]
}) {
  const [items, setItems] = useState(invitaciones)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  if (items.length === 0) return null

  function responder(id: string, estado: 'aceptado' | 'rechazado') {
    setErrorId(null)
    setPendingId(id)
    startTransition(async () => {
      const res = await responderInvitacionAction({ evento_invitado_id: id, estado })
      setPendingId(null)
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.evento_invitado_id !== id))
      } else {
        setErrorId(id)
      }
    })
  }

  return (
    <div className="rounded-lg border bg-card p-4" data-testid="panel-invitaciones-pendientes">
      <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
        Invitaciones pendientes
        <span className="rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5">
          {items.length}
        </span>
      </h2>
      <ul className="space-y-2">
        {items.map((inv) => (
          <li
            key={inv.evento_invitado_id}
            className="flex items-center justify-between gap-3 rounded-md border p-3"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{inv.titulo ?? '(sin título)'}</p>
              <p className="text-xs text-muted-foreground">
                {inv.fecha_inicio
                  ? new Date(inv.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })
                  : ''}
                {inv.hora_inicio ? ` · ${inv.hora_inicio.slice(0, 5)}` : ''}
                {inv.equipo_nombre ? ` · ${inv.equipo_nombre}` : ''}
              </p>
              {errorId === inv.evento_invitado_id && (
                <p className="text-xs text-error-500 mt-1">No se pudo guardar, reintentá.</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                disabled={pendingId === inv.evento_invitado_id}
                onClick={() => responder(inv.evento_invitado_id, 'rechazado')}
                className="px-3 py-1.5 text-xs border rounded-md hover:bg-accent disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                type="button"
                disabled={pendingId === inv.evento_invitado_id}
                onClick={() => responder(inv.evento_invitado_id, 'aceptado')}
                className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Aceptar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
